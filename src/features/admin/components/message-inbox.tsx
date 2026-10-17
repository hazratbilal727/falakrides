"use client";
import {useEffect, useState} from "react";
import {api} from "@/lib/api-client";
import "./message-inbox.css";

type Conversation = {id: string; name: string; blocked: boolean; updatedAt: string; messages: {id: string; sender: string; text: string}[]};
export default function MessageInbox({editable}: {editable: boolean}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  useEffect(() => {
    let stopped = false;
    async function refresh() {
      try {const result = await api<{conversations: Conversation[]}>("/api/admin/messages"); if (!stopped) {setConversations(result.conversations); setError("");}}
      catch (error) {if (!stopped) setError(error instanceof Error ? error.message : "Unable to load conversations.");}
      finally {if (!stopped) setLoading(false);}
    }
    void refresh();
    const timer = setInterval(() => {if (!document.hidden) void refresh();}, 8000);
    return () => {stopped = true; clearInterval(timer);};
  }, []);
  async function manage(person: Conversation, action: "block" | "delete") {
    if (busy) return;
    if (action === "delete" && !window.confirm(`Delete ${person.name} and all messages in this conversation? This cannot be undone.`)) return;
    setBusy(person.id); setError(""); setStatus("");
    try {
      await api(`/api/admin/messages/${person.id}`, {method: action === "delete" ? "DELETE" : "PATCH", body: JSON.stringify(action === "delete" ? {} : {blocked: !person.blocked})});
      setConversations(items => action === "delete" ? items.filter(item => item.id !== person.id) : items.map(item => item.id === person.id ? {...item, blocked: !person.blocked} : item));
      setStatus(action === "delete" ? "Visitor and conversation deleted." : person.blocked ? "Visitor unblocked." : "Visitor blocked from sending messages.");
      window.dispatchEvent(new Event("falak-message-management"));
    } catch (error) {setError(error instanceof Error ? error.message : "Unable to update this visitor.");}
    finally {setBusy(null);}
  }
  const visible = conversations.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  return <section className="adm-panel web-inbox" aria-labelledby="web-inbox-title">
    <div className="adm-panel-head"><div><h2 id="web-inbox-title">Message management <span className="adm-count">{conversations.length} visitors</span></h2><p>Manage visitors and saved conversations. Use the header inbox to chat and reply.</p></div></div>
    <div className="web-management-toolbar"><input type="search" aria-label="Search message visitors" placeholder="Search visitors…" value={search} onChange={event => setSearch(event.target.value)}/><span>{conversations.filter(item => item.blocked).length} blocked</span></div>
    {error && <p role="alert" className="web-inbox-error">{error}</p>}
    {status && <p role="status" className="web-management-status">{status}</p>}
    {loading ? <p className="web-inbox-empty" role="status">Loading visitors…</p> : !visible.length ? <p className="web-inbox-empty">{search ? "No visitors found." : "No website messages yet."}</p> : <div className="web-management-list">{visible.map(person => <article className="web-management-row" key={person.id}>
      <span className="web-management-avatar" aria-hidden="true">{person.name.trim().slice(0, 1).toUpperCase()}</span>
      <div className="web-management-person"><strong>{person.name}</strong><p>{person.messages.at(-1)?.text}</p><small>{person.messages.length} messages · Last activity {new Date(person.updatedAt).toLocaleDateString()}</small></div>
      <span className="web-management-badge" data-blocked={person.blocked}>{person.blocked ? "Blocked" : "Active"}</span>
      {editable && <div className="web-management-actions"><button type="button" disabled={busy !== null} onClick={() => void manage(person, "block")} aria-label={`${person.blocked ? "Unblock" : "Block"} ${person.name}`}>{person.blocked ? "Unblock" : "Block"}</button><button type="button" className="web-management-delete" disabled={busy !== null} onClick={() => void manage(person, "delete")} aria-label={`Delete ${person.name} and conversation`}>Delete</button></div>}
    </article>)}</div>}
  </section>;
}
