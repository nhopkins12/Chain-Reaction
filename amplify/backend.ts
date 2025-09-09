import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';
import { puzzleDaily } from './functions/puzzleDaily/resource';
import { myFirstFunction } from './functions/my-first-function/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  data,
  puzzleDaily,
  myFirstFunction,
});
