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

export const handler = async () => {
  const client = generateClient<Schema>();
  const todayId = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

  // If already exists, do nothing (id is primary key)
  const existing = await client.models.DailyPuzzle.get({ id: todayId });
  if (existing.data) {
    return { statusCode: 200, body: `DailyPuzzle exists for ${todayId}` };
  }

  const pair = pickDailyPair(todayId);
  const payload: DailyPuzzle = {
    id: todayId,
    startWord: pair.startWord,
    targetWord: pair.targetWord,
  } as DailyPuzzle;

  await client.models.DailyPuzzle.create(payload);
  return { statusCode: 200, body: `Created DailyPuzzle for ${todayId}` };
};

