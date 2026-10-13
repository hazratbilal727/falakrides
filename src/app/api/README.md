# APIs

All JSON responses are no-store. Private handlers enforce database-backed authentication and authorization. Mutations require the configured same origin and application/json, except the signed Stripe webhook. JSON body sizes are bounded. Do not infer authorization from the proxy or UI controls.

| Endpoint | Methods | Access |
| --- | --- | --- |
| `/api/auth/*` | GET, POST | Better Auth session/sign-in/sign-out; public admin sign-up disabled |
| `/api/admin` | GET | Active administrator account; per-module read filtering |
| `/api/admin/{module}` | POST | Module write permission |
| `/api/admin/{module}/{id}` | PATCH, DELETE | Module write permission, current record version |
| `/api/admin/settings` | PUT | Administrator |
| `/api/admin/profile` | GET, PATCH | Own active staff account |
| `/api/admin/notices` | PATCH | Own persisted notification state |
| `/api/admin/notifications/{id}/send` | POST | Notification write permission and configured delivery provider |
| `/api/admin/payments/{id}/refund` | POST | Payment write permission and verified card transaction |
| `/api/content` | GET | Published values/catalog only |
| `/api/content?admin=1` | GET | Content write permission and optional content PIN lock |
| `/api/content` | POST | Content write permission, optional PIN lock, optimistic content version |
| `/api/content/access` | POST | Content write permission plus PIN validation |
| `/api/profile` | GET, PUT | Own opaque visitor session; PUT creates one if needed |
| `/api/bookings` | GET, POST | Own visitor records; POST creates Pending requests |
| `/api/bookings/{reference}` | PATCH | Ownership and optimistic booking version; cancel/reschedule |
| `/api/bookings/{reference}/checkout` | POST | Ownership, Confirmed status, authoritative fare, configured Stripe |
| `/api/inquiries` | POST | Validated/rate-limited public inquiries |
| `/api/team/activate` | POST | Unexpired single-use invitation token |
| `/api/payments/stripe/webhook` | POST | Stripe signature, timestamp, amount/currency/reference checks |

Booking references, prices, role permissions, status changes, idempotency, and database relationships are server-authoritative. An unverified name, email, phone, or booking reference never grants customer access. Provider credentials are server-only. See the root README for setup and live-provider limitations.