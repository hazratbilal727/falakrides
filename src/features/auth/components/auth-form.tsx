"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import Icon from "@/components/ui/icon";
import Link from "next/link";
import "./auth-form.css";

export default function AuthForm({token}: {token?: string}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return <main className="adm-auth"><aside className="adm-auth-story"><Link href="/" className="adm-brand" aria-label="Falak Rides home"><span>f<span>r</span></span><strong>FALAK<span>RIDES</span></strong></Link><div className="adm-auth-story-copy"><span className="adm-auth-eyebrow"><span/>THE FALAK RIDES WORKSPACE</span><h1>Every journey.<br/><em>One place.</em></h1><p>A little more clarity. A smoother day.<br/>Your rides, your team, and the road ahead.</p></div><div className="adm-auth-art" aria-hidden="true"><div className="adm-auth-orbit"/><div className="adm-auth-orbit adm-auth-orbit-two"/><svg className="adm-auth-route" viewBox="0 0 500 220" fill="none"><path d="M45 174H163C219 174 165 65 235 65H439" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7"/><circle cx="45" cy="174" r="7" fill="currentColor"/><circle cx="439" cy="65" r="7" fill="currentColor"/></svg><span className="adm-auth-route-start"><Icon name="pin" size={15}/>Your next chapter</span><span className="adm-auth-route-end"><Icon name="check" size={15}/>A smoother journey</span><div className="adm-auth-journey-card"><span className="adm-auth-car-icon"><Icon name="car" size={30}/></span><div><small>BUILT AROUND YOUR JOURNEY</small><strong>Ready for the road ahead.</strong></div><Icon size={19}/></div></div><div className="adm-auth-story-footer"><span><Icon name="shield" size={16}/>Secure access</span><span><Icon name="car" size={16}/>Connected operations</span></div></aside><section className="adm-auth-form-side"><Link className="adm-auth-top-link" href="/">Back to website<Icon size={15}/></Link><div className="adm-auth-card"><div className="adm-auth-heading"><span className="adm-cms-pin-icon"><Icon name="shield" size={25}/></span><span className="adm-overline">YOUR WORKSPACE, READY WHEN YOU ARE</span><h2>{token ? "Activate your account" : "Welcome back."}</h2><p>{token ? "Set your password to get started." : "Sign in to manage your Falak Rides workspace."}</p></div><form onSubmit={async event => {
    event.preventDefault(); setBusy(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(token ? "/api/team/activate" : "/api/auth/sign-in/email", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(token ? {token, password: data.get("password")} : {email: data.get("email"), password: data.get("password")})});
      const result = await response.json(); if (!response.ok) throw new Error(result.message || result.error || "Unable to sign in.");
      if (token) {router.replace("/login"); router.refresh();} else {router.replace("/admin"); router.refresh();}
    } catch (error) {setError(error instanceof Error ? error.message : "Unable to connect.");} finally {setBusy(false);}
  }}>
    {!token && <label>Email<input type="email" name="email" required autoComplete="username" placeholder="you@example.com" disabled={busy}/></label>}
    <label>Password<input type="password" name="password" required minLength={token ? 12 : 1} maxLength={128} autoComplete={token ? "new-password" : "current-password"} placeholder="Enter your password" disabled={busy}/></label>
    {error && <p role="alert" className="adm-account-error">{error}</p>}
    <button type="submit" className="adm-button" disabled={busy}>{busy ? "Please wait..." : token ? "Activate account" : "Sign in"}<Icon size={17}/></button>
  </form><div className="adm-auth-secure"><Icon name="shield" size={15}/>Protected access for authorized team members</div></div><footer className="adm-auth-form-footer"><span>FALAK RIDES</span><span>Your journey, made comfortable.</span></footer></section></main>;
}
