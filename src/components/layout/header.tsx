"use client";

import Link from "./header-link";
import {useEffect, useRef} from "react";
import Navigation from "./navigation";

import {useSiteCompany, useWebsite} from "@/features/content/public-content";

export default function Header() {
  const company=useSiteCompany();const {copy:c}=useWebsite();
  const words=company.name.split(/\s+/);const last=words.length>1?words.pop():"";
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
      <Link className="brand" href="/" aria-label={`${company.name} home`}><span className="brand-mark" aria-hidden="true">f<span>&#8599;</span></span><span>{words.join(" ")}<span className="brand-light">{last}</span></span></Link>
      <Navigation/>
      <Link href="/book-a-ride" className="button header-cta" aria-label="Book a ride">{c.bookNow}</Link>

    </header>

  </div>;
}
