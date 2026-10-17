# Falak Rides public design reference

Reviewed https://moveme.cab/ on 15 October 2026 using its rendered page, navigation, stylesheets, booking page, service pages, package directory, and vehicle-package pages.

## Design

| Element | Reference | Falak Rides implementation |
| --- | --- | --- |
| Primary accent | `#8DC73F` lime | Buttons, highlights, icons, active navigation |
| Heading color | `#27144C` purple | Section headings and public page titles |
| Dark text | `#2A2B34` | Card titles and controls |
| Muted text | `#858A90` | Paragraphs and supporting text |
| Section backgrounds | `#FFFFFF`, `#F6F6F7` | Alternating white and light grey sections |
| Category labels | `#FFDC73` | Vehicle category tabs |
| Headings | Oswald, primarily weights 500 and 700 | Locally hosted Oswald |
| Body | Epilogue, primarily 400 | Locally hosted Epilogue, 400/500/700 |
| Additional reference font | Poppins in some widgets | Epilogue used consistently in Falak Rides forms |
| Layout | Approximately 1140px content width, three-column cards, generous vertical spacing | Shared responsive public design |

Font licenses are included alongside the local fonts in `public/fonts/`. Vehicle and destination photographs used from the requested reference are stored in `public/images/reference/`; the reference's logos and business contact information are not used.

## Pages and interactions

- Public header: Home, About Us, Our Services dropdown, Packages dropdown, Contact Us, Book Now. The mobile menu contains the same destinations and expandable groups.
- Homepage: three-image taxi slideshow, introduction, services, six vehicle preference cards, booking steps, benefits, booking callout, published testimonials when present, FAQ accordion, shared contact footer.
- Service detail pages: airport transfers, city-wise services, and Ziyarat taxi services. Each includes route information, vehicle choices, and FAQs.
- Packages: sedan, Staria, GMC, Hiace, Coaster, and bus preference pages with six suggested transport itineraries each.
- Existing routes, offers, vehicle catalog, about, contact, booking, FAQ, booking history, and policy pages use the shared public typography and colors.
- Booking buttons continue to use the existing booking dialog and API. Package/vehicle preferences are included in the request notes; an exact active catalog match is selected when available.
- Published route prices and reviews remain sourced from the Falak Rides database. No competitor fares, review counts, operating history, payment methods, or cancellation promises have been imported.
- The reference's email capture is implemented as a clearly labelled travel-information inquiry using the existing `/api/inquiries` endpoint, rather than claiming an email newsletter subscription.
- Telephone, email, and WhatsApp links use Falak Rides contact settings.
- Slideshow controls support pause, manual navigation, keyboard focus, and reduced-motion preferences. Menus support Escape and outside-click dismissal. Forms retain the existing unsaved-change protection.

## Source pages

- https://moveme.cab/
- https://moveme.cab/about-us/
- https://moveme.cab/booking/
- https://moveme.cab/airport-transfers/
- https://moveme.cab/city-wise-services/
- https://moveme.cab/ziyarat-taxi-services/
- https://moveme.cab/packages/
- https://moveme.cab/hiace-packages/
- https://moveme.cab/bus-packages/
- https://moveme.cab/contact-us/

The reference contains placeholder FAQ/process copy and unverified counters. Falak Rides uses original journey-specific copy and only published customer reviews instead.

## Verification

- Production build passed, including TypeScript and all 42 generated routes.
- ESLint passed for the changed public pages, shared components, booking integration, and sitemap.
- Headless Chrome checks passed for desktop service dropdowns, mobile menu/package expansion, FAQ expansion, vehicle booking launch, and vehicle preference retention in request notes.
- All 22 checked valid public URLs returned HTTP 200, including every service and package page.
- Desktop and 390px mobile homepage checks found no horizontal overflow, broken images, or browser exceptions.
- Inspected desktop, mobile, and full-page screenshots. No test bookings or contact inquiries were submitted.

## Admin synchronization

The public design now reads the `public.website` document from the existing database-backed content publisher. Admin → Website content → Current public website manages the current slides, services, vehicle preferences, itineraries, FAQs, homepage section order/visibility, navigation labels, and page text/images. Services and package pages resolve published slugs dynamically, so additions work without rebuilding the application. The former layout's unused controls are hidden from the editor.

The public preference/package lists and the dispatch fleet retain their separate purposes: the content editor manages presentation and suggested itineraries; Vehicles manages actual capacities and availability. Both appear in admin, and the actual fleet remains the source for booking vehicle selection.

## Synchronization verification

- Imported the existing public content into the live `SiteContent` record, preserving existing fields and drafts. A second import reported `changed: false`.
- 22 unit tests passed for content validation, publish review, draft editing, access security, and admin utilities.
- 11 isolated database integration tests passed, including private drafts, publish synchronization, optimistic conflicts, authenticated CRUD, dynamic public page creation, and hiding service pages.
- Production build passed with dynamic service/package routes and a live sitemap.
- Isolated production browser checks passed for profile and form protection, booking/cancellation, admin record actions, website duplicate/remove, saving private drafts, publishing, and updating an already-open public page.
