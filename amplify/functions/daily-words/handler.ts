import type { EventBridgeHandler } from "aws-lambda";
import { generate, count } from "random-words";

import type { Schema } from '../../data/resource';

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/daily-words';

// Configure Amplify for the Lambda environment
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

// Strongly-typed Data client
const client = generateClient<Schema>();

export const handler: EventBridgeHandler<"Scheduled Event", null, void> = async (event) => {
  await client.models.DailyPuzzle.create({startWord: generate(1)[0], targetWord: generate(1)[0]})
}


// export const handler: Handler = async (event) => {
// export const handler: Schema["testFunction"]["functionHandler"] = async (event) => {

//   await client.models.DailyPuzzle.create({startWord: "test", targetWord: "tester"})

//   // 3) Create or delete examples (for reference)
//   // await client.models.Player.create({ id: crypto.randomUUID(), name: 'New', score: 0, updatedAt: new Date().toISOString() });
//   // await client.models.Player.delete({ id: 'some-id' });

//   return `Reconciled`
// };