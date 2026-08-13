import { createClient } from "@/lib/supabase/server";
import FokusClient from "./FokusClient";

export const dynamic = "force-dynamic";

export default async function FokusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return <FokusClient userName={profile?.full_name || "Pejuang PTN"} />;
}
