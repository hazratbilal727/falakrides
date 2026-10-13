"use client";

import Link from "./header-link";
import {useEffect, useRef} from "react";
import Navigation from "./navigation";
import Icon from "@/components/ui/icon";
import {ContentText} from "@/features/content/public-content";
import UserProfile from "./user-profile";
import MobileBottomNavigation from "./mobile-bottom-navigation";
import "./mobile-navigation.css";

export default function Header() {
  const shell = useRef<HTMLDivElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const update = () => shell.current?.style.setProperty("--public-header-height", element.getBoundingClientRect().height + "px");
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className="public-header-shell" ref={shell}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="header" ref={header}>
      <Link className="brand" href="/" aria-label="Falak Rides home"><span className="brand-mark" aria-hidden="true">f<span>&#8599;</span></span><span><ContentText id="home.34" fallback="falak"/><span className="brand-light"><ContentText id="home.35" fallback="rides"/></span></span></Link>
      <Navigation/>
      <Link href="/book-a-ride" className="button header-cta" aria-label="Book a ride"><span className="header-cta-label"><ContentText id="home.36" fallback="Book a ride "/></span><span className="header-cta-short">Book</span><Icon size={17}/></Link>
      <UserProfile/>
    </header>
    <MobileBottomNavigation/>
  </div>;
}
