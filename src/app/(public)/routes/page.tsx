import PublicPage from "@/components/layout/public-page";
import {CatalogRoutes, SectionHeading} from "@/components/public/sections";
import {readContent} from "@/features/content/store";
import {getCatalog} from "@/features/content/catalog";
import Link from "next/link";
export const metadata = {title: "Popular Routes | Falak Rides", description: "Explore private routes between Makkah, Madinah, Jeddah and the airports."};
export default async function Routes() {const {published,catalog} = await readContent();const {routes} = getCatalog(published,catalog);return <PublicPage title="Popular Routes" description="Airport arrivals, hotel transfers, and connections between the holy cities."><SectionHeading label="City-wise Services"><em>Connecting</em> Your Destinations</SectionHeading><CatalogRoutes routes={routes}/><p className="taxi-note">Need another route or an extra stop? <Link href="/contact">Share your itinerary with our team.</Link></p></PublicPage>;}
