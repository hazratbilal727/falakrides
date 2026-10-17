"use client";
import {ContentInput} from "@/features/content/public-content";
import {ContentText} from "@/features/content/public-content";
import {useWebsite} from "@/features/content/public-content";
import {useRef, useState} from "react";
import {api} from "@/lib/api-client";
import {useUnsavedChanges} from "@/components/forms/unsaved-changes";
export default function TravelInquiry() {
  const {copy:c}=useWebsite();
  const form = useRef<HTMLFormElement>(null);
  const [dirty,setDirty] = useState(false);
  const [busy,setBusy] = useState(false);
  const [status,setStatus] = useState("");
  useUnsavedChanges(dirty, () => {form.current?.reset();setDirty(false);});
  return <form ref={form} className="taxi-footer-inquiry" onChange={() => setDirty(true)} onSubmit={async event => {event.preventDefault();if(busy)return;setBusy(true);setStatus("");const values = Object.fromEntries(new FormData(event.currentTarget));try{await api("/api/inquiries",{method:"POST",body:JSON.stringify({...values,message:"Please contact me by email with information about arranging a Falak Rides journey."})});setStatus("Thank you. Your request has been received.");setDirty(false);form.current?.reset();}catch(error){setStatus(error instanceof Error ? error.message : "Unable to send your request. Please try again.");}finally{setBusy(false);}}}>
    <label><span><ContentText id="ui.components-public-travel-inquiry.1" fallback="Your name"/></span><ContentInput name="name" autoComplete="name" placeholderId="ui.components-public-travel-inquiry.3" placeholder="Your name" maxLength={80} required/></label><label><span><ContentText id="ui.components-public-travel-inquiry.2" fallback="Email address"/></span><ContentInput type="email" name="email" autoComplete="email" placeholderId="ui.components-public-travel-inquiry.4" placeholder="Email address" maxLength={160} required/></label><button className="taxi-button" type="submit" disabled={busy}>{busy ? "Sending…" : c.footerInquiryButton}</button>{status && <p role="status">{status}</p>}
  </form>;
}
