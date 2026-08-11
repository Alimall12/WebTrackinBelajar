import { createClient } from "@/lib/supabase/server";
import MateriClient from "./MateriClient";

export const dynamic = "force-dynamic";

export default async function MateriPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subtests }, { data: subtopics }, { data: progress }] = await Promise.all([
    supabase.from("subtests").select("*").order("sort_order"),
    supabase.from("subtopics").select("*").order("sort_order").order("created_at"),
    supabase.from("user_progress").select("*").eq("user_id", user.id),
  ]);

  return (
    <MateriClient
      subtests={subtests || []}
      subtopics={subtopics || []}
      initialProgress={progress || []}
    />
  );
}
