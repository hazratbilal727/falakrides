"use client";

import Link, {scrollToPageTop} from "./header-link";
import {useRouter} from "next/navigation";
import {useId, useState} from "react";
import {publicPages} from "@/config/public-pages";
import {useSiteCatalog} from "@/features/content/public-content";
import Icon from "@/components/ui/icon";
import {useConfirmNavigation} from "@/components/forms/unsaved-changes";

export default function SiteSearch({onNavigate}: {onNavigate: () => void}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const id = useId();
  const router = useRouter();
  const confirmNavigation = useConfirmNavigation();
  const {routes} = useSiteCatalog();
  const entries = [
    ...publicPages.map(([label, href]) => ({label, href, keywords: href === "/services" ? "city airport transfers intercity Umrah Ziyarat" : href === "/contact" ? "phone WhatsApp email help" : href === "/policies" ? "privacy terms refunds cancellation" : href === "/vehicles" ? "cars fleet capacity luggage pricing" : ""})),
    ...routes.map(([from, to]) => ({label: from + " to " + to, href: "/routes", keywords: "route airport transfer"})),
  ];
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = terms.length ? entries.filter(entry => terms.every(term => (entry.label + " " + entry.keywords).toLowerCase().includes(term))).slice(0, 6) : [];
  const expanded = focused && terms.length > 0;
  function close() {setQuery(""); setFocused(false); onNavigate();}
  return <form className="site-search" role="search" onSubmit={event => {event.preventDefault(); if (results[0]) confirmNavigation(() => {scrollToPageTop(); router.push(results[0].href, {scroll: false}); close();});}} onBlur={event => {if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);}} onKeyDown={event => {if (event.key === "Escape" && expanded) {event.stopPropagation(); setFocused(false);}}}>
    <div className="site-search-field">
      <svg className="site-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
      <input type="search" aria-label="Search pages, services and routes" placeholder="Search..." value={query} maxLength={100} autoComplete="off" aria-controls={expanded ? id : undefined} onFocus={() => setFocused(true)} onChange={event => {setQuery(event.target.value); setFocused(true);}}/>
      <button className="site-search-submit" type="submit" aria-label="Search pages, services and routes"><span>Search</span><Icon name="arrow" size={15}/></button>
    </div>
    {expanded && <div className="site-search-results" id={id}>
      <p className="site-search-status" role="status">{results.length ? "Search results" : "No matches. Try airport, vehicles or support."}</p>
      {results.map(result => <Link key={result.label} href={result.href} onClick={close}>{result.label}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></Link>)}
    </div>}
  </form>;
}
