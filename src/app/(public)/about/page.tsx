import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layout/footer";
import WhatsAppChat from "@/components/shared/whatsapp-chat";
import Icon from "@/components/ui/icon";
import {readContent} from "@/features/content/store";
import {aboutLists} from "@/features/content/page-fields";
import {photo} from "@/utils/images";
import styles from "./about.module.css";

export const metadata: Metadata = {title: "About Us | Falak Rides", description: "Meet Falak Rides. Thoughtful private transportation for airport arrivals, city journeys, Umrah and Ziyarat across Makkah, Madinah and Jeddah."};
export default async function About() {
  const {published} = await readContent();
  const list = (group: keyof typeof aboutLists) => aboutLists[group].map((row, index) => row.map((value, position) => published[`page-about.${group}.${index}.${position}`] ?? value));
  const values = list("values"), services = list("services"), steps = list("steps"), standards = list("standards");
  const phone = published["contact.phone"] ?? "+966 56 769 1863";
  const whatsapp = "https://wa.me/" + phone.replace(/\D/g, "");
  return <>
    <main id="main" className={styles.page}>
      <section className={styles.hero} aria-labelledby="about-title">
        <div className={styles.heroCopy}>
          <div className={styles.breadcrumb}><Link href="/">Home</Link><span>/</span><span>About us</span></div>
          <span className={styles.eyebrow}>THE PEOPLE BEHIND YOUR JOURNEY</span>
          <h1 id="about-title">Good journeys<br/>begin with<br/><em>thoughtful care.</em></h1>
          <p>New places. Meaningful moments. People you love beside you. We help arrange the ride that brings it all together.</p>
          <div className={styles.actions}><Link className="button" href="/book-a-ride">Plan your journey <Icon size={18}/></Link><Link className={styles.textLink} href="/contact">Talk to our team <Icon size={18}/></Link></div>
          <div className={styles.tags}><span><Icon name="pin" size={16}/> Saudi Arabia</span><span><Icon name="user" size={16}/> Private travel</span><span><Icon name="chat" size={16}/> Personal support</span></div>
        </div>
        <div className={styles.heroVisual}>
          <Image src={photo("photo-1565552645632-d725f8bfc19a", 1200)} alt="The Grand Mosque in Makkah, a destination for pilgrims" fill priority sizes="(max-width: 900px) 100vw, 48vw"/>
          <div className={styles.photoLabel}><span>FOR THE JOURNEYS THAT MATTER</span><strong>A little less to arrange.<br/>A little more to experience.</strong></div>
          <div className={styles.journeyCard}><span className={styles.cardIcon}><Icon name="car" size={23}/></span><div><small>YOUR TRAVEL COMPANION</small><strong>Makkah &middot; Madinah &middot; Jeddah</strong></div></div>
        </div>
      </section>
      <section className={styles.story} aria-labelledby="story-title">
        <div><span className={styles.eyebrow}>OUR STORY</span><h2 id="story-title">More than a destination.<br/><span>A journey that feels yours.</span></h2></div>
        <div><p className={styles.lead}>Falak Rides helps visitors, families and groups plan private transportation across Makkah, Madinah and Jeddah. From an airport arrival to a journey between the holy cities, we bring the travel details into one conversation.</p><p>Our approach is simple: understand your itinerary, discuss the right vehicle and help you agree on the details before you travel. Your route, your companions and your schedule shape the journey.</p><Link className={styles.textLink} href="/services">Discover how we can help <Icon size={18}/></Link></div>
      </section>
      <section className={styles.values} aria-labelledby="values-title">
        <div className={styles.centerHeading}><span className={styles.eyebrow}>WHAT MATTERS TO US</span><h2 id="values-title">Thoughtful by nature.<br/><span>Personal by choice.</span></h2><p>The small details make a difference. These principles guide how we help you plan.</p></div>
        <div className={styles.threeGrid}>{values.map(([icon,title,text],index)=><article className={styles.valueCard} key={title}><div className={styles.cardTop}><span className={styles.cardIcon}><Icon name={icon} size={25}/></span><span>0{index+1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section className={styles.services} aria-labelledby="services-title">
        <div className={styles.splitHeading}><div><span className={styles.eyebrow}>HOW WE HELP</span><h2 id="services-title">Different reasons to travel.<br/><span>The same thoughtful approach.</span></h2></div><Link className={styles.textLink} href="/services">Explore services <Icon size={18}/></Link></div>
        <div className={styles.fourGrid}>{services.map(([icon,title,text])=><Link className={styles.serviceCard} href="/services" key={title}><Icon name={icon} size={27}/><h3>{title}</h3><p>{text}</p><span className={styles.serviceArrow}><Icon size={18}/></span></Link>)}</div>
      </section>
      <section className={styles.coverage} aria-labelledby="coverage-title">
        <div><span className={styles.eyebrow}>CONNECTED BY YOUR JOURNEY</span><h2 id="coverage-title">Three familiar cities.<br/>So many meaningful moments.</h2><p>Explore airport connections, hotel pickups and private journeys between Makkah, Madinah and Jeddah. Other destinations and stops can be discussed with our team.</p><Link className={styles.textLink} href="/routes">Explore popular routes <Icon size={18}/></Link></div>
        <div className={styles.cities}>{[["Makkah","Umrah & hotel transfers"],["Madinah","City stays & Ziyarat plans"],["Jeddah","Airport arrivals & departures"]].map(([city,caption])=><div className={styles.city} key={city}><span><Icon name="pin" size={20}/></span><div><h3>{city}</h3><p>{caption}</p></div><Icon size={18}/></div>)}<small>Routes, timing and availability are confirmed for each request.</small></div>
      </section>
      <section className={styles.standards} aria-labelledby="standards-title">
        <div><span className={styles.eyebrow}>WHAT TO EXPECT</span><h2 id="standards-title">Confidence starts<br/><span>with clear details.</span></h2><p>Before your ride is confirmed, make sure the plan works for you and everyone travelling with you.</p><Link className={styles.textLink} href="/vehicles">Find room for your journey <Icon size={18}/></Link></div>
        <div className={styles.checklist}>{standards.map(([title,text])=><div key={title}><span><Icon name="check" size={19}/></span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div>
      </section>
      <section className={styles.process} aria-labelledby="process-title"><div className={styles.centerHeading}><span className={styles.eyebrow}>SIMPLE FROM THE START</span><h2 id="process-title">Your plans. A conversation.<br/><span>A journey arranged.</span></h2></div><div className={styles.threeGrid}>{steps.map(([title,text],index)=><article className={styles.step} key={title}><span>0{index+1}</span><h3>{title}</h3><p>{text}</p></article>)}</div><p className={styles.note}>Preparing a request on this website does not reserve a ride. Our team confirms bookings directly.</p></section>
      <section className={styles.faq} aria-labelledby="questions-title"><div><span className={styles.eyebrow}>A LITTLE CLARITY</span><h2 id="questions-title">Before you go.</h2><Link className={styles.textLink} href="/faq">See all FAQs <Icon size={18}/></Link></div><div className={styles.questions}>{[["Can you help with family or group travel?","Share your passenger count, luggage and specific needs so our team can confirm an appropriate vehicle and quote."],["Can I plan Umrah and Ziyarat together?","Share your dates, cities and planned stops. Our team will discuss the itinerary, timing and transport availability with you."],["How do I reach the team?","Use WhatsApp or Contact & Support to discuss a new journey or ask about an existing confirmation."]].map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
      <section className={styles.cta} aria-labelledby="cta-title"><span className={styles.eyebrow}>WHERE WILL YOUR JOURNEY TAKE YOU?</span><h2 id="cta-title">Let&#8217;s make the next part<br/><em>easier to arrange.</em></h2><p>Tell us where you are headed. We will help you work out the ride.</p><div className={styles.actions}><Link className="button" href="/book-a-ride">Plan your ride <Icon size={18}/></Link><a className={styles.textLink} href={whatsapp} target="_blank" rel="noopener noreferrer"><Icon name="chat" size={19}/> Talk to us on WhatsApp</a></div></section>
    </main><Footer/><WhatsAppChat/>
  </>;
}
