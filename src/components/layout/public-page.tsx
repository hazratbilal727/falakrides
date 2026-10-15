import Link from "next/link";
import Footer from "./footer";
import WhatsAppChat from "@/components/shared/whatsapp-chat";
export default function PublicPage({title, description, children}: {title: string; description: string; children: React.ReactNode}) {
  return <><main id="main"><section className="taxi-page-banner"><div className="taxi-container"><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>{title}</span></nav><h1>{title}</h1><p>{description}</p></div></section><div className="taxi-container taxi-page-content">{children}</div></main><Footer/><WhatsAppChat/></>;
}
