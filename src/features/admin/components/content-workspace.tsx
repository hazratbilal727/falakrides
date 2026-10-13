"use client";

import {useRef, useState} from "react";
import {createPortal} from "react-dom";
import Icon from "@/components/ui/icon";
import {contentFields} from "@/features/content/fields";
import {editorSections, editorSectionName, sectionContains} from "@/features/content/editor-sections";
import {changedFields, fieldValue} from "@/features/content/editor-utils";
import {validateValues} from "@/features/content/validation";
import type {ContentDocument, ContentValues} from "@/features/content/types";

const sectionNames: Record<string, string> = {home: "Header & hero", main: "Homepage content", "whatsapp-title": "WhatsApp identity", "whatsapp-chat": "WhatsApp chat", "whatsapp-description": "WhatsApp description", services: "Services", fleet: "Fleet", routes: "Routes", umrah: "Umrah & Ziyarat", about: "About & benefits", offers: "Offers", faq: "FAQs", contact: "Contact banner", footer: "Footer", inquiry: "Inquiry form", booking: "Booking form", whatsapp: "WhatsApp popup", privacy: "Privacy policy", terms: "Terms & conditions"};
const sections = editorSections.map(group => group.id);
const sectionName = (section: string) => sectionNames[section] || section;

export default function ContentWorkspace({document, values, onChange, onSave, onLock, state, accessExpiresAt, actionsTarget}: {
  document: ContentDocument; values: ContentValues; onChange: (values: ContentValues) => void;
  onSave: (publish: boolean) => Promise<void>; onLock: () => Promise<void>;
  state: string; accessExpiresAt: number; actionsTarget: HTMLDivElement | null;
}) {
  const [section, setSection] = useState(sections[0]);
  const [query, setQuery] = useState("");
  const [validationError, setValidationError] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const review = useRef<HTMLDialogElement>(null);
  const reviewTrigger = useRef<HTMLButtonElement>(null);
  const busy = state !== "ready";
  const unsaved = changedFields(values, document.draft);
  const changes = changedFields(values, document.published);
  const dirty = unsaved.length > 0;
  const selectedFields = contentFields.filter(field => sectionContains(section, field.section) && `${field.label} ${sectionName(field.section)} ${fieldValue(field, values)}`.toLowerCase().includes(query.toLowerCase()));

  function update(next: ContentValues) {
    setValidationError(""); onChange(next);
  }
  function validDraft() {
    try { validateValues(values); setValidationError(""); return true; }
    catch (error) {setValidationError(error instanceof Error ? error.message : "Check your content fields before saving."); return false;}
  }
  return <div className="cms-workspace">
    {validationError && <p className="adm-cms-error" role="alert">{validationError} Check fields in All content, including sections hidden by filters.</p>}
    {actionsTarget && createPortal(
      <div className="cms-primary-actions"><button className="adm-button secondary" form="cms-editor-form" type="submit" disabled={busy || !dirty}> {state === "saving" ? "Saving..." : "Save draft"}</button><button ref={reviewTrigger} className="adm-button" disabled={busy || !changes.length} onClick={() => {if (form.current?.reportValidity() && validDraft()) review.current?.showModal();}}><Icon name="check" size={16}/>Review &amp; publish</button></div>
    , actionsTarget)}
    <div className="cms-editor-layout">
      <aside className="cms-section-nav"><div className="cms-section-heading">SECTIONS</div><nav aria-label="Website content sections"><button className={section === "all" ? "active" : ""} aria-current={section === "all" ? "page" : undefined} onClick={() => setSection("all")}>All content</button>{sections.map(key => <button key={key} className={section === key ? "active" : ""} aria-current={section === key ? "page" : undefined} onClick={() => setSection(key)}>{editorSectionName(key)}</button>)}</nav><div className="cms-access"><Icon name="shield" size={17}/><div><strong>PIN protected</strong><small>Locks at {new Date(accessExpiresAt).toLocaleTimeString("en-GB", {timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit"})} PKT</small></div><button disabled={busy} onClick={onLock}>Lock</button></div></aside>
      <div className="cms-editor-main">
        <div className="cms-editor-heading"><h2>{section === "all" ? "All content" : editorSectionName(section)}</h2></div>
        <div className="cms-find-bar"><div className="adm-search"><ToolIcon name="search"/><input aria-label="Search content" placeholder="Find a field or phrase..." type="search" value={query} onChange={event => setQuery(event.target.value)}/>{query && <button className="cms-clear-search" aria-label="Clear content search" onClick={() => setQuery("")}><ToolIcon name="close"/></button>}</div></div>
        <form id="cms-editor-form" ref={form} onSubmit={event => {event.preventDefault(); if (dirty && !busy && validDraft()) void onSave(false);}}><fieldset className="cms-field-list" disabled={busy}>
          {selectedFields.map(field => {
            const value = fieldValue(field, values);
            const inputId = `cms-${field.id}`;
            const longText = !field.kind && field.value.length > 100;
            return <article className="cms-field-card" key={field.id}>
              <small className="cms-field-section">{sectionName(field.section)}</small>
              <label htmlFor={inputId}>{field.label}</label>
              {longText ? <textarea id={inputId} rows={4} maxLength={6000} value={value} onChange={event => update({...values, [field.id]: event.target.value})}/> : <input id={inputId} type={field.kind === "number" ? "number" : field.kind === "email" ? "email" : field.kind === "phone" ? "tel" : "text"} required={!!field.kind} min={field.kind === "number" ? 0 : undefined} max={field.kind === "number" ? 30 : undefined} step={field.kind === "number" ? 1 : undefined} pattern={field.kind === "image" ? "photo-[0-9]+-[a-f0-9]+" : field.kind === "phone" ? "[+]?[0-9 ()\\-]{8,25}" : undefined} maxLength={field.kind === "image" ? 100 : 6000} value={value} onChange={event => update({...values, [field.id]: event.target.value})}/>}
            </article>;
          })}
        </fieldset></form>
        {!selectedFields.length && <div className="cms-no-results"><ToolIcon name="search"/><h3>No matching fields</h3><p>Try another phrase or show all content.</p><button className="adm-button secondary" onClick={() => {setQuery(""); setSection("all");}}>Clear filters</button></div>}
      </div>
    </div>
    <dialog ref={review} className="cms-review-dialog" aria-labelledby="cms-review-title" onClose={() => reviewTrigger.current?.focus()} onClick={event => {if (event.target === event.currentTarget) review.current?.close();}}>
      <div className="cms-review-head"><div><span className="adm-overline">READY TO GO LIVE</span><h2 id="cms-review-title">Review your changes</h2><p>{changes.length} {changes.length === 1 ? "field" : "fields"} will update on your website.</p></div><button className="adm-icon-button" aria-label="Close publish review" onClick={() => review.current?.close()} autoFocus><ToolIcon name="close"/></button></div>
      <div className="cms-review-list">{changes.map(field => <article key={field.id}><small>{sectionName(field.section)}</small><h3>{field.label}</h3><div className="cms-diff"><div><span>Live now</span><p>{fieldValue(field, document.published) || "(Empty)"}</p></div><div><span>After publishing</span><p>{fieldValue(field, values) || "(Empty)"}</p></div></div></article>)}</div>
      <div className="cms-review-actions"><p>Publishing also saves your current draft.</p><button className="adm-button secondary" disabled={busy} onClick={() => review.current?.close()}>Keep editing</button><button className="adm-button" disabled={busy || !changes.length} onClick={() => {review.current?.close(); void onSave(true);}}><Icon name="check" size={16}/>Publish changes</button></div>
    </dialog>
  </div>;
}

function ToolIcon({name}: {name: "search" | "close"}) {
  const paths = {search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>, close: <path d="m6 6 12 12M6 18 18 6"/>};
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
