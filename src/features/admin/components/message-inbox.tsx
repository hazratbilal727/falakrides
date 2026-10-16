"use client";
import {useEffect, useState} from "react";
import {api} from "@/lib/api-client";
import "./message-inbox.css";
type Conversation = {id: string; name: string; updatedAt: string; messages: {id: string; sender: string; text: string; createdAt: string}[]};
export default function MessageInbox({editable}: {editable: boolean}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const current = conversations.find(item => item.id === selected) || conversations[0];
  useEffect(() => {
    let stopped = false;
    async function refresh() {
      try {const result = await api<{conversations: Conversation[]}>("/api/admin/messages"); if (!stopped) {setConversations(result.conversations); setError("");}}
      catch (error) {if (!stopped) setError(error instanceof Error ? error.message : "Unable to load messages.");}
      finally {if (!stopped) setLoading(false);}
    }
    void refresh();
    const timer = setInterval(() => {if (!document.hidden) void refresh();}, 8000);
    return () => {stopped = true; clearInterval(timer);};
  }, []);
  return <section className="adm-panel web-inbox" aria-labelledby="web-inbox-title">
    <div className="adm-panel-head"><div><h2 id="web-inbox-title">Website messages <span className="adm-count">{conversations.filter(item => item.messages.at(-1)?.sender === "visitor").length} awaiting reply</span></h2><p>Messages sent from the homepage. Your replies appear in the visitor’s message popup.</p></div></div>
    {error && <p role="alert" className="web-inbox-error">{error}</p>}
    {loading ? <p className="web-inbox-empty" role="status">Loading messages…</p> : !current ? <p className="web-inbox-empty">No website messages yet.</p> : <div className="web-inbox-grid">
      <nav className="web-inbox-list" aria-label="Visitor conversations">{conversations.map(item => <button key={item.id} type="button" aria-pressed={current.id === item.id} onClick={() => {setSelected(item.id); setStatus("");}}><strong>{item.name}</strong><span>{item.messages.at(-1)?.text}</span><small>{item.messages.at(-1)?.sender === "visitor" ? "Awaiting reply" : "Replied"} · {new Date(item.updatedAt).toLocaleDateString()}</small></button>)}</nav>
      <div className="web-inbox-conversation"><h3>{current.name}</h3><div className="web-inbox-thread" role="log" aria-label={`Messages with ${current.name}`}>{current.messages.map(item => <div className="web-inbox-bubble" data-sender={item.sender} key={item.id}><strong>{item.sender === "admin" ? "Falak Rides" : current.name}</strong><p>{item.text}</p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></div>)}</div>
        {editable ? <form onSubmit={async event => {
          event.preventDefault(); if (busy) return; const id = current.id; setBusy(true); setError(""); setStatus("");
          try {await api(`/api/admin/messages/${id}`, {method: "POST", body: JSON.stringify({message: drafts[id] || ""})}); setDrafts(values => ({...values, [id]: ""})); setStatus("Reply sent to the visitor."); const result = await api<{conversations: Conversation[]}>("/api/admin/messages"); setConversations(result.conversations);}
          catch (error) {setError(error instanceof Error ? error.message : "Reply could not be sent.");}
          finally {setBusy(false);}
        }}><label htmlFor="web-inbox-reply">Reply to {current.name}</label><textarea id="web-inbox-reply" required maxLength={1500} rows={3} value={drafts[current.id] || ""} onChange={event => setDrafts(values => ({...values, [current.id]: event.target.value}))} placeholder="Write your reply…"/><button type="submit" className="adm-button" disabled={busy}>{busy ? "Sending…" : "Send reply"}</button><p role="status">{status}</p></form> : <p>Your role can view messages. An administrator can reply.</p>}
      </div>
    </div>}
  </section>;
}
