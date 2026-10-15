import PublicPage from "@/components/layout/public-page";
import Link from "next/link";
import Booking from "@/features/bookings/components/booking";
export const metadata = {title: "Book a Ride | Falak Rides", description: "Plan your pickup, destination and schedule. Our team confirms availability and the full fare in SAR."};
export default async function BookingPage({searchParams}: {searchParams: Promise<{vehicle?: string | string[]; package?: string | string[]}>}) {
  const params = await searchParams;
  const preference = {vehicle: typeof params.vehicle === "string" ? params.vehicle.slice(0,100) : undefined, package: typeof params.package === "string" ? params.package.slice(0,100) : undefined};
  return <PublicPage title="Book a Ride" description={metadata.description}><Booking key={`${preference.vehicle ?? ""}:${preference.package ?? ""}`} preference={preference}/><p className="disclosure"><Link href="/policies">Review policies before confirming your ride.</Link></p></PublicPage>;
}
