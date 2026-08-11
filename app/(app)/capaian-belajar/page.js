import { createClient } from "@/lib/supabase/server";
import CapaianBelajarClient from "./CapaianBelajarClient";

export const dynamic = "force-dynamic";

export default async function CapaianBelajarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // kurikulum sendiri (checklist_*), bukan subtopics/user_progress milik halaman Materi
  const [{ data: groups }, { data: status }] = await Promise.all([
    supabase
      .from("checklist_groups")
      .select("id, name, sort_order, checklist_items(id, name, sort_order, checklist_item_subtests(subtest_code))")
      .order("sort_order")
      .order("sort_order", { referencedTable: "checklist_items" }),
    supabase.from("user_checklist_status").select("*").eq("user_id", user.id),
  ]);

  return <CapaianBelajarClient groups={groups || []} initialStatus={status || []} />;
}
