import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// Schema: daily Puzzle + Score (public reads; public create for Score)
const schema = a.schema({
  Puzzle: a.model({
    date: a.string().required(), // YYYY-MM-DD (UTC recommended)
    startWord: a.string().required(),
    targetWord: a.string().required(),
    bestPath: a.string().array(),
    steps: a.integer(),
    published: a.boolean().default(false),
    createdAt: a.datetime().default('now'),
  }),
  Score: a.model({
    puzzleId: a.string().required(),
    name: a.string().required(),
    steps: a.integer().required(),
    words: a.string().array().required(),
    createdAt: a.datetime().default('now'),
  }),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: { expiresInDays: 365 },
    additionalAuthorizationModes: ['iam'],
  },
});
