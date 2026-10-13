import Header from "@/components/layout/header";
import {connection} from "next/server";
import {readContent} from "@/features/content/store";
import {PublicContent} from "@/features/content/public-content";
import BookingPopup from "@/features/bookings/components/booking-popup";
export default async function PublicLayout({children}: {children: React.ReactNode}) {
  await connection();
  const content = await readContent();
  return <PublicContent initial={content.published} catalog={content.catalog!} revision={content.publishedAt}><Header/>{children}<BookingPopup/></PublicContent>;
}
