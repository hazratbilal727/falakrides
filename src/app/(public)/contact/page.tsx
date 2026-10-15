import {ContentText} from "@/features/content/public-content";
import {websiteFromValues} from "@/features/content/website-model";
import PublicPage from "@/components/layout/public-page";
import ContactForm from "@/components/forms/contact-form";
import Icon from "@/components/ui/icon";
import {readContent} from "@/features/content/store";
export const metadata = {title: "Contact Us | Falak Rides", description: "Contact Falak Rides for airport transfers, Umrah transportation, Ziyarat trips, and help with an existing booking."};
export default async function Contact() {const {published} = await readContent();const {copy:c}=websiteFromValues(published);const phone = published["contact.phone"] ?? "+966 56 769 1863";const email = published["contact.email"] ?? "falakrides56@gmail.com";return <PublicPage title={c.navContact} description={c.contactDescription}><div className="taxi-contact-cards"><a href={`tel:${phone.replace(/[^+\d]/g, "")}`}><Icon name="user" size={30}/><h2><ContentText id="ui.contact.1" fallback="Call Our Team"/></h2><span>{phone}</span></a><a href={`https://wa.me/${phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"><Icon name="chat" size={30}/><h2><ContentText id="ui.contact.2" fallback="Chat on WhatsApp"/></h2><span><ContentText id="ui.contact.3" fallback="Discuss your travel plans"/></span></a><a href={`mailto:${email}`}><Icon name="plane" size={30}/><h2><ContentText id="ui.contact.4" fallback="Email Us"/></h2><span>{email}</span></a></div><ContactForm/></PublicPage>;}
