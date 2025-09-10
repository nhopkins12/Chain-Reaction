import { defineBackend, defineFunction } from '@aws-amplify/backend';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { auth } from './auth/resource';
import { data } from './data/resource';

const dailyPuzzle = defineFunction({
  name: 'daily-puzzle',
  entry: './functions/daily-puzzle/handler.ts',
  timeoutSeconds: 30,
  memoryMB: 512,
});

const backend = defineBackend({
  auth,
  data,
  dailyPuzzle,
});

// Schedule the daily puzzle setter at 00:00 UTC
const dailyRule = new events.Rule(backend.stack, 'DailyPuzzleSchedule', {
  schedule: events.Schedule.cron({ minute: '0', hour: '0' }),
});
dailyRule.addTarget(new targets.LambdaFunction(dailyPuzzle.resources.lambda));
