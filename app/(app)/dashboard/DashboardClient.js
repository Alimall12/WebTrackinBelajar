"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { daysUntil } from "@/lib/utils";
import {
  CalendarClock,
  Target,
  Flame,
  CheckCircle2,
  GraduationCap,
  ListChecks,
  ClipboardList,
  TrendingUp,
  ChevronRight,
  Award,
} from "lucide-react";
import StreakGrid from "./StreakGrid";

export default function DashboardClient({
  profile,
  perSubtest,
  totalReadiness,
  totalBelajar,
  totalSubtopics,
  streakDates,
  tryouts,
}) {
  const remaining = daysUntil(profile?.target_date);

  const radarData = useMemo(
    () => perSubtest.map((s) => ({ subtest: s.code, readiness: s.readiness })),
    [perSubtest]
  );

  // tryout average over time for the line chart
  const tryoutData = useMemo(
    () =>
      (tryouts || []).map((t) => ({
        date: formatShortDate(t.tryout_date),
        platform: t.platform || "—",
        average: Number(t.average_score) || 0,
      })),
    [tryouts]
  );

  // current consecutive-day streak from the date list
  const currentStreak = useMemo(() => computeStreak(streakDates), [streakDates]);

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/80">Halo, {profile?.full_name || "Pejuang PTN"} 👋</p>
            <h1 className="text-2xl font-bold">
              {profile?.target_ptn || "PTN Impian"}
              {profile?.target_major ? ` · ${profile.target_major}` : ""}
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-3">
            <CalendarClock className="h-6 w-6" />
            <div>
              <p className="text-xs text-white/80">Sisa hari menuju target</p>
              <p className="text-2xl font-bold">
                {remaining >= 0 ? `${remaining} hari` : `Lewat ${Math.abs(remaining)} hari`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Target}
          label="Kesiapan Total"
          value={`${totalReadiness}%`}
          accent="text-brand-600"
        />
        <StatTile
          icon={CheckCircle2}
          label="Submateri Selesai (Belajar)"
          value={`${totalBelajar}/${totalSubtopics}`}
          accent="text-emerald-600"
        />
        <StatTile
          icon={Flame}
          label="Streak Belajar"
          value={`${currentStreak} hari`}
          accent="text-orange-500"
        />
        <TargetScoreCard profile={profile} tryouts={tryouts} />
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <NavCard
          href="/capaian-belajar"
          icon={ListChecks}
          title="Capaian Belajar"
          desc="Centang Belajar / Latsol / Review per submateri."
        />
        <NavCard
          href="/tryout"
          icon={ClipboardList}
          title="Tryout"
          desc="Catat & pantau riwayat nilai tryout kamu."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar chart */}
        <div className="card p-5">
          <h2 className="mb-1 font-semibold text-slate-800">Sebaran Kesiapan 7 Subtes</h2>
          <p className="mb-2 text-xs text-slate-400">Persentase kesiapan tiap subtes (0–100%)</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subtest" tick={{ fill: "#475569", fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Radar
                  name="Kesiapan"
                  dataKey="readiness"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.45}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Achievement table */}
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-slate-800">Tabel Capaian Subtes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                  <th className="py-2 pr-2">Subtes</th>
                  <th className="px-2 py-2 text-center">Belajar</th>
                  <th className="px-2 py-2 text-center">Latsol</th>
                  <th className="px-2 py-2 text-center">Review</th>
                  <th className="pl-2 py-2 text-right">Kesiapan</th>
                </tr>
              </thead>
              <tbody>
                {perSubtest.map((s) => (
                  <tr key={s.code} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-2">
                      <span className="font-semibold text-slate-700">{s.code}</span>
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600">{s.belajarPct}%</td>
                    <td className="px-2 py-2 text-center text-slate-600">{s.latsolPct}%</td>
                    <td className="px-2 py-2 text-center text-slate-600">{s.reviewPct}%</td>
                    <td className="pl-2 py-2 text-right font-semibold text-brand-600">
                      {s.readiness}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tryout score trend */}
      <div className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
          <TrendingUp className="h-5 w-5 text-brand-600" /> Perkembangan Nilai Tryout
        </h2>
        <p className="mb-2 text-xs text-slate-400">
          Rata-rata nilai tiap tryout dari waktu ke waktu (skala 0–1200)
        </p>

        {tryoutData.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-slate-400">
            <ClipboardList className="h-8 w-8" />
            <p className="text-sm">Belum ada data tryout.</p>
            <Link href="/tryout" className="btn-ghost">
              Catat Nilai Tryout
            </Link>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tryoutData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 12 }} />
                <YAxis domain={[0, 1200]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip
                  formatter={(v) => [`${v}`, "Rata-rata"]}
                  labelFormatter={(label, payload) =>
                    payload?.[0] ? `${label} • ${payload[0].payload.platform}` : label
                  }
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  name="Rata-rata"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#2563eb" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Streak grid */}
      <div className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-slate-800">
          <GraduationCap className="h-5 w-5 text-brand-600" /> Aktivitas Belajar Harian
        </h2>
        <p className="mb-4 text-xs text-slate-400">
          Setiap kotak = satu hari. Warna makin pekat = ada aktivitas belajar.
        </p>
        <StreakGrid streakDates={streakDates} />
      </div>
    </div>
  );
}

function NavCard({ href, icon: Icon, title, desc }) {
  return (
    <Link
      href={href}
      className="card flex items-center gap-4 p-5 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
    >
      <span className="rounded-lg bg-brand-100 p-2.5 text-brand-600">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-800">{title}</span>
        <span className="block text-xs text-slate-500">{desc}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
    </Link>
  );
}

/** "2026-08-11" -> "11 Agu" */
function formatShortDate(d) {
  if (!d) return "—";
  return new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className={`rounded-lg bg-slate-50 p-3 ${accent}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

/** Consecutive-day streak ending today or yesterday. */
function computeStreak(dates) {
  if (!dates || dates.length === 0) return 0;
  const set = new Set(dates);
  let streak = 0;
  const cur = new Date();
  cur.setHours(0, 0, 0, 0);
  const iso = (d) => d.toISOString().slice(0, 10);
  if (!set.has(iso(cur))) cur.setDate(cur.getDate() - 1);
  while (set.has(iso(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

function TargetScoreCard({ profile, tryouts }) {
  const targetScore = profile?.target_score;
  
  if (!targetScore) {
    return (
      <Link
        href="/profile"
        className="card flex items-center gap-4 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
      >
        <div className="rounded-lg bg-slate-50 p-3 text-slate-400">
          <Award className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500">Target Skor UTBK</p>
          <p className="text-sm font-medium text-slate-600">Belum diatur</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
      </Link>
    );
  }

  // Latest tryout score
  const latestTryout = tryouts && tryouts.length > 0 ? tryouts[tryouts.length - 1] : null;
  const latestScore = latestTryout ? Number(latestTryout.average_score) : null;
  const diff = latestScore !== null ? latestScore - targetScore : null;

  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="rounded-lg bg-slate-50 p-3 text-purple-600">
        <Award className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs text-slate-500">Target Skor UTBK</p>
        <p className="text-2xl font-bold text-slate-800">{targetScore}</p>
        {diff !== null && (
          <p className={`text-xs font-medium ${diff >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
            {diff >= 0 ? "+" : ""}{diff} dari target
          </p>
        )}
      </div>
    </div>
  );
}
