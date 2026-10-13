"use client";

import Link from "next/link";
import type {ComponentProps} from "react";

export function scrollToPageTop() {
  window.scrollTo({top: 0, left: 0, behavior: "instant"});
}

export default function HeaderLink(props: Omit<ComponentProps<typeof Link>, "onNavigate" | "scroll">) {
  return <Link {...props} scroll={false} onNavigate={scrollToPageTop}/>;
}
