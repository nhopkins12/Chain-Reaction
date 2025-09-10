import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { solve } from '../shared/solver';

type DailyPuzzle = Schema['DailyPuzzle']['type'];

// Small starter list; replace/extend with your curated word list
const WORDS = [
  'START', 'STONE', 'ANGLE', 'PLANE', 'STEEL', 'TRACK', 'CRANE', 'LIGHT', 'TREND', 'BRAVE',
  'RIVER', 'MIGHT', 'CLOUD', 'SOUND', 'SWEET', 'EARTH', 'FRAME', 'GRACE', 'HEART', 'END'
];

// Deterministic seeded RNG from date string
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return h >>> 0;
}

function pickDailyPair(dateId: string): { startWord: string; targetWord: string } {
  const rng = mulberry32(hashString(dateId));
  const a = WORDS[Math.floor(rng() * WORDS.length)];
  // Re-roll until different word
  let b = WORDS[Math.floor(rng() * WORDS.length)];
  if (WORDS.length > 1) {
    while (b === a) b = WORDS[Math.floor(rng() * WORDS.length)];
  }
  return { startWord: a.toUpperCase(), targetWord: b.toUpperCase() };
}

function isoDate(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function plusDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

type OrchestrateEvent = {
  date?: string; // YYYY-MM-DD (UTC). Defaults to today.
  solveAll?: boolean; // if true, solve any pending puzzles, not just today/tomorrow
  archiveYesterday?: boolean; // default true
  forceResolve?: boolean; // if true, recompute even if computeState is 'ready'
};

export const handler = async (event: OrchestrateEvent = {}) => {
  const client = generateClient<Schema>();

  const now = new Date();
  const baseId = event.date ?? isoDate(now);

  const baseDate = new Date(baseId + 'T00:00:00.000Z');
  if (Number.isNaN(baseDate.getTime())) {
    return { statusCode: 400, body: `Invalid date: ${event.date}` };
  }

  const todayId = isoDate(baseDate);
  const tomorrowId = isoDate(plusDays(baseDate, 1));
  const yesterdayId = isoDate(plusDays(baseDate, -1));

  const summary: any = { todayId, tomorrowId, yesterdayId, actions: [] };

  // Upsert today's puzzle as active
  const existingToday = await client.models.DailyPuzzle.get({ id: todayId });
  if (!existingToday.data) {
    const pair = pickDailyPair(todayId);
    const payload: DailyPuzzle = {
      id: todayId,
      startWord: pair.startWord,
      targetWord: pair.targetWord,
      status: 'active',
      computeState: 'pending',
    } as DailyPuzzle;
    await client.models.DailyPuzzle.create(payload);
    summary.actions.push(`created:active:${todayId}`);
  } else if (existingToday.data.status !== 'active') {
    await client.models.DailyPuzzle.update({ id: todayId, status: 'active' });
    summary.actions.push(`updated:status:active:${todayId}`);
  }

  // Upsert tomorrow's puzzle as next
  const existingTomorrow = await client.models.DailyPuzzle.get({ id: tomorrowId });
  if (!existingTomorrow.data) {
    const pair = pickDailyPair(tomorrowId);
    const payload: DailyPuzzle = {
      id: tomorrowId,
      startWord: pair.startWord,
      targetWord: pair.targetWord,
      status: 'next',
      computeState: 'pending',
    } as DailyPuzzle;
    await client.models.DailyPuzzle.create(payload);
    summary.actions.push(`created:next:${tomorrowId}`);
  } else if (existingTomorrow.data.status !== 'next') {
    await client.models.DailyPuzzle.update({ id: tomorrowId, status: 'next' });
    summary.actions.push(`updated:status:next:${tomorrowId}`);
  }

  // Optionally archive yesterday
  if (event.archiveYesterday !== false) {
    const existingYesterday = await client.models.DailyPuzzle.get({ id: yesterdayId });
    if (existingYesterday.data && existingYesterday.data.status === 'active') {
      await client.models.DailyPuzzle.update({ id: yesterdayId, status: 'archived' });
      summary.actions.push(`archived:${yesterdayId}`);
    }
  }

  // Decide which puzzles to solve
  const toSolveIds = new Set<string>();
  toSolveIds.add(todayId);
  toSolveIds.add(tomorrowId);

  if (event.solveAll) {
    const list = await client.models.DailyPuzzle.list();
    for (const p of list.data ?? []) {
      if (p.computeState === 'pending' || event.forceResolve) {
        if (p.id) toSolveIds.add(p.id);
      }
    }
  }

  let solved = 0;
  for (const id of toSolveIds) {
    const pRes = await client.models.DailyPuzzle.get({ id });
    const p = pRes.data;
    if (!p) continue;
    const start = (p.startWord ?? '').toString();
    const target = (p.targetWord ?? '').toString();
    if (!start || !target) continue;

    const shouldSolve = event.forceResolve || !p.computeState || p.computeState === 'pending' || p.computeState === 'failed';
    if (!shouldSolve) continue;

    await client.models.DailyPuzzle.update({ id, computeState: 'solving' });
    const result = solve(start, target, WORDS, {
      minOverlap: 2,
      minWordLength: 3,
      maxSteps: 8,
      allowReuse: false,
    });
    if (!result) {
      await client.models.DailyPuzzle.update({ id, computeState: 'failed' });
      summary.actions.push(`failed:${id}`);
      continue;
    }
    await client.models.DailyPuzzle.update({
      id,
      bestSteps: result.steps,
      bestCharacters: result.characters,
      bestChain: result.chain,
      computeState: 'ready',
    } as Partial<DailyPuzzle> & { id: string });
    solved += 1;
    summary.actions.push(`solved:${id}`);
  }

  summary.solved = solved;
  return { statusCode: 200, body: JSON.stringify(summary) };
};

