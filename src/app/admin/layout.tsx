import type {Metadata} from "next";
import "./admin.css";
import localFont from "next/font/local";
import {currentAdmin} from "@/lib/auth";
import {redirect} from "next/navigation";
const inter = localFont({src: "../../../public/fonts/inter-variable.ttf", variable: "--font-admin-inter", weight: "100 900", display: "swap"});
export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"Admin | Falak Rides",robots:{index:false,follow:false}};
// Authentication is enforced here and independently in every private API.
export default async function AdminLayout({children}:{children:React.ReactNode}) {if (!await currentAdmin()) redirect("/login"); return <div className={inter.variable}>{children}</div>; }
