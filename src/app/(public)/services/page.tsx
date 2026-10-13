import PublicPage from "@/components/layout/public-page";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/ui/icon";
import {photo} from "@/utils/images";
import {readContent} from "@/features/content/store";
import {pageServices} from "@/features/content/page-fields";
export const metadata={title:"Our Services | Falak Rides",description:"Private transportation for everyday journeys and meaningful travel across Saudi Arabia."};
export default async function Page(){const {published} = await readContent(); const services = pageServices.map((service, index) => service.map((value, position) => published[`page-services.${index}.${position}`] ?? value)); return <PublicPage title="Our Services" description="Private transportation for everyday journeys and meaningful travel across Saudi Arabia."><div className="services-grid services-photo-grid">{services.map(([title,description,image])=><article className="service-card service-photo-card" key={title}><Image className="service-background" src={photo(image, 1000)} alt="" fill sizes="(max-width: 760px) 50vw, 25vw"/><div className="service-background-shade" aria-hidden="true"/><h2>{title}</h2><p>{description}</p><Link href="/book-a-ride">Plan your journey<Icon size={18}/></Link></article>)}</div></PublicPage>;}