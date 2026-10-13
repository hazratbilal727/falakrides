# Admin operations

`/admin` requires an active Better Auth session. Server layout authorization protects rendered data; every API independently checks the current database role and account status.

`data/modules.ts` contains the existing UI field/column definitions, with no fictional records. `server.ts` maps those fields to relational Prisma models, validates writes, serializes records for the existing UI, and audits mutations. Existing record dialogs, search, filters, export controls, settings, and sidebar styles are preserved.

Records are loaded server-side and refreshed every five seconds. Edits carry `_version`; competing saves/removals return 409 and keep the editor open. Foreign-key constraints protect bookings, customers, and payment relationships. UI permission checks supplement server enforcement and never replace it.

Team invitations return a one-time activation URL in the existing toast. Share it through an approved channel; no invitation email is sent automatically. Public sign-up is disabled. Active roles: Administrator, Dispatcher, Finance, Viewer. Disabling a team member revokes sessions. The last active administrator and the current administrator's access cannot be removed by team CRUD.

Inquiries appear in Reviews & complaints as Inquiry entries; they have no rating. Notification read/dismiss states persist per administrator. Delivery requires configured external providers; drafts and failures remain visible instead of simulating a successful send.

Cash/bank payment entries are staff bookkeeping. Card payments and refunds require a verified provider transaction. Exported rows exclude internal version metadata. Revenue charts use recorded paid timestamps; date filters use Saudi calendar dates rather than fixed demonstration dates.