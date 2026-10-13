import PublicPage from "@/components/layout/public-page";
import BookingHistory from "@/features/bookings/components/booking-history";
import Link from "next/link";
export const metadata={title:"My Bookings | Falak Rides",description:"Help with upcoming rides, booking history and cancellation requests."};
export default function Page(){return <PublicPage title="My Bookings" description="Help with upcoming rides, booking history and cancellation requests."><BookingHistory/><Link className="button" href="/contact">Contact booking support ?</Link></PublicPage>;}