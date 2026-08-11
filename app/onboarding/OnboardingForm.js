"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_TARGET_DATE } from "@/lib/constants";
import { GraduationCap, Loader2 } from "lucide-react";

export default function OnboardingForm({ profile, email }) {
  const supabase = createClient();
  const router = useRouter();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [targetPtn, setTargetPtn] = useState(profile?.target_ptn || "");
  const [targetMajor, setTargetMajor] = useState(profile?.target_major || "");
  const [targetDate, setTargetDate] = useState(profile?.target_date || DEFAULT_TARGET_DATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      target_ptn: targetPtn,
      target_major: targetMajor,
      target_date: targetDate,
      onboarded: true,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="card w-full max-w-lg p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <GraduationCap className="mb-2 h-10 w-10 text-brand-600" />
          <h1 className="text-2xl font-bold text-slate-800">Lengkapi Profil</h1>
          <p className="text-sm text-slate-500">
            Isi data ini sekali untuk memulai. Login sebagai {email}.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
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
          <div>
            <label className="label">Target Tanggal Selesai Belajar</label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input"
            />
            <p className="mt-1 text-xs text-slate-400">Default: 28 Februari 2027</p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan & Mulai
          </button>
        </form>
      </div>
    </div>
  );
}
