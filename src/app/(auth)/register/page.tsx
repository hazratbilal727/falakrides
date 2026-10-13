import AuthForm from "@/features/auth/components/auth-form";
import {notFound} from "next/navigation";
import "@/app/admin/admin.css";
export const metadata = {title: "Activate account | Falak Rides", robots: {index: false, follow: false}};
export default async function Page({searchParams}: {searchParams: Promise<{token?: string}>}) {const {token} = await searchParams; if (!token || !/^[a-f0-9]{64}$/.test(token)) notFound(); return <div className="admin-app adm-auth-app"><AuthForm token={token}/></div>;}
