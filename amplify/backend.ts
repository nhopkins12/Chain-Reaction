import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { testFunction } from './functions/test-function/resource'
import { dailyWords } from './functions/daily-words/resource';

// const orchestrate = defineFunction({
//   name: 'orchestrate-puzzle',
//   entry: './functions/orchestrate/handler.ts',
//   timeoutSeconds: 60,
//   memoryMB: 1024,
// });

defineBackend({
  auth,
  data,
  testFunction,
  dailyWords,
});
