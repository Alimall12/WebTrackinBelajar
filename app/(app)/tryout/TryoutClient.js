"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SUBTESTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";

const MIN_SCORE = 0;
const MAX_SCORE = 1200;

/** score_pu, score_pbm, ... — one column per subtest code */
const scoreKey = (code) => `score_${code.toLowerCase()}`;

const EMPTY_FORM = {
  tryout_date: "",
  platform: "",
  ...Object.fromEntries(SUBTESTS.map((s) => [scoreKey(s.code), ""])),
};

export default function TryoutClient({ initialResults }) {
  const supabase = createClient();

  const [results, setResults] = useState(initialResults);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // soft validation: warn about out-of-range scores but never block submit
  const outOfRange = useMemo(
    () =>
      SUBTESTS.filter((s) => {
        const raw = form[scoreKey(s.code)];
        if (raw === "" || raw == null) return false;
        const n = Number(raw);
        return Number.isNaN(n) || n < MIN_SCORE || n > MAX_SCORE;
      }).map((s) => s.code),
    [form]
  );

  function startEdit(r) {
    setEditingId(r.id);
    setMsg(null);
    setForm({
      tryout_date: r.tryout_date || "",
      platform: r.platform || "",
      ...Object.fromEntries(
        SUBTESTS.map((s) => [scoreKey(s.code), r[scoreKey(s.code)] ?? ""])
      ),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      tryout_date: form.tryout_date,
      platform: form.platform.trim() || null,
      ...Object.fromEntries(
        SUBTESTS.map((s) => {
          const raw = form[scoreKey(s.code)];
          const n = Number(raw);
          return [scoreKey(s.code), raw === "" || Number.isNaN(n) ? 0 : n];
        })
      ),
    };

    setSaving(true);
    const { data, error } = editingId
      ? await supabase
          .from("tryout_results")
          .update(payload)
          .eq("id", editingId)
          .select()
          .single()
      : await supabase.from("tryout_results").insert(payload).select().single();
    setSaving(false);

    if (error) {
      setMsg({ type: "error", text: error.message });
      return;
    }

    // keep the history sorted by newest date first
    setResults((prev) => {
      const next = editingId ? prev.map((r) => (r.id === editingId ? data : r)) : [data, ...prev];
      return [...next].sort((a, b) => (a.tryout_date < b.tryout_date ? 1 : -1));
    });
    setMsg({
      type: "success",
      text: editingId ? "Nilai tryout diperbarui." : "Nilai tryout disimpan.",
    });
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleDelete(id) {
    if (!confirm("Hapus riwayat tryout ini?")) return;
    const { error } = await supabase.from("tryout_results").delete().eq("id", id);
    if (error) {
      setMsg({ type: "error", text: error.message });
      return;
    }
    setResults((prev) => prev.filter((r) => r.id !== id));
    if (editingId === id) cancelEdit();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <ClipboardList className="h-6 w-6 text-brand-600" /> Tryout
          </h1>
          <p className="text-sm text-slate-500">
            Catat nilai tiap tryout, pantau perkembangannya di grafik Progress-Ku.
          </p>
        </div>
        <Link href="/dashboard" className="btn-ghost shrink-0">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Kembali</span>
        </Link>
      </div>

      {msg && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-4 p-5">
        <h2 className="font-semibold text-slate-800">
          {editingId ? "Edit Nilai Tryout" : "Tambah Nilai Tryout"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Tanggal Pengerjaan</label>
            <input
              type="date"
              className="input"
              required
              value={form.tryout_date}
              onChange={(e) => set("tryout_date", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Platform Tryout</label>
            <input
              className="input"
              value={form.platform}
              onChange={(e) => set("platform", e.target.value)}
              placeholder="mis. Pahamify, Zenius, TO Sekolah"
            />
          </div>
        </div>

        <div>
          <label className="label">Nilai per Subtes (skala 0–1200)</label>
          <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {SUBTESTS.map((s) => (
              <div key={s.code}>
                <span
                  className="mb-1 block text-xs font-bold"
                  style={{ color: s.color }}
                  title={s.name}
                >
                  {s.code}
                </span>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={form[scoreKey(s.code)]}
                  onChange={(e) => set(scoreKey(s.code), e.target.value)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          {outOfRange.length > 0 && (
            <p className="mt-2 text-xs text-amber-600">
              Nilai {outOfRange.join(", ")} di luar rentang {MIN_SCORE}–{MAX_SCORE}. Tetap bisa
              disimpan, tapi cek lagi ya.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editingId ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editingId ? "Simpan Perubahan" : "Simpan Nilai"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="btn-ghost">
              <XCircle className="h-4 w-4" />
              Batal
            </button>
          )}
        </div>
      </form>

      {/* History table */}
      <div className="card p-5">
        <h2 className="mb-3 font-semibold text-slate-800">Riwayat Tryout ({results.length})</h2>

        {results.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada riwayat tryout.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                  <th className="py-2 pr-2">Tanggal</th>
                  <th className="px-2 py-2">Platform</th>
                  {SUBTESTS.map((s) => (
                    <th key={s.code} className="px-2 py-2 text-center" title={s.name}>
                      {s.code}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-right">Rata-rata</th>
                  <th className="pl-2 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-slate-100 last:border-0",
                      editingId === r.id && "bg-brand-50"
                    )}
                  >
                    <td className="whitespace-nowrap py-2 pr-2 font-medium text-slate-700">
                      {formatDate(r.tryout_date)}
                    </td>
                    <td className="px-2 py-2 text-slate-500">{r.platform || "—"}</td>
                    {SUBTESTS.map((s) => (
                      <td key={s.code} className="px-2 py-2 text-center text-slate-600">
                        {formatScore(r[scoreKey(s.code)])}
                      </td>
                    ))}
                    <td className="px-2 py-2 text-right font-semibold text-brand-600">
                      {formatScore(r.average_score)}
                    </td>
                    <td className="pl-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(r)}
                          className="btn-ghost !px-2 text-brand-600 hover:bg-brand-50"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="btn-ghost !px-2 text-red-500 hover:bg-red-50"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** "2026-08-11" -> "11 Agu 2026" */
function formatDate(d) {
  if (!d) return "—";
  return new Date(`${d}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** NUMERIC comes back as a string from PostgREST */
function formatScore(v) {
  const n = Number(v);
  if (v == null || Number.isNaN(n)) return "0";
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}
