import {readContent} from "@/features/content/store";
import {ContentText} from "@/features/content/public-content";
import Link from "next/link";
import Icon from "@/components/ui/icon";


export default async function Footer() {
const {published} = await readContent();
const phone = published["contact.phone"] ?? "+966 56 769 1863";
const email = published["contact.email"] ?? "falakrides56@gmail.com";
  return <footer className="site-footer">
    <div className="footer-content">
      <div className="footer-brand-column">
        <Link className="brand" href="/" aria-label="Falak Rides home"><span className="brand-mark" aria-hidden="true">f<span>&#8599;</span></span><span><ContentText id="footer.1" fallback="falak"/><span className="brand-light"><ContentText id="footer.2" fallback="rides"/></span></span></Link>
        <p><ContentText id="footer.3" fallback="Thoughtful journeys across Saudi Arabia. Private transportation for the places that matter."/></p>
        <div className="footer-city-tags" aria-label="Service destinations">{["Makkah", "Madinah", "Jeddah"].map(city => <span key={city}><Icon name="pin" size={13}/>{city}</span>)}</div>
      </div>
      <nav className="footer-link-group" aria-label="Explore Falak Rides"><h3><ContentText id="footer.4" fallback="Explore"/></h3><Link href="/services"><ContentText id="footer.5" fallback="Our services"/></Link><Link href="/vehicles"><ContentText id="footer.6" fallback="Our vehicles"/></Link><Link href="/services"><ContentText id="footer.7" fallback="Umrah & Ziyarat"/></Link><Link href="/offers"><ContentText id="footer.8" fallback="Special offers"/></Link><Link href="/about"><ContentText id="footer.9" fallback="About us"/></Link></nav>
      <nav className="footer-link-group" aria-label="Plan your journey"><h3><ContentText id="footer.10" fallback="Your journey"/></h3><Link href="/book-a-ride"><ContentText id="footer.11" fallback="Book a ride"/></Link><Link href="/routes"><ContentText id="footer.12" fallback="Popular routes"/></Link><Link href="/faq"><ContentText id="footer.13" fallback="FAQs"/></Link><Link href="/contact"><ContentText id="footer.14" fallback="Get in touch"/></Link></nav>
      <div className="footer-contact-column"><span className="footer-contact-label"><ContentText id="footer.15" fallback="LET’S PLAN YOUR JOURNEY"/></span><a className="footer-phone" href={`tel:${phone.replace(/[^+\d]/g, "")}`} dir="ltr">{phone}</a><a className="footer-email" href={`mailto:${email}`}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>{email}</a><p><ContentText id="footer.17" fallback="Other destinations by request."/><br/><ContentText id="footer.18" fallback="Availability and fares confirmed by our team."/></p></div>
    </div>
    <nav className="public-footer-links" aria-label="Booking and policies"><Link href="/my-bookings">My Bookings</Link><Link href="/policies">Policies</Link></nav><div className="footer-legal"><span>&copy; {new Date().getFullYear()} <ContentText id="footer.19" fallback=" Falak Rides. All rights reserved."/></span><div><Link href="/privacy"><ContentText id="footer.20" fallback="Privacy policy"/></Link><Link href="/terms"><ContentText id="footer.21" fallback="Terms & conditions"/></Link><Link className="footer-back-top" href="/"><ContentText id="footer.22" fallback="Back to top "/><span aria-hidden="true">&#8593;</span></Link></div></div>
  </footer>;
}
