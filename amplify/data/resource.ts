import { a, defineData } from '@aws-amplify/backend';

// Minimal example model for storing scores per user
const schema = a.schema({
  Score: a
    .model({
      owner: a.string(),
      steps: a.integer().required(),
      words: a.string().array().required(),
      createdAt: a.datetime().default('now'),
    })
    .authorization((allow) => [allow.owner()]),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

