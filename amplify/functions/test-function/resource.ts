import { defineFunction } from '@aws-amplify/backend';

export const testFunction = defineFunction({
    name: 'test-function',
    entry: './handler.ts',
});