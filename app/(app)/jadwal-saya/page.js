import { createClient } from "@/lib/supabase/server";
import JadwalSayaClient from "./JadwalSayaClient";

export const dynamic = "force-dynamic";

export default async function JadwalSayaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: checklists } = await supabase
    .from("user_checklists")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <JadwalSayaClient initialChecklists={checklists || []} />;
}
