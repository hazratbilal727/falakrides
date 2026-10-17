import Link from "next/link";

export default function NotFound() {
  return <main className="route-feedback"><span className="eyebrow">FALAK RIDES</span><h1>Page not found.</h1><p>This page is unavailable. You can still explore our services and plan your ride.</p><Link className="button" href="/">Return to Falak Rides</Link></main>;
}
