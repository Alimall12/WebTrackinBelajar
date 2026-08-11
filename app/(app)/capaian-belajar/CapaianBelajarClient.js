"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SUBTESTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ArrowLeft, BookOpen, Layers, ListChecks } from "lucide-react";

/** 5 kelompok sidebar — PBM/PPU dan PK/PM ditampilkan digabung */
const GROUPS = [
  { label: "PU", codes: ["PU"] },
  { label: "PBM/PPU", codes: ["PBM", "PPU"] },
  { label: "PK/PM", codes: ["PK", "PM"] },
  { label: "LBI", codes: ["LBI"] },
  { label: "LBE", codes: ["LBE"] },
];

const CODE_ORDER = SUBTESTS.map((s) => s.code);

export default function CapaianBelajarClient({ groups, initialStatus }) {
  const supabase = createClient();

  // status keyed by item_id for O(1) lookup
  const [statusMap, setStatusMap] = useState(() => {
    const m = {};
    for (const s of initialStatus) m[s.item_id] = s;
    return m;
  });

  // flatten checklist_groups -> satu baris per item, bawa daftar kode subtesnya
  const rows = useMemo(
    () =>
      groups.flatMap((g) =>
        (g.checklist_items || []).map((item) => ({
          id: item.id,
          name: item.name,
          groupName: g.name,
          // satu item bisa terhubung ke 2 subtes (mis. PK + PM)
          codes: (item.checklist_item_subtests || [])
            .map((r) => r.subtest_code)
            .sort((a, b) => CODE_ORDER.indexOf(a) - CODE_ORDER.indexOf(b)),
        }))
      ),
    [groups]
  );

  // buka kelompok pertama yang punya kurikulum, biar tabel tidak langsung kosong
  const [activeLabel, setActiveLabel] = useState(
    () =>
      (GROUPS.find((g) => rows.some((r) => r.codes.some((c) => g.codes.includes(c)))) ?? GROUPS[0])
        .label
  );
  const active = GROUPS.find((g) => g.label === activeLabel) ?? GROUPS[0];

  const filtered = useMemo(
    () => rows.filter((r) => r.codes.some((c) => active.codes.includes(c))),
    [rows, active]
  );

  // sub-group by (subtes + Materi) supaya dua kolom itu bisa share satu rowSpan
  const sections = useMemo(() => {
    const order = [];
    const byKey = {};
    for (const r of filtered) {
      const key = `${r.codes.join("/")}||${r.groupName}`;
      if (!byKey[key]) {
        byKey[key] = [];
        order.push(key);
      }
      byKey[key].push(r);
    }
    return order.map((key) => byKey[key]);
  }, [filtered]);

  /** capaian % = kotak tercentang / (item * 3); item lintas-subtes dihitung sekali */
  const pctOf = useCallback(
    (codes) => {
      const items = rows.filter((r) => r.codes.some((c) => codes.includes(c)));
      let checks = 0;
      for (const r of items) {
        const s = statusMap[r.id];
        if (s?.is_belajar) checks++;
        if (s?.is_latsol) checks++;
        if (s?.is_review) checks++;
      }
      return items.length ? Math.round((checks / (items.length * 3)) * 100) : 0;
    },
    [rows, statusMap]
  );

  /** Record today's activity for the streak grid (idempotent per day). */
  const markStreak = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from("user_streaks")
      .upsert({ user_id: user.id, activity_date: today }, { onConflict: "user_id,activity_date" });
  }, [supabase]);

  const toggle = useCallback(
    async (itemId, field) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const existing = statusMap[itemId] || {};
      const row = {
        user_id: user.id,
        item_id: itemId,
        is_belajar: existing.is_belajar || false,
        is_latsol: existing.is_latsol || false,
        is_review: existing.is_review || false,
      };
      row[field] = !row[field];

      // optimistic local update
      setStatusMap((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...row } }));

      const { error } = await supabase
        .from("user_checklist_status")
        .upsert(row, { onConflict: "user_id,item_id" });

      if (!error) markStreak();
    },
    [supabase, statusMap, markStreak]
  );

  const activeName = active.codes
    .map((c) => SUBTESTS.find((s) => s.code === c)?.name || c)
    .join(" / ");
  const activePct = pctOf(active.codes);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <ListChecks className="h-6 w-6 text-brand-600" /> Capaian Belajar
          </h1>
          <p className="text-sm text-slate-500">
            Daftar isi kurikulum UTBK. Centang Belajar / Latsol / Review tiap submateri — ini yang
            jadi sumber angka Tabel Capaian Subtes di Progress-Ku.
          </p>
        </div>
        <Link href="/dashboard" className="btn-ghost shrink-0">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Kembali</span>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar: 5 kelompok subtes */}
        <aside className="lg:sticky lg:top-20 h-max">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Layers className="h-4 w-4" /> Subtes
          </h2>
          <div className="flex gap-2 overflow-x-auto lg:flex-col">
            {GROUPS.map((g) => (
              <button
                key={g.label}
                onClick={() => setActiveLabel(g.label)}
                className={cn(
                  "flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full",
                  activeLabel === g.label
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                )}
              >
                <span className="font-bold">{g.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs",
                    activeLabel === g.label ? "bg-white/20" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {pctOf(g.codes)}%
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Tabel dikelompokkan per Materi */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800">{activeName}</h2>
            <p className="text-sm text-slate-500">
              {filtered.length} submateri • capaian {activePct}%
            </p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${activePct}%` }}
              />
            </div>
          </div>

          {sections.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 p-10 text-center text-slate-400">
              <BookOpen className="h-8 w-8" />
              <p>Belum ada kurikulum untuk subtes ini.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                    <th className="px-4 py-3">Subtes</th>
                    <th className="px-4 py-3">Materi</th>
                    <th className="px-4 py-3">Submateri</th>
                    <th className="px-2 py-3 text-center">Belajar</th>
                    <th className="px-2 py-3 text-center">Latsol</th>
                    <th className="px-2 py-3 text-center">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((items) =>
                    items.map((r, i) => {
                      const s = statusMap[r.id] || {};
                      return (
                        <tr
                          key={r.id}
                          className={cn(
                            "border-b border-slate-100 last:border-0",
                            i === 0 && "border-t border-slate-100"
                          )}
                        >
                          {i === 0 && (
                            <>
                              <td
                                rowSpan={items.length}
                                className="whitespace-nowrap px-4 py-2 align-top font-semibold text-slate-700"
                              >
                                {r.codes.join("/") || "—"}
                              </td>
                              <td
                                rowSpan={items.length}
                                className="px-4 py-2 align-top font-medium text-brand-600"
                              >
                                {r.groupName}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-2 text-slate-700">{r.name}</td>
                          <td className="px-2 py-2 text-center">
                            <Check
                              checked={!!s.is_belajar}
                              onChange={() => toggle(r.id, "is_belajar")}
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <Check
                              checked={!!s.is_latsol}
                              onChange={() => toggle(r.id, "is_latsol")}
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <Check
                              checked={!!s.is_review}
                              onChange={() => toggle(r.id, "is_review")}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Check({ checked, onChange }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 accent-brand-600 focus:ring-brand-500"
    />
  );
}
