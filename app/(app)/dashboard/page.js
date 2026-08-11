import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: subtests },
    { data: itemSubtests },
    { data: status },
    { data: streaks },
    { data: tryouts },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("subtests").select("*").order("sort_order"),
    // capaian subtes bersumber dari kurikulum checklist, bukan video (subtopics).
    // Item lintas-subtes punya 2 baris di sini, jadi otomatis dihitung di kedua subtes.
    supabase.from("checklist_item_subtests").select("item_id, subtest_code"),
    supabase.from("user_checklist_status").select("*").eq("user_id", user.id),
    supabase
      .from("user_streaks")
      .select("activity_date")
      .eq("user_id", user.id)
      .order("activity_date"),
    supabase
      .from("tryout_results")
      .select("id, tryout_date, platform, average_score")
      .eq("user_id", user.id)
      .order("tryout_date"),
  ]);

  // status keyed by checklist item
  const statusMap = {};
  for (const s of status || []) statusMap[s.item_id] = s;

  // per-subtest readiness
  const perSubtest = (subtests || []).map((s) => {
    const items = (itemSubtests || []).filter((t) => t.subtest_code === s.code);
    const total = items.length;
    let belajar = 0,
      latsol = 0,
      review = 0;
    for (const t of items) {
      const st = statusMap[t.item_id];
      if (st?.is_belajar) belajar++;
      if (st?.is_latsol) latsol++;
      if (st?.is_review) review++;
    }
    const denom = total * 3;
    const readiness = denom === 0 ? 0 : Math.round(((belajar + latsol + review) / denom) * 100);
    return {
      code: s.code,
      name: s.name,
      total,
      belajar,
      latsol,
      review,
      belajarPct: total ? Math.round((belajar / total) * 100) : 0,
      latsolPct: total ? Math.round((latsol / total) * 100) : 0,
      reviewPct: total ? Math.round((review / total) * 100) : 0,
      readiness,
    };
  });

  // total: item lintas-subtes dihitung SEKALI (beda dari per-subtes di atas)
  const totalItems = new Set((itemSubtests || []).map((t) => t.item_id)).size;
  const totalChecks = (status || []).reduce(
    (acc, s) => acc + (s.is_belajar ? 1 : 0) + (s.is_latsol ? 1 : 0) + (s.is_review ? 1 : 0),
    0
  );
  const totalReadiness = totalItems === 0 ? 0 : Math.round((totalChecks / (totalItems * 3)) * 100);

  return (
    <DashboardClient
      profile={profile}
      perSubtest={perSubtest}
      totalReadiness={totalReadiness}
      totalBelajar={(status || []).filter((s) => s.is_belajar).length}
      totalSubtopics={totalItems}
      streakDates={(streaks || []).map((s) => s.activity_date)}
      tryouts={tryouts || []}
    />
  );
}
