"use client";
import {useEffect, useRef, useState} from "react";
import {api} from "@/lib/api-client";
import "./website-message.css";

type Message = {id: string; sender: string; text: string; createdAt: string};
type Conversation = {name: string; messages: Message[]};
export default function WebsiteMessage({open, onClose}: {open: boolean; onClose: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!open) {dialog.current?.close(); return;}
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLInputElement>("input")?.focus();
    let stopped = false;
    async function refresh() {
      try {
        const result = await api<{conversation: Conversation | null}>("/api/messages");
        if (!stopped) {setConversation(result.conversation); setName(current => current || result.conversation?.name || ""); setError("");}
      } catch (error) {if (!stopped) setError(error instanceof Error ? error.message : "Unable to load messages.");}
      finally {if (!stopped) setLoading(false);}
    }
    void refresh();
    const timer = setInterval(() => {if (!document.hidden) void refresh();}, 8000);
    return () => {stopped = true; clearInterval(timer);};
  }, [open]);
  return <dialog ref={dialog} className="website-message-dialog" aria-labelledby="website-message-title" onCancel={onClose} onClose={onClose} onClick={event => {if (event.target === event.currentTarget) {const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();}}}>
    <div className="website-message-heading"><div><span>FALAK RIDES</span><h2 id="website-message-title">Send us a message</h2></div><button type="button" className="website-message-close" aria-label="Close messages" onClick={onClose}>×</button></div>
    <p className="website-message-description">Ask about your journey. Our team will reply here.</p>
    {conversation && <div className="website-message-thread" role="log" aria-label="Conversation with Falak Rides">{conversation.messages.map(item => <div key={item.id} className="website-message-bubble" data-sender={item.sender}><strong>{item.sender === "admin" ? "Falak Rides" : "You"}</strong><p>{item.text}</p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></div>)}</div>}
    {loading && <p role="status">Loading messages…</p>}
    <form onSubmit={async event => {
      event.preventDefault(); if (busy) return; setBusy(true); setError(""); setStatus("");
      try {const result = await api<{conversation: Conversation}>("/api/messages", {method: "POST", body: JSON.stringify({name, message})}); setConversation(result.conversation); setMessage(""); setStatus("Message sent. You can check our reply here.");}
      catch (error) {setError(error instanceof Error ? error.message : "Your message could not be sent.");}
      finally {setBusy(false);}
    }}>
      <label htmlFor="website-message-name">Your name <span>(required)</span></label>
      <input id="website-message-name" name="name" value={name} onChange={event => setName(event.target.value)} required maxLength={80} autoComplete="name" placeholder="Full name"/>
      <label htmlFor="website-message-text">Message</label>
      <textarea id="website-message-text" name="message" value={message} onChange={event => setMessage(event.target.value)} required maxLength={1500} rows={4} placeholder="How can we help with your travel plans?"/>
      {error && <p className="website-message-error" role="alert">{error}</p>}
      <p className="website-message-status" role="status">{status}</p>
      <button className="website-message-send" type="submit" disabled={busy || loading}>{busy ? "Sending…" : "Send message"}</button>
      <small>Reopen Message in this browser to read replies. Keep browser cookies enabled.</small>
    </form>
  </dialog>;
}
