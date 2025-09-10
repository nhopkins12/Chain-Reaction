import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';

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

export const handler = async () => {
  const client = generateClient<Schema>();
  const now = new Date();
  const todayId = isoDate(now); // YYYY-MM-DD (UTC)
  const tomorrowId = isoDate(plusDays(now, 1));

  // Ensure today exists and is active
  const today = await client.models.DailyPuzzle.get({ id: todayId });
  if (!today.data) {
    const pair = pickDailyPair(todayId);
    const payload: DailyPuzzle = {
      id: todayId,
      startWord: pair.startWord,
      targetWord: pair.targetWord,
      status: 'active',
      computeState: 'pending',
    } as DailyPuzzle;
    await client.models.DailyPuzzle.create(payload);
  } else if (today.data.status !== 'active') {
    await client.models.DailyPuzzle.update({ id: todayId, status: 'active' });
  }

  // Ensure tomorrow exists and is next
  const tomorrow = await client.models.DailyPuzzle.get({ id: tomorrowId });
  if (!tomorrow.data) {
    const pair = pickDailyPair(tomorrowId);
    const payload: DailyPuzzle = {
      id: tomorrowId,
      startWord: pair.startWord,
      targetWord: pair.targetWord,
      status: 'next',
      computeState: 'pending',
    } as DailyPuzzle;
    await client.models.DailyPuzzle.create(payload);
  } else if (tomorrow.data.status !== 'next') {
    await client.models.DailyPuzzle.update({ id: tomorrowId, status: 'next' });
  }

  // Optionally archive yesterday if present and still active
  const yesterdayId = isoDate(plusDays(now, -1));
  const yesterday = await client.models.DailyPuzzle.get({ id: yesterdayId });
  if (yesterday.data && yesterday.data.status === 'active') {
    await client.models.DailyPuzzle.update({ id: yesterdayId, status: 'archived' });
  }

  return { statusCode: 200, body: `Rotated daily puzzles for ${todayId}` };
};

