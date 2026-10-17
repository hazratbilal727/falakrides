import type {MetadataRoute} from "next";
export default function robots():MetadataRoute.Robots {const base=process.env.SITE_URL;return {rules:{userAgent:"*",...(base?{allow:"/"}:{disallow:"/"})},...(base?{sitemap:`${base.replace(/\/$/,"")}/sitemap.xml`}:{})};}
