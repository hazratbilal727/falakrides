# Backend conversion

The existing Next.js App Router UI lives under `src/app`, with reusable public forms and feature-specific admin, booking, fleet, and content modules. Public marketing copy, styles, layout, images, and field IDs are retained.

## Conversion scope

The following list records the original integration points and the conversion implemented for each. It is an implementation record, rather than an outstanding task list. PostgreSQL storage, protected admin APIs, public synchronization, booking ownership, and persisted profiles are implemented.

- `features/admin/data/modules.ts`: module definitions plus fictional operational records. Keep definitions; do not migrate fictional records.
- `data/catalog.ts`: existing public fleet, destinations, and featured routes. Import these once so the public content remains identical, then read from PostgreSQL.
- `features/content/store.ts`: JSON draft/published document. Import the existing document without overwriting it; replace storage with transactional PostgreSQL operations and optimistic concurrency.
- `features/content/public-content.tsx`: existing five-second synchronization. Extend it to include database fleet, routes, service areas, offers, and settings.
- `features/bookings/components`: two independent request flows. Persist both through one server-validated booking service; generate references on the server and enforce ownership for cancellation/rescheduling.
- `components/forms/contact-form.tsx`: email handoff. Store inquiries for the admin team and retain the email handoff when requested.
- Public profile: localStorage. Move to database storage with an opaque HttpOnly visitor-session cookie; never grant booking access by name, phone, or unverified email.
- Admin authentication and dashboard routes: replaced the original unprotected preview with Better Auth database sessions and current role/status checks in every private handler and server layout.
- Admin records/settings/notifications: replace React-only writes with validated, audited transactions and persisted read/dismiss state.
- Reports/chart/filters: calculate from stored records, not hardcoded dates or trend samples.

## Security and operation

Prisma with PostgreSQL, integer halalas for money, restrictive role permissions, bounded request bodies, same-origin mutation checks, database-backed rate limiting, audit trails, optimistic update versions, and idempotent booking creation. Admin credentials are initialized locally and never shipped in client code. Preserve entered values on failed requests and existing unsaved-change confirmations.

External card processing, bank refunds, WhatsApp/SMS delivery, and outbound email need real provider credentials. Store workflow records and report configuration errors honestly; do not label unsent messages or unpaid/refunded transactions as completed externally.

## Verification

The isolated verification runner applies migrations to a temporary Neon schema and tests authorization, validation, CRUD, concurrency, public synchronization, and browser flows without modifying application records. Lint, unit tests, TypeScript, and the production build are checked separately. Live external provider delivery and payment processing still require provider credentials.
