import {readContent} from "@/features/content/store";
import {websiteFromValues} from "@/features/content/website-model";
import PublicPage from "@/components/layout/public-page";
import {SectionHeading, VehicleCards} from "@/components/public/sections";
import Fleet from "@/features/fleet/components/fleet";
export const metadata = {title: "Our Vehicles | Falak Rides", description: "Explore private sedan, family, SUV and group vehicle preferences. Confirm availability and capacity with our team."};
export default async function Vehicles() {const {published}=await readContent();const {copy:c}=websiteFromValues(published);return <PublicPage title={c.vehiclesTitle} description={c.vehiclesDescription}><SectionHeading label={c.fleetLabel}><em>{c.fleetAccent}</em> {c.fleetTitle}</SectionHeading><VehicleCards/><div className="taxi-subheading"><SectionHeading label="Current Catalog" description="View the vehicles currently listed by our team, including passenger and luggage capacities."><em>Available Vehicle</em> Information</SectionHeading></div><Fleet/></PublicPage>;}
