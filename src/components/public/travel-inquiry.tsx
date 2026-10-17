"use client";
import {ContentInput} from "@/features/content/public-content";
import {ContentText} from "@/features/content/public-content";
import {useWebsite} from "@/features/content/public-content";
import {useRef, useState} from "react";
import {useSiteContact} from "@/features/content/public-content";
import {useUnsavedChanges} from "@/components/forms/unsaved-changes";
export default function TravelInquiry() {
  const {copy:c}=useWebsite();
  const form = useRef<HTMLFormElement>(null);
  const [dirty,setDirty] = useState(false);
  const {email} = useSiteContact();
  const busy = false;
  const [status,setStatus] = useState("");
  useUnsavedChanges(dirty, () => {form.current?.reset();setDirty(false);});
  return <form ref={form} className="taxi-footer-inquiry" onChange={() => setDirty(true)} onSubmit={event => {event.preventDefault();const values = Object.fromEntries(new FormData(event.currentTarget));setDirty(false);setStatus("Send your inquiry from your email app.");window.location.href = "mailto:" + email + "?subject=" + encodeURIComponent("Travel inquiry from " + values.name) + "&body=" + encodeURIComponent("Please contact me about arranging a journey.\nName: " + values.name + "\nReply to: " + values.email);}}>
    <label><span><ContentText id="ui.components-public-travel-inquiry.1" fallback="Your name"/></span><ContentInput name="name" autoComplete="name" placeholderId="ui.components-public-travel-inquiry.3" placeholder="Your name" maxLength={80} required/></label><label><span><ContentText id="ui.components-public-travel-inquiry.2" fallback="Email address"/></span><ContentInput type="email" name="email" autoComplete="email" placeholderId="ui.components-public-travel-inquiry.4" placeholder="Email address" maxLength={160} required/></label><button className="taxi-button" type="submit" disabled={busy}>{busy ? "Sending…" : c.footerInquiryButton}</button>{status && <p role="status">{status}</p>}
  </form>;
}
