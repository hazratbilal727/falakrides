"use client";

import BrandLogo from "@/components/ui/brand-logo";
import Link from "./header-link";
import {useEffect, useRef} from "react";
import Navigation from "./navigation";
import HeaderSearch from "./header-search";

import {useSiteCompany, useWebsite} from "@/features/content/public-content";

export default function Header() {
  const company=useSiteCompany();const {copy:c}=useWebsite();
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
      <Link className="brand" href="/" aria-label={`${company.name} home`}><BrandLogo name={company.name}/></Link>
      <Navigation/>
      <HeaderSearch/>
      <Link href="/book-a-ride" className="button header-cta" aria-label="Book a ride">{c.bookNow}</Link>

    </header>

  </div>;
}
