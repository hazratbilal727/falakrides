import type {Metadata} from "next";
import Footer from "@/components/layout/footer";
import WhatsAppChat from "@/components/shared/whatsapp-chat";
import HomepageContent from "@/components/public/homepage-content";
import {readContent} from "@/features/content/store";
export async function generateMetadata():Promise<Metadata>{const {published}=await readContent();return {title:published["seo.title"]??"Falak Rides | Umrah Taxi, Ziyarat & Airport Transfers",description:published["seo.description"]??"Arrange private Umrah taxis, airport transfers and Ziyarat trips across Makkah, Madinah and Jeddah with Falak Rides."};}
export default function Home(){return <><main id="main"><HomepageContent/></main><Footer/><WhatsAppChat/></>;}
