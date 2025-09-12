import { defineFunction } from "@aws-amplify/backend";

export const dailyWords = defineFunction({
  name: "daily-words",
  schedule: "every day",
  entry: './handler.ts',
});