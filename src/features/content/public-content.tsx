"use client";
import {websiteFromValues} from "./website-model";
import {createContext, useContext, useEffect, useRef, useState, useMemo} from "react";
import {useRouter} from "next/navigation";
import type {ContentValues, PublicCatalog} from "./types";
const ContentContext = createContext<ContentValues>({});
const CatalogContext = createContext<PublicCatalog>({vehicles: [], locations: [], routes: [], offers: [], reviews: []});
export function PublicContent({initial, catalog: initialCatalog, revision, children}: {initial: ContentValues; catalog: PublicCatalog; revision: string | null; children: React.ReactNode}) {
  const [values, setValues] = useState(initial);
  const [catalog, setCatalog] = useState(initialCatalog);
  const last = useRef(revision);
  const router = useRouter();
  useEffect(() => {
    let active = true; let busy = false;
    async function refresh() {
      if (document.hidden || busy) return;
      busy = true;
      try {
        const response = await fetch("/api/content", {cache: "no-store"});
        if (!response.ok) return;
        const content = await response.json();
        if (active && content.publishedAt !== last.current) {last.current = content.publishedAt; setValues(content.values); setCatalog(content.catalog); router.refresh();}
      } catch { /* Preserve the last published content during connection failures. */ }
      finally {busy = false;}
    }
    const timer = setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {active = false; clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh);};
  }, [router]);
  return <ContentContext.Provider value={values}><CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider></ContentContext.Provider>;
}
export function ContentText({id, fallback}: {id: string; fallback: string}) {return useContext(ContentContext)[id] ?? fallback;}
export function useContentValue(id: string, fallback: string) {return useContext(ContentContext)[id] ?? fallback;}
export function useSiteCatalog() {return useContext(CatalogContext);}
export function useWebsite() {const values=useContext(ContentContext);return useMemo(()=>websiteFromValues(values),[values]);}
export function useSiteCompany() {const values=useContext(ContentContext);return {name:values["company.name"] || "Falak Rides",description:values["company.description"] || "Private transportation across Makkah, Madinah and Jeddah."};}
export function useSiteContact() {
  const values = useContext(ContentContext);
  const phone = values["contact.phone"] ?? "+966 56 769 1863";
  return {phone, email: values["contact.email"] ?? "falakrides56@gmail.com", whatsapp: `https://wa.me/${phone.replace(/\D/g, "")}`};
}
