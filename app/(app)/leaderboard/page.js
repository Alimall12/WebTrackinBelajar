import { createClient } from "@/lib/supabase/server";
import { Trophy, Medal, Flame, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows, error } = await supabase.rpc("get_leaderboard");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Trophy className="h-6 w-6 text-amber-500" /> Papan Peringkat
        </h1>
        <p className="text-sm text-slate-500">Pantau progres kamu dan teman-teman.</p>
      </div>

      {error && (
        <div className="card p-4 text-sm text-red-600">
          Gagal memuat peringkat: {error.message}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3 text-right">Kesiapan</th>
                <th className="px-4 py-3 text-center">Belajar</th>
                <th className="px-4 py-3 text-center">Streak</th>
              </tr>
            </thead>
            <tbody>
              {(rows || []).map((r, i) => {
                const isMe = r.user_id === user?.id;
                return (
                  <tr
                    key={r.user_id}
                    className={cn(
                      "border-b border-slate-100 last:border-0",
                      isMe && "bg-brand-50/60"
                    )}
                  >
                    <td className="px-4 py-3">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar url={r.avatar_url} name={r.full_name} />
                        <span className="font-medium text-slate-700">
                          {r.full_name}
                          {isMe && <span className="ml-2 text-xs text-brand-600">(kamu)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-brand-600">{r.readiness_pct}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {r.completed_belajar}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <Flame className="h-4 w-4 text-orange-500" />
                        {r.streak_days}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {(!rows || rows.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    Belum ada data peringkat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank <= 3) {
    const colors = ["text-amber-500", "text-slate-400", "text-orange-400"];
    return <Medal className={cn("h-5 w-5", colors[rank - 1])} />;
  }
  return <span className="font-semibold text-slate-400">{rank}</span>;
}

function Avatar({ url, name }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} className="h-8 w-8 rounded-full object-cover" />;
  }
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
      {initial}
    </div>
  );
}
