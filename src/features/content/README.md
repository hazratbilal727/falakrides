# Website content management

The Website content screen in `/admin` stores its drafts and published content in Neon PostgreSQL through Prisma. No local content files, local database server, or filesystem storage configuration are used.

## Access and editing

Sign in with an active Administrator account. If `CONTENT_ADMIN_PIN` and `CONTENT_SESSION_SECRET` are configured, the existing PIN screen adds a 15-minute editor lock. The PIN never replaces account authentication or role authorization.

Choose a section, edit its fields, then Save draft or Review & publish. Drafts remain private and survive reloads. Public pages poll for publications every five seconds and refresh on focus. The last successful data remains visible during a connection failure.

Version checks reject stale saves. Unsaved-change confirmation protects navigation and locking. If editor access expires, unsaved edits remain in memory and are restored after unlocking.

The existing structured editor manages headings, service copy, FAQs, benefits, steps, catalog names/images/capacities, featured routes, destinations, navigation labels, booking/inquiry text, WhatsApp text, footer, legal pages, and contact information. Publishing related catalog fields updates the corresponding relational records. The separate fleet, fare, service-area, offer, and settings screens also update the public database-backed catalog.

## Configuration and security

Set the pooled Neon `DATABASE_URL` and the direct `DIRECT_URL` in the ignored environment file. Database migrations use the direct connection. Application queries use the Neon serverless adapter. Back up the Neon database rather than local files.

Private API requests require the current account's content permission and, when enabled, a valid PIN session. Writes validate origin, payload size, known field IDs, capacities, contact details, and image identifiers. Rate limits and audit records persist in PostgreSQL. Content is rendered as escaped React text; transactions and optimistic versions protect concurrent updates.

## Checks

With a running development server and a dedicated Neon test database, run the content and backend integration tests described in the root README. Do not run write-enabled tests against production content.
## Current public website

Open **Website content → Current public website** to manage the redesigned public pages. The editor starts with the site's existing three hero slides, three services, six vehicle-package preferences, six itineraries, six FAQs, nine homepage sections, and page text/images.

- Add, edit, duplicate, hide/show, reorder, search, and remove slides, services, vehicle packages, itineraries, and FAQs.
- Hide/show and reorder homepage sections.
- Edit navigation labels, homepage and footer copy, section images, benefits, booking steps, service descriptions/destinations, and package routes.
- Check content, restore the currently published content into the editor, save a private draft, review changed items, and publish.
- A service or vehicle-package page uses its editable slug. Published additions immediately have a public URL and menu entry. Hidden or removed entries leave menus/cards and their detail pages become unavailable.
- Public pages use the same stored `public.website` value as this editor. Publishing refreshes open public pages through the existing five-second poll. Save draft keeps the published site unchanged.

The `public.website` document is versioned within the existing `SiteContent` record. Structured server validation checks known fields, IDs, unique slugs, collection limits, section types, and image references. Historical content IDs remain valid for existing records; obsolete layout controls are hidden from the editor.

Run `node node_modules/tsx/dist/cli.mjs scripts/sync-public-content.ts` to import the current public defaults into an existing database. The import fills missing fields, preserves existing published content and drafts, records an audit entry, and can be run again safely. No schema migration is required.

**Vehicles** manages dispatch fleet records, capacities, category, description, image, and availability. **Fares & routes** manages live route prices, captions, images, and status. **Service areas**, **Offers & packages**, **Reviews & complaints**, and **Settings** continue to synchronize their database-backed public data. Company name, description, phone, and email synchronize between Settings and website content publishing.
