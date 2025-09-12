import { defineFunction } from "@aws-amplify/backend";

export const dailyWords = defineFunction({
  name: "daily-words",
  schedule: "every 1m",
  entry: './handler.ts',
});