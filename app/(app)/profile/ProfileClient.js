"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_TARGET_DATE } from "@/lib/constants";
import { UserCircle, Loader2, CheckCircle2 } from "lucide-react";

export default function ProfileClient({ profile, userId }) {
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [targetPtn, setTargetPtn] = useState(profile?.target_ptn || "");
  const [targetMajor, setTargetMajor] = useState(profile?.target_major || "");
  const [targetDate, setTargetDate] = useState(profile?.target_date || DEFAULT_TARGET_DATE);
  const [targetScore, setTargetScore] = useState(profile?.target_score || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      target_ptn: targetPtn,
      target_major: targetMajor,
      target_date: targetDate,
      target_score: targetScore ? parseInt(targetScore, 10) : null,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-6">
        <div className="mb-6 flex items-center gap-3">
          <UserCircle className="h-8 w-8 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Profil Saya</h1>
            <p className="text-sm text-slate-500">Edit informasi profil Anda</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Profil berhasil diperbarui
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nama Lengkap</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="Nama kamu"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">PTN Tujuan</label>
              <input
                type="text"
                required
                value={targetPtn}
                onChange={(e) => setTargetPtn(e.target.value)}
                className="input"
                placeholder="mis. Universitas Indonesia"
              />
            </div>
            <div>
              <label className="label">Jurusan Tujuan</label>
              <input
                type="text"
                required
                value={targetMajor}
                onChange={(e) => setTargetMajor(e.target.value)}
                className="input"
                placeholder="mis. Teknik Informatika"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Target Tanggal Selesai Belajar</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Target Skor UTBK</label>
              <input
                type="number"
                min="0"
                max="1200"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="input"
                placeholder="mis. 700"
              />
              <p className="mt-1 text-xs text-slate-400">Skala 0–1200 (opsional)</p>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  );
}
