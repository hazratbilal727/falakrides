"use client";
import {useEffect, useRef, useState} from "react";
import {api} from "@/lib/api-client";
import {useMessageSound} from "./use-message-sound";
import "./header-inbox.css";

type Conversation = {id: string; name: string; blocked?: boolean; updatedAt: string; messages: {id: string; sender: string; text: string; createdAt: string}[]};
function CloseIcon() {return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>;}
export default function HeaderInbox({editable}: {editable: boolean}) {
  const {enabled: soundEnabled, toggle: toggleSound, notify} = useMessageSound();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const reply = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const current = conversations.find(item => item.id === selected);
  const latestMessage = current?.messages.at(-1)?.id;
  const awaiting = conversations.filter(item => !item.blocked && item.messages.at(-1)?.sender === "visitor").length;
  useEffect(() => {
    let stopped = false;
    let refreshing = false;
    let knownVisitorMessages: Set<string> | null = null;
    async function refresh() {
      if (refreshing) return;
      refreshing = true;
      try {
        const result = await api<{conversations: Conversation[]}>("/api/admin/messages");
        if (!stopped) {
          const visitorMessages = new Set(result.conversations.flatMap(person => person.messages.filter(message => message.sender === "visitor").map(message => message.id)));
          if (knownVisitorMessages && [...visitorMessages].some(id => !knownVisitorMessages!.has(id))) notify();
          knownVisitorMessages = visitorMessages;
          setConversations(result.conversations); setError("");
          setSelected(id => id && !result.conversations.some(person => person.id === id) ? null : id);
        }
      }
      catch (error) {if (!stopped) setError(error instanceof Error ? error.message : "Unable to load messages.");}
      finally {refreshing = false; if (!stopped) setLoading(false);}
    }
    void refresh();
    const timer = setInterval(() => {void refresh();}, 8000);
    const onManagement = () => {void refresh();};
    window.addEventListener("falak-message-management", onManagement);
    return () => {stopped = true; clearInterval(timer); window.removeEventListener("falak-message-management", onManagement);};
  }, [notify]);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {if (!root.current?.contains(event.target as Node)) setOpen(false);}
    function escape(event: KeyboardEvent) {if (event.key === "Escape") {setOpen(false); trigger.current?.focus();}}
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape);};
  }, [open]);
  useEffect(() => {
    if (selected) {dialog.current?.showModal(); reply.current?.focus();}
    else dialog.current?.close();
  }, [selected]);
  useEffect(() => {
    if (!selected || !thread.current) return;
    thread.current.scrollTo({top: thread.current.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
  }, [selected, latestMessage]);
  return <div className="adm-header-inbox" ref={root} onBlur={event => {if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);}}>
    <button type="button" ref={trigger} className="adm-icon-button adm-inbox-trigger" aria-label={`Inbox${awaiting ? `, ${awaiting} awaiting reply` : ""}`} aria-expanded={open} aria-controls="admin-inbox-dropdown" onClick={() => setOpen(value => !value)}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M8 10h8M8 14h5"/></svg>
      {awaiting > 0 && <span className="adm-inbox-count" aria-hidden="true">{awaiting > 9 ? "9+" : awaiting}</span>}
    </button>
    {open && <section id="admin-inbox-dropdown" className="adm-inbox-dropdown" aria-label="Website message inbox"><div className="adm-inbox-dropdown-head"><h2>Inbox</h2><span>{awaiting} awaiting reply</span><button type="button" className="adm-inbox-sound" aria-label={soundEnabled ? "Mute message sounds" : "Enable message sounds"} aria-pressed={soundEnabled} title={soundEnabled ? "Message sounds on" : "Message sounds off"} onClick={toggleSound}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m11 5-6 4H2v6h3l6 4Z"/>{soundEnabled ? <><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></> : <path d="m16 9 5 6m0-6-5 6"/>}</svg></button></div>
      {error && <p className="adm-inbox-error" role="alert">{error}</p>}
      <div className="adm-inbox-people">{loading ? <p role="status">Loading messages…</p> : !conversations.length ? <p>No messages yet.</p> : conversations.map(person => <button type="button" className="adm-inbox-person" key={person.id} onClick={() => {setSelected(person.id); setOpen(false); setSendError(""); setStatus("");}}><span className="adm-inbox-avatar" aria-hidden="true">{person.name.trim().slice(0, 1).toUpperCase()}</span><span className="adm-inbox-person-copy"><strong>{person.name}</strong><span>{person.messages.at(-1)?.text}</span></span><span className="adm-inbox-person-meta"><time dateTime={person.updatedAt}>{new Date(person.updatedAt).toLocaleDateString([], {month: "short", day: "numeric"})}</time>{!person.blocked && person.messages.at(-1)?.sender === "visitor" && <span className="adm-inbox-dot" aria-label="Awaiting reply"/>}</span></button>)}</div>
    </section>}
    <dialog ref={dialog} className="adm-inbox-chat" aria-labelledby="admin-inbox-chat-title" onClose={() => {if (dialog.current?.open) return; setSelected(null); trigger.current?.focus();}} onClick={event => {if (event.target === event.currentTarget) {const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current?.close();}}}>
      <div className="adm-inbox-chat-head"><span className="adm-inbox-avatar" aria-hidden="true">{current?.name.trim().slice(0, 1).toUpperCase()}</span><div><h2 id="admin-inbox-chat-title">{current?.name || "Conversation"}</h2><p>{current?.blocked ? "Blocked visitor" : "Website visitor"}</p></div><button type="button" className="adm-inbox-close" aria-label="Close conversation" onClick={() => dialog.current?.close()}><CloseIcon/></button></div>
      <div className="adm-inbox-chat-thread" ref={thread} role="log" aria-label={`Conversation with ${current?.name || "visitor"}`}>{current?.messages.map(message => <div className="adm-inbox-chat-bubble" data-sender={message.sender} key={message.id}><span className="adm-inbox-sr">{message.sender === "admin" ? "Falak Rides" : current.name}</span><p>{message.text}</p><time dateTime={message.createdAt} title={new Date(message.createdAt).toLocaleString()}>{new Date(message.createdAt).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}</time></div>)}</div>
      {editable && current ? <form className="adm-inbox-chat-form" onSubmit={async event => {
        event.preventDefault(); if (busy) return; const id = current.id; setBusy(true); setSendError(""); setStatus("");
        try {
          await api(`/api/admin/messages/${id}`, {method: "POST", body: JSON.stringify({message: drafts[id] || ""})});
          setDrafts(values => ({...values, [id]: ""})); setStatus("Reply sent.");
          const result = await api<{conversations: Conversation[]}>("/api/admin/messages"); setConversations(result.conversations);
        } catch (error) {setSendError(error instanceof Error ? error.message : "Reply could not be sent.");}
        finally {setBusy(false);}
      }}><div className="adm-inbox-composer"><label htmlFor="admin-inbox-reply" className="adm-inbox-sr">Reply to {current.name}</label><textarea onKeyDown={event => {if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {event.preventDefault(); if (!event.repeat && !busy && (drafts[current.id] || "").trim()) event.currentTarget.form?.requestSubmit();}}} ref={reply} id="admin-inbox-reply" required maxLength={1500} rows={2} value={drafts[current.id] || ""} onChange={event => setDrafts(values => ({...values, [current.id]: event.target.value}))} placeholder="Write a reply…"/><button type="submit" className="adm-inbox-send" aria-label={busy ? "Sending reply" : "Send reply"} disabled={busy}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z M11 13 22 2"/></svg></button></div>{sendError && <p className="adm-inbox-error" role="alert">{sendError}</p>}<p className="adm-inbox-sr" role="status">{status}</p><small>Replies appear in the visitor’s chat.</small></form> : <p className="adm-inbox-view-only">Your role can view this conversation. An administrator can reply.</p>}
      {error && <p className="adm-inbox-error" role="alert">{error}</p>}
    </dialog>
  </div>;
}
