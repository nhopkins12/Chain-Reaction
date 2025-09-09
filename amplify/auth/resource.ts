import { defineAuth } from '@aws-amplify/backend';

// Basic Cognito auth: email sign-in
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});

