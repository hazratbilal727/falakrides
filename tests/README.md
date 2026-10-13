# Tests

Run `node --test tests/unit/*.test.mjs` for pure business logic, content validation, and export checks.

Backend and browser integration tests require a running development server, a dedicated Neon test database, and configured administrator credentials. Do not use a production Neon connection for write-enabled tests. Temporary test records are cleaned up after each run.

- `npm.cmd run test:backend`: authentication, role permissions, CRUD, validation, booking ownership/idempotency/cancellation, profiles, inquiries, publishing, and operational records.
- `node --test tests/integration/content.test.mjs`: public content visibility and required administrator authentication.
- `npm.cmd run test:browser`: profile saving, unsaved-change protection, browser navigation, real booking requests/cancellation, admin settings, and record dialogs. Uses installed Chrome through DevTools; override CHROME_PATH or TEST_BASE_URL as needed.

Run `npm.cmd run lint`, TypeScript checks, and `npm.cmd run build` for application validation. Tests do not require a local PostgreSQL server.