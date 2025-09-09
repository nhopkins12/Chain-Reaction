import { defineFunction } from '@aws-amplify/backend';

export const puzzleDaily = defineFunction({
  name: 'puzzleDaily',
  entry: './handler.ts',
  // timeoutSeconds: 60,
  // memoryMB: 1024,
  // environment: {
  //   PUZZLE_TZ: 'UTC',
  // },
});
