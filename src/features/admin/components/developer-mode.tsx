"use client";

import {useEffect, useRef, useState} from "react";
import Icon from "@/components/ui/icon";
import {api} from "@/lib/api-client";
import type {WebsiteAvailability} from "@/features/content/website-availability";

export default function DeveloperMode({onClose}: {onClose: () => void}) {
  const [status, setStatus] = useState<WebsiteAvailability | null>(null);
  const [pin, setPin] = useState("");
  const unlockedPin = useRef("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const pending = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const pinInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const popup = dialog.current;
    if (!status) {popup?.showModal(); pinInput.current?.focus();}
    return () => {popup?.close();};
  }, [status]);
  useEffect(() => () => {unlockedPin.current = "";}, []);

  async function unlock(value: string) {
    if (pending.current || value.length !== 5) return;
    pending.current = true; setBusy(true); setError("");
    try {
      const result = await api<WebsiteAvailability>("/api/admin/developer-mode", {headers: {"x-developer-pin": value}});
      unlockedPin.current = value; setStatus(result); setPin("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to unlock Developer mode.");
      setPin(""); requestAnimationFrame(() => pinInput.current?.focus());
    } finally {pending.current = false; setBusy(false);}
  }

  async function togglePause() {
    if (!status || busy || pending.current) return;
    if (!status.paused && !window.confirm("Pause the public website? All public pages will return 404 until you resume it. Admin access will remain available.")) return;
    pending.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const result = await api<WebsiteAvailability>("/api/admin/developer-mode", {method: "PUT", headers: {"x-developer-pin": unlockedPin.current}, body: JSON.stringify({paused: !status.paused, version: status.version})});
      setStatus(result);
      setNotice(result.paused ? "Website paused. Public page requests now return 404." : "Website resumed. Public pages are available again.");
    } catch (reason) {setError(reason instanceof Error ? reason.message : "Unable to change website status.");}
    finally {pending.current = false; setBusy(false);}
  }

  if (!status) return <dialog ref={dialog} className="cms-developer-pin-dialog" aria-labelledby="developer-pin-title" onCancel={event => {event.preventDefault(); onClose();}} onClick={event => {if (event.target === event.currentTarget) onClose();}}>
    <button type="button" className="cms-developer-pin-close" aria-label="Close PIN popup" onClick={onClose}>?</button>
    <span className="cms-developer-lock-icon"><Icon name="lock" size={27}/></span>
    <h2 id="developer-pin-title">Developer mode</h2>
    <p>Enter your 5-digit PIN to continue.</p>
    <form onSubmit={event => {event.preventDefault(); void unlock(pin);}}>
      <label className="adm-sr-only" htmlFor="developer-pin">5-digit PIN</label>
      <input ref={pinInput} id="developer-pin" type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{5}" maxLength={5} aria-describedby="developer-pin-message" aria-invalid={!!error} readOnly={busy} value={pin} onChange={event => {const value = event.target.value.replace(/\D/g, "").slice(0, 5); setPin(value); if (value.length === 5) void unlock(value);}}/>
      <p id="developer-pin-message" role={error ? "alert" : "status"}>{error || (busy ? "Checking PIN..." : "Opens automatically after entering all 5 digits.")}</p>
    </form>
  </dialog>;

  return <section className="cms-developer-mode" aria-labelledby="developer-mode-title" aria-busy={busy}>
    <div className="cms-developer-heading"><span className="cms-developer-icon"><Icon name="shield" size={23}/></span><div><h2 id="developer-mode-title">Developer mode</h2><p>Control public website availability.</p></div></div>
    {error && <p className="adm-cms-error" role="alert">{error}</p>}
    {notice && <p className="adm-cms-success" role="status">{notice}</p>}
      <div className="cms-developer-option">
        <div><h3 id="website-pause-label">Pause website</h3><p id="website-pause-description">When enabled, all public pages show a 404 error. Turn it off to reopen the website.</p><span className={`adm-badge ${status.paused ? "amber" : "green"}`}>{status.paused ? "Website paused" : "Website live"}</span></div>
        <button type="button" className="cms-developer-switch" role="switch" aria-checked={status.paused} aria-labelledby="website-pause-label" aria-describedby="website-pause-description" disabled={busy} onClick={() => {void togglePause();}}><span/></button>
      </div>
      <p className="cms-developer-note">Changes take effect immediately without publishing content. Admin and login pages remain accessible.</p>
  </section>;
}
