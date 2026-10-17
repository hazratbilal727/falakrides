"use client";

import Link from "next/link";

export default function ErrorPage({retry}: {error: Error & {digest?: string}; retry: () => void}) {
  return <main className="route-feedback"><span className="eyebrow">FALAK RIDES</span><h2>We couldn’t load this page.</h2><p>Please try again or return to the homepage.</p><div className="actions"><button className="button" onClick={() => retry()}>Try again</button><Link href="/">Return home</Link></div></main>;
}
