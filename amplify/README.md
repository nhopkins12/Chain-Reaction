Amplify Gen 2 backend for this project.

Common commands (run from this folder):

- Sandbox (ephemeral dev):
  - `npm run sandbox`

- Persistent env (dev):
  - `npm run deploy:dev`
  - `npm run outputs:dev` (writes to `../frontend/amplify_outputs.json`)

Prereqs:
- Node 18+
- AWS credentials in your shell (via `aws configure` or `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION`).

