"use client";
import {useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref} from "react";
import {contentAccessClient as access} from "@/features/content/access-client";
import Icon from "@/components/ui/icon";
import {useUnsavedChanges} from "@/components/forms/unsaved-changes";
import ContentWorkspace from "./content-workspace";
import {changedFields} from "@/features/content/editor-utils";
import type {ContentDocument, ContentValues} from "@/features/content/types";

export type ContentAccessHandle = {lock: () => void};

export default function WebsiteContent({actionsTarget, ref}: {actionsTarget: HTMLDivElement | null; ref?: Ref<ContentAccessHandle>}) {
  const [document, setDocument] = useState<ContentDocument | null>(null);
  const [values, setValues] = useState<ContentValues>({});
  const [pin, setPin] = useState("");
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [accessExpiresAt, setAccessExpiresAt] = useState(0);
  const generation = useRef(0);
  const loginPending = useRef(false);
  const [hasRecovery, setHasRecovery] = useState(false);
  const recovery = useRef<{values: ContentValues; baseline: ContentValues} | null>(null);
  const latest = useRef({values, document});
  useEffect(() => {latest.current = {values, document};}, [values, document]);
  const dirty = hasRecovery || !!document && changedFields(values, document.draft).length > 0;
  const confirmDiscard = useUnsavedChanges(dirty, () => {recovery.current = null; setHasRecovery(false); if (document) setValues(document.draft);});
  function retainEdits() {const current = latest.current; if (current.document && changedFields(current.values, current.document.draft).length) {recovery.current = {values: current.values, baseline: current.document.draft}; setHasRecovery(true);}}
  const busy = ["loading", "saving", "publishing", "login"].includes(state);
  const load = useCallback(async () => {
    const attempt = generation.current;
    try {
      const response = await fetch("/api/content?admin=1", {cache: "no-store"});
      const result = await response.json();
      if (attempt !== generation.current) return;
      if (!response.ok) {setDocument(null); setValues({}); setAccessExpiresAt(0); setState(response.status === 401 ? "locked" : "unavailable"); setError(response.status === 401 ? "" : result.error); return;}
      const restored = {...result.draft};
      if (recovery.current) {for (const field of changedFields(recovery.current.values, recovery.current.baseline)) restored[field.id] = recovery.current.values[field.id]; recovery.current = null; setHasRecovery(false); setNotice("Your unsaved edits were restored. Review and save when ready.");}
      setError(""); setDocument(result); setValues(restored); setAccessExpiresAt(result.accessExpiresAt); setState("ready");
    } catch {if (attempt !== generation.current) return; setError("Unable to connect. Check your connection and try again."); setState("unavailable");}
  }, []);
  useEffect(() => {const timer = setTimeout(() => {void load();}, 0); return () => clearTimeout(timer);}, [load]);
  useEffect(() => {
    if (!accessExpiresAt) return;
    function lockExpired() {
      if (Date.now() < accessExpiresAt) return;
      generation.current += 1; loginPending.current = false;
      const current = latest.current; if (current.document && changedFields(current.values, current.document.draft).length) {recovery.current = {values: current.values, baseline: current.document.draft}; setHasRecovery(true);}
      setDocument(null); setValues({}); setPin(""); setNotice("");
      setAccessExpiresAt(0); setState("locked"); setError("Content access expired. Enter your PIN again.");
    }
    const timer = setTimeout(lockExpired, Math.max(0, accessExpiresAt - Date.now()));
    window.addEventListener("focus", lockExpired);
    return () => {clearTimeout(timer); window.removeEventListener("focus", lockExpired);};
  }, [accessExpiresAt]);
  async function login(candidate: string) {
    if (candidate.length !== 5 || loginPending.current) return;
    const attempt = ++generation.current;
    loginPending.current = true; setError(""); setState("login");
    try {
      const response = await access.send("login", candidate);
      const result = await response.json();
      if (attempt !== generation.current) return;
      if (!response.ok) throw new Error(result.error);
      setPin(""); await load();
    } catch (error) {
      if (attempt !== generation.current) return;
      setPin(""); setError(error instanceof Error ? error.message : "Sign-in failed."); setState("locked");
    } finally {if (attempt === generation.current) loginPending.current = false;}
  }
  async function save(publish: boolean) {
    if (!document) return;
    const attempt = generation.current;
    setState(publish ? "publishing" : "saving"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/content", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({action: publish ? "publish" : "save", version: document.version, values})});
      const result = await response.json();
      if (attempt !== generation.current) return;
      if (!response.ok) {if (response.status === 401) {retainEdits(); setDocument(null); setValues({}); setAccessExpiresAt(0); setState("locked");} throw new Error(result.error);}
      if (Date.now() >= accessExpiresAt) {retainEdits(); setDocument(null); setValues({}); setAccessExpiresAt(0); setState("locked"); throw new Error("Content access expired. Enter your PIN again.");}
      setDocument(result); setValues(result.draft); setNotice(publish ? "Published. Open website pages update within 5 seconds." : "Draft saved. The live website is unchanged."); setState("ready");
    } catch (error) {if (attempt !== generation.current) return; setError(error instanceof Error ? error.message : "Unable to save."); setState(current => current === "locked" ? "locked" : "ready");}
  }
  function logout(force = false) {if (force) return performLogout(); confirmDiscard(() => {void performLogout();}); return Promise.resolve();}
  async function performLogout() {
    const attempt = ++generation.current;
    loginPending.current = false;
    recovery.current = null; setHasRecovery(false);
    setDocument(null); setValues({}); setPin(""); setAccessExpiresAt(0); setState("locked"); setNotice(""); setError("");
    try {
      const response = await access.send("logout");
      if (!response.ok) throw new Error();
    } catch {if (attempt === generation.current) setError("Unable to clear content access. Please try locking again.");}
  }
  useImperativeHandle(ref, () => ({lock: () => {void logout(true);}}));
  return <section className="adm-cms" aria-label="Website content editor" aria-busy={busy}>
    {error && <div className="adm-cms-error" role="alert">{error}{document && <button onClick={() => confirmDiscard(() => {void load();})}>Reload latest draft</button>}</div>}
    {notice && <p className="adm-cms-success" role="status">{notice}</p>}
    {!document ? state === "loading" ? <p role="status">Checking content access...</p> : state === "unavailable" ? <div className="adm-cms-login"><h2>Content access unavailable</h2><p>Configure CONTENT_ADMIN_PIN and CONTENT_SESSION_SECRET on the server, then restart the app.</p><button className="adm-button secondary" onClick={load}>Try again</button></div> : <form className="adm-cms-login adm-cms-pin" onSubmit={event => {event.preventDefault(); void login(pin);}}><span className="adm-cms-pin-icon"><Icon name="shield" size={25}/></span><span className="adm-overline">PROTECTED ACCESS</span><h2>Unlock website content</h2><p>Enter your content PIN to edit, save drafts and publish. This access is separate from your admin workspace.</p><label>Security PIN<input type="password" inputMode="numeric" pattern="[0-9]{5}" minLength={5} maxLength={5} required autoComplete="off" placeholder="Enter your PIN" value={pin} onChange={event => {const next = event.target.value.replace(/\D/g, "").slice(0, 5); setPin(next); if (next.length === 5) void login(next);}} disabled={busy}/></label><button className="adm-button" disabled={busy}><Icon name="shield" size={16}/>{busy ? "Verifying..." : "Unlock content"}</button><small className="adm-cms-pin-note"><Icon name="clock" size={14}/>Access locks automatically after 15 minutes.</small></form> : <ContentWorkspace actionsTarget={actionsTarget} document={document} values={values} onChange={setValues} onSave={save} onLock={()=>logout()} state={state} accessExpiresAt={accessExpiresAt}/>}
  </section>;
}
