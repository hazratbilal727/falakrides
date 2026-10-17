import {notFound} from "next/navigation";
import AdminApp from "@/features/admin/components/admin-app";
import {adminSectionFromPath} from "@/features/admin/routes";
import {requireAdmin, canAccess} from "@/lib/auth";
import {adminSnapshot} from "@/features/admin/server";

export default async function AdminSectionPage({params}: {params: Promise<{section: string}>}) {
  const {section: slug} = await params;
  const section = adminSectionFromPath(`/admin/${slug}`);
  if (!section) notFound();
  const user = await requireAdmin();
  if (section !== "overview" && !canAccess(user.role, section)) notFound();
  return <AdminApp initial={await adminSnapshot(user)}/>;
}
