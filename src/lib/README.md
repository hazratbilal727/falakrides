# Server integrations

- `db/`: shared Prisma client and Neon serverless adapter. Runtime reads `DATABASE_URL`; Prisma migrations read `DIRECT_URL` when configured.
- `auth/`: Better Auth staff sessions, database role/status checks, and opaque visitor-session ownership.
- `security/`: same-origin requests, bounded JSON parsing, validation errors, and database-backed rate limiting.

These integrations are server-side. Database and provider credentials belong in ignored environment files, never client imports or NEXT_PUBLIC variables. No local PostgreSQL runtime or file-backed database configuration is required.