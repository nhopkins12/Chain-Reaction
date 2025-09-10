import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

const dailyPuzzle = defineFunction({
  name: 'daily-puzzle',
  entry: './functions/daily-puzzle/handler.ts',
  timeoutSeconds: 30,
  memoryMB: 512,
});

defineBackend({
  auth,
  data,
  dailyPuzzle,
});
