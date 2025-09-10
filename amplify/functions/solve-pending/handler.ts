import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../data/resource';
import { solve } from '../shared/solver';

type DailyPuzzle = Schema['DailyPuzzle']['type'];

// Small starter list; replace/extend with your curated word list
const WORDS = [
  'START', 'STONE', 'ANGLE', 'PLANE', 'STEEL', 'TRACK', 'CRANE', 'LIGHT', 'TREND', 'BRAVE',
  'RIVER', 'MIGHT', 'CLOUD', 'SOUND', 'SWEET', 'EARTH', 'FRAME', 'GRACE', 'HEART', 'END'
];

export const handler = async () => {
  const client = generateClient<Schema>();

  // List all puzzles and filter locally (simpler; add index in prod)
  const list = await client.models.DailyPuzzle.list();
  const pending = (list.data || []).filter(
    (p) => (p.status === 'active' || p.status === 'next' || !p.status) && (p.computeState === 'pending' || !p.computeState)
  );

  let solvedCount = 0;

  for (const p of pending) {
    // Mark as solving to avoid duplicate work
    await client.models.DailyPuzzle.update({ id: p.id, computeState: 'solving' });

    const result = solve(p.startWord, p.targetWord, WORDS, {
      minOverlap: 2,
      minWordLength: 3,
      maxSteps: 8,
      allowReuse: false,
    });

    if (!result) {
      await client.models.DailyPuzzle.update({ id: p.id, computeState: 'failed' });
      continue;
    }

    await client.models.DailyPuzzle.update({
      id: p.id,
      bestSteps: result.steps,
      bestCharacters: result.characters,
      bestChain: result.chain,
      computeState: 'ready',
    } as Partial<DailyPuzzle> & { id: string });

    solvedCount += 1;
  }

  return { statusCode: 200, body: `Solved ${solvedCount} pending puzzles` };
};

