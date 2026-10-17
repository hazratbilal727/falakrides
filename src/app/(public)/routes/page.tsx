import {ContentText} from "@/features/content/public-content";
import PublicPage from "@/components/layout/public-page";
import {CatalogRoutes, SectionHeading} from "@/components/public/sections";
import {readContent} from "@/features/content/store";
import {getCatalog} from "@/features/content/catalog";
import Link from "next/link";
export const metadata = {title: "Popular Routes | Falak Rides", description: "Explore private routes between Makkah, Madinah, Jeddah and the airports."};
export default async function Routes() {const {published,catalog} = await readContent();const {routes} = getCatalog(published,catalog);return <PublicPage title={<ContentText id="ui.routes.1" fallback="Popular Routes"/>} description={<ContentText id="ui.routes.2" fallback="Airport arrivals, hotel transfers, and connections between the holy cities."/>}><SectionHeading label={<ContentText id="ui.routes.3" fallback="City-wise Services"/>}><em><ContentText id="ui.routes.4" fallback="Connecting"/></em>{" "}<ContentText id="ui.routes.5" fallback="Your Destinations"/></SectionHeading><CatalogRoutes routes={routes}/><p className="taxi-note"><ContentText id="ui.routes.6" fallback="Need another route or an extra stop? "/><Link href="/contact"><ContentText id="ui.routes.7" fallback="Share your itinerary with our team."/></Link></p></PublicPage>;}
