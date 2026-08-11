import { createClient } from "@/lib/supabase/server";
import TryoutClient from "./TryoutClient";

export const dynamic = "force-dynamic";

export default async function TryoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: results } = await supabase
    .from("tryout_results")
    .select("*")
    .eq("user_id", user.id)
    .order("tryout_date", { ascending: false });

  return <TryoutClient initialResults={results || []} />;
}
