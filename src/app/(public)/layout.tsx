import Header from "@/components/layout/header";
import {connection} from "next/server";
import localFont from "next/font/local";
import {readContent} from "@/features/content/store";
import {PublicContent} from "@/features/content/public-content";
import BookingPopup from "@/features/bookings/components/booking-popup";
import "./public-design.css";
const heading = localFont({src: [{path: "../../../public/fonts/oswald.ttf", weight: "400"}, {path: "../../../public/fonts/oswald-500.ttf", weight: "500"}, {path: "../../../public/fonts/oswald-700.ttf", weight: "700"}], variable: "--font-taxi-heading", display: "swap"});
const body = localFont({src: [{path: "../../../public/fonts/epilogue.ttf", weight: "400"}, {path: "../../../public/fonts/epilogue-500.ttf", weight: "500"}, {path: "../../../public/fonts/epilogue-700.ttf", weight: "700"}], variable: "--font-taxi-body", display: "swap"});
export default async function PublicLayout({children}: {children: React.ReactNode}) {
  await connection();
  const content = await readContent();
  return <PublicContent initial={content.published} catalog={content.catalog!} revision={content.publishedAt}><div className={`public-site ${heading.variable} ${body.variable}`}><Header/>{children}<BookingPopup/></div></PublicContent>;
}
