import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminMaterialsClient from "./AdminMaterialsClient";

export const dynamic = "force-dynamic";

export default async function AdminMaterialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const [{ data: subtests }, { data: subtopics }] = await Promise.all([
    supabase.from("subtests").select("*").order("sort_order"),
    supabase
      .from("subtopics")
      .select("*")
      .order("subtest_code")
      .order("sort_order")
      .order("created_at"),
  ]);

  return (
    <AdminMaterialsClient subtests={subtests || []} initialSubtopics={subtopics || []} />
  );
}
