import AdminApp from "@/features/admin/components/admin-app";
import {requireAdmin} from "@/lib/auth";
import {adminSnapshot} from "@/features/admin/server";
export default async function AdminPage() {const initial = await adminSnapshot(await requireAdmin()); return <AdminApp initial={initial}/>;}