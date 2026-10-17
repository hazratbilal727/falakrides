"use client";
import {usePathname} from "next/navigation";
import Link from "./header-link";
import Icon from "@/components/ui/icon";

export default function MobileBottomNavigation() {
  const pathname = usePathname();
  return <nav className="mobile-bottom-nav" aria-label="Quick navigation">
    <Link href="/" aria-current={pathname === "/" ? "page" : undefined}><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/></svg><span>Home</span></Link>
    <Link href="/services" aria-current={pathname === "/services" ? "page" : undefined}><Icon name="star" size={21}/><span>Services</span></Link>
    <Link href="/book-a-ride" className="mobile-bottom-book" aria-label="Book a ride"><span className="mobile-bottom-book-icon"><Icon name="car" size={23}/></span><span>Book</span></Link>
    <button type="button" onClick={() => window.dispatchEvent(new Event("falak:open-profile"))}><Icon name="user" size={21}/><span>Profile</span></button>
  </nav>;
}
