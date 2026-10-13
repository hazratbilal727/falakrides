"use client";

import Link from "./header-link";
import SiteSearch from "./site-search";
import {usePathname} from "next/navigation";
import {publicPages} from "@/config/public-pages";
import {useEffect, useRef, useState} from "react";
import Icon from "@/components/ui/icon";

const desktopItems = [
  {label: "Home", href: "/"},
  {label: "Services", href: "/services"},
  {label: "Travel", links: publicPages.filter(([, href]) => ["/routes", "/offers"].includes(href))},
  {label: "Vehicles", href: "/vehicles"},
  {label: "Contact & Support", href: "/contact"},
  {label: "About Us", href: "/about"},
  {label: "Support", links: publicPages.filter(([, href]) => ["/faq", "/policies"].includes(href))},
];
const mobileItems = desktopItems.flatMap(item => item.links
  ? item.links.map(([label, href]) => ({label, href: String(href)}))
  : [{label: item.label, href: item.href!}]);

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [dropdown, setDropdown] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const drawer = useRef<HTMLDialogElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const search = useRef<HTMLDivElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!searchOpen) return;
    function outside(event: PointerEvent) {if (!search.current?.contains(event.target as Node)) setSearchOpen(false);}
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [searchOpen]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px)");
    function resize() {if (!media.matches) drawer.current?.close();}
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);

  useEffect(() => {
    if (!open && !dropdown) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setDropdown(null);
        if (dropdown) navigation.current?.querySelector<HTMLButtonElement>('[aria-expanded="true"]')?.focus();
        else menuButton.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (!navigation.current?.contains(target) && !menuButton.current?.contains(target)) {setOpen(false); setDropdown(null);}
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, dropdown]);

  return <>
    <button ref={menuButton} className="menu-toggle" aria-expanded={open || drawerOpen} aria-controls="navigation mobile-drawer" onClick={() => {if (window.matchMedia("(max-width: 600px)").matches) {drawer.current?.showModal(); setDrawerOpen(true);} else setOpen(!open);}}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        {open ? <path d="m6 6 12 12M6 18 18 6"/> : <path d="M4 7h16M4 12h16M4 17h16"/>}
      </svg>
      <span>{open ? "Close" : "Menu"}</span>
    </button>
    <nav ref={navigation} id="navigation" aria-label="Main navigation" className={open ? "nav open" : "nav"}>
      <div className="desktop-navigation">
        {desktopItems.map(item => item.links ? <div className="nav-group" key={item.label}
          onPointerEnter={event => {if (event.pointerType === "mouse") setDropdown(item.label);}}
          onPointerLeave={event => {if (event.pointerType === "mouse" && !event.currentTarget.contains(document.activeElement)) setDropdown(current => current === item.label ? null : current);}}
          onBlur={event => {if (!event.currentTarget.contains(event.relatedTarget)) setDropdown(current => current === item.label ? null : current);}}>
          <button type="button" className="nav-group-toggle" aria-expanded={dropdown === item.label} aria-controls={"nav-" + item.label.toLowerCase()} data-active={item.links.some(([, href]) => pathname === href)} onClick={() => setDropdown(dropdown === item.label ? null : item.label)}>{item.label}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
          <div id={"nav-" + item.label.toLowerCase()} className="nav-dropdown" hidden={dropdown !== item.label}>
            {item.links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setDropdown(null)}>{label}</Link>)}
          </div>
        </div> : <Link key={item.label} href={item.href!} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setDropdown(null)}>{item.label}</Link>)}
      </div>
      <div className="mobile-navigation">
        {mobileItems.map(({label, href}) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
      </div>
    </nav>
    <dialog ref={drawer} id="mobile-drawer" className="mobile-drawer" aria-labelledby="mobile-drawer-title" onClose={() => {setDrawerOpen(false); if (!document.querySelector("dialog[open]")) menuButton.current?.focus();}} onClick={event => {if (event.target === event.currentTarget) drawer.current?.close();}}>
      <div className="mobile-drawer-heading"><div><small>FALAK RIDES</small><h2 id="mobile-drawer-title">Explore your journey</h2></div><button type="button" aria-label="Close menu" onClick={() => drawer.current?.close()}>×</button></div>
      <nav aria-label="All mobile navigation">{[...publicPages.filter(([, href]) => href !== "/my-bookings"), ["Privacy", "/privacy"], ["Terms", "/terms"]].map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => drawer.current?.close()}>{label}<Icon size={16}/></Link>)}<Link href="/my-bookings" aria-current={pathname === "/my-bookings" ? "page" : undefined} onClick={() => drawer.current?.close()}>My bookings<Icon name="bag" size={16}/></Link><button type="button" onClick={() => {drawer.current?.close(); requestAnimationFrame(() => window.dispatchEvent(new Event("falak:open-profile")));}}>My profile<Icon name="user" size={16}/></button></nav>
      <p className="mobile-drawer-note">Your journey, made comfortable.</p>
    </dialog>
    <div className="header-search" ref={search} data-mobile-open={searchOpen} onKeyDown={event => {if (event.key === "Escape") {setSearchOpen(false); searchButton.current?.focus();}}}><button className="mobile-search-toggle" ref={searchButton} type="button" aria-label={searchOpen ? "Close search" : "Open search"} aria-expanded={searchOpen} onClick={() => {setSearchOpen(value => !value); if (!searchOpen) requestAnimationFrame(() => search.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus());}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg></button><SiteSearch onNavigate={() => {setOpen(false); setDropdown(null); setSearchOpen(false);}}/></div>
  </>;
}
