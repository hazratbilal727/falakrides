import {readContent} from "@/features/content/store";
import {photo} from "@/utils/images";
import {ContentText} from "@/features/content/public-content";
import Link from "next/link";
import Footer from "./footer";
import WhatsAppChat from "@/components/shared/whatsapp-chat";
export default async function PublicPage({title, description, children}: {title: React.ReactNode; description: React.ReactNode; children: React.ReactNode}) {
  const {published}=await readContent();
  const bannerImage=published["layout.bannerImage"]??"/images/reference/hero-umrah.webp";
  const banner=bannerImage ? photo(bannerImage) : "";
  return <><main id="main"><section className="taxi-page-banner" style={{backgroundImage:`linear-gradient(90deg,#1d1825c9,#21162cad)${banner ? `,url("${banner}")` : ""}`}}><div className="taxi-container"><nav aria-label="Breadcrumb"><Link href="/"><ContentText id="ui.components-layout-public-page.1" fallback="Home"/></Link><span>/</span><span>{title}</span></nav><h1>{title}</h1><p>{description}</p></div></section><div className="taxi-container taxi-page-content">{children}</div></main><Footer/><WhatsAppChat/></>;
}
