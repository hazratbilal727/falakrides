import {readContent} from "@/features/content/store";
import {websiteFromValues} from "@/features/content/website-model";
import PublicPage from "@/components/layout/public-page";
import {BookingCallout, SectionHeading, ServiceCards} from "@/components/public/sections";
export const metadata = {title: "Our Services | Falak Rides", description: "Private airport transfers, city-wise transportation and Ziyarat tours across Makkah, Madinah and Jeddah."};
export default async function Services() {const {published}=await readContent();const {copy:c}=websiteFromValues(published);return <PublicPage title={c.navServices} description={c.servicesPageDescription}><SectionHeading label={c.servicesLabel}><em>{c.servicesAccent}</em> {c.servicesTitle}</SectionHeading><ServiceCards/><div className="taxi-subheading"><BookingCallout/></div></PublicPage>;}
