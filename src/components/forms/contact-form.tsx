"use client";
import {ContentInput, ContentTextarea} from "@/features/content/public-content";
import {useSiteContact} from "@/features/content/public-content";
import {ContentText} from "@/features/content/public-content";

import Icon from "@/components/ui/icon";
import {useRef, useState} from "react";
import {useUnsavedChanges} from "./unsaved-changes";
import {api} from "@/lib/api-client";

function MailIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>;
}

export default function ContactForm() {
const {email} = useSiteContact();
const form = useRef<HTMLFormElement>(null);
const [dirty, setDirty] = useState(false);
const [busy, setBusy] = useState(false);
const [message, setMessage] = useState("");
useUnsavedChanges(dirty, () => {form.current?.reset(); setDirty(false);});

  return <form ref={form} className="contact-form inquiry-form" onChange={event => {const data = new FormData(event.currentTarget); setDirty([...data.values()].some(value => typeof value === "string" && value.length > 0));}} onSubmit={async event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const subject = `Website inquiry from ${String(fields.get("name")).trim()}`;
    const body = `${String(fields.get("message")).trim()}\n\nReply to: ${String(fields.get("email")).trim()}`;
    if (busy) return; setBusy(true); setMessage("");
    try {await api("/api/inquiries", {method: "POST", body: JSON.stringify(Object.fromEntries(fields))}); setDirty(false); form.current?.reset(); setMessage("Your inquiry has been received."); window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;}
    catch (error) {setMessage(error instanceof Error ? error.message : "Your inquiry could not be sent. Please try again.");}
    finally {setBusy(false);}
  }}>
    <div className="inquiry-intro">
      <span className="inquiry-icon"><MailIcon/></span>
      <span className="eyebrow"><ContentText id="inquiry.1" fallback="A CONVERSATION AWAY"/></span>
      <h3><ContentText id="inquiry.2" fallback="Send an inquiry."/><br/><span><ContentText id="inquiry.3" fallback="Let’s talk travel."/></span></h3>
      <p><ContentText id="inquiry.4" fallback="Have a question or a journey in mind? Share a few details and get in touch with Falak Rides."/></p>
      <a className="inquiry-email" href={`mailto:${email}`}>{email}<Icon size={17}/></a>
      <div className="inquiry-note"><Icon name="shield" size={19}/><p><ContentText id="inquiry.6" fallback="This opens your email app. Your message is sent only when you send the email."/></p></div>
    </div>
    <div className="inquiry-fields">
      {message && <p role="status">{message}</p>}
      <div className="inquiry-row">
        <label htmlFor="inquiry-name"><ContentText id="inquiry.7" fallback="Your name"/><ContentInput id="inquiry-name" name="name" required maxLength={80} autoComplete="name" placeholderId="ui.components-forms-contact-form.1" placeholder="Full name"/></label>
        <label htmlFor="inquiry-email"><ContentText id="inquiry.8" fallback="Email address"/><ContentInput id="inquiry-email" name="email" type="email" required maxLength={160} autoComplete="email" placeholderId="ui.components-forms-contact-form.2" placeholder="you@example.com"/></label>
      </div>
      <label htmlFor="inquiry-message"><ContentText id="inquiry.9" fallback="How can we help?"/><ContentTextarea id="inquiry-message" name="message" required maxLength={1500} rows={5} placeholderId="ui.components-forms-contact-form.3" placeholder="Tell us about your route, travel dates or any questions you have."/></label>
      <div className="inquiry-submit"><span><ContentText id="inquiry.10" fallback="No payment details needed."/></span><button className="button" type="submit"><ContentText id="inquiry.11" fallback="Prepare email inquiry "/><Icon size={19}/></button></div>
    </div>
  </form>;
}
