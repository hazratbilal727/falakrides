import AuthForm from "@/features/auth/components/auth-form";
import {currentAdmin} from "@/lib/auth";
import {redirect} from "next/navigation";
import "@/app/admin/admin.css";
export const metadata = {title: "Admin sign in | Falak Rides", robots: {index: false, follow: false}};
export default async function Page() {if (await currentAdmin()) redirect("/admin"); return <div className="admin-app adm-auth-app"><AuthForm/></div>;}
