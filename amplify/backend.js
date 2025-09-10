import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
const dailyPuzzle = defineFunction({
    name: 'daily-puzzle',
    entry: './functions/daily-puzzle/handler.ts',
    timeoutSeconds: 30,
    memoryMB: 512,
});
const rotateDaily = defineFunction({
    name: 'rotate-daily',
    entry: './functions/rotate-daily/handler.ts',
    timeoutSeconds: 30,
    memoryMB: 512,
});
const solvePending = defineFunction({
    name: 'solve-pending',
    entry: './functions/solve-pending/handler.ts',
    timeoutSeconds: 60,
    memoryMB: 1024,
});
defineBackend({
    auth,
    data,
    dailyPuzzle,
    rotateDaily,
    solvePending,
});
