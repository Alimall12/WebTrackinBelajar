"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extractVideoId, formatDuration, cn } from "@/lib/utils";
import { Plus, Trash2, Youtube, Loader2, Shield, Pencil, Save, XCircle } from "lucide-react";

const EMPTY_FORM = {
  topic_name: "",
  subtopic_name: "",
  youtube_url: "",
  duration_min: "",
  duration_sec: "",
  notes: "",
  topics_text: "",
};

export default function AdminMaterialsClient({ subtests, initialSubtopics }) {
  const supabase = createClient();

  const [subtopics, setSubtopics] = useState(initialSubtopics);
  const [form, setForm] = useState({
    subtest_code: subtests[0]?.code || "",
    ...EMPTY_FORM,
  });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const previewId = extractVideoId(form.youtube_url);

  /** Load an existing subtopic into the form for editing. */
  function startEdit(s) {
    setEditingId(s.id);
    setMsg(null);
    setForm({
      subtest_code: s.subtest_code,
      topic_name: s.topic_name || "",
      subtopic_name: s.subtopic_name || "",
      youtube_url: s.youtube_url || "",
      duration_min: s.duration_seconds ? String(Math.floor(s.duration_seconds / 60)) : "",
      duration_sec: s.duration_seconds ? String(s.duration_seconds % 60) : "",
      notes: s.notes || "",
      topics_text: Array.isArray(s.topics) ? s.topics.join("\n") : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm((f) => ({ subtest_code: f.subtest_code, ...EMPTY_FORM }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    const videoId = extractVideoId(form.youtube_url);
    if (!videoId) {
      setMsg({ type: "error", text: "URL YouTube tidak valid." });
      return;
    }

    const duration =
      (parseInt(form.duration_min || "0", 10) || 0) * 60 +
      (parseInt(form.duration_sec || "0", 10) || 0);

    const payload = {
      subtest_code: form.subtest_code,
      topic_name: form.topic_name.trim(),
      subtopic_name: form.subtopic_name.trim(),
      youtube_url: form.youtube_url.trim(),
      video_id: videoId,
      duration_seconds: duration,
      notes: form.notes.trim() || null,
      topics: form.topics_text
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    setSaving(true);
    const { data, error } = editingId
      ? await supabase.from("subtopics").update(payload).eq("id", editingId).select().single()
      : await supabase
          .from("subtopics")
          .insert({
            ...payload,
            sort_order: subtopics.filter((s) => s.subtest_code === form.subtest_code).length,
          })
          .select()
          .single();
    setSaving(false);

    if (error) {
      setMsg({ type: "error", text: error.message });
      return;
    }

    if (editingId) {
      setSubtopics((prev) => prev.map((s) => (s.id === editingId ? data : s)));
      setMsg({ type: "success", text: "Materi diperbarui." });
    } else {
      setSubtopics((prev) => [...prev, data]);
      setMsg({ type: "success", text: "Materi ditambahkan." });
    }
    setEditingId(null);
    setForm((f) => ({ subtest_code: f.subtest_code, ...EMPTY_FORM }));
  }

  async function handleDelete(id) {
    if (!confirm("Hapus materi ini?")) return;
    const { error } = await supabase.from("subtopics").delete().eq("id", id);
    if (error) {
      setMsg({ type: "error", text: error.message });
      return;
    }
    setSubtopics((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) cancelEdit();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <Shield className="h-6 w-6 text-brand-600" /> Kelola Materi
        </h1>
        <p className="text-sm text-slate-500">
          {editingId
            ? "Sedang mengedit materi — ubah kolom lalu simpan."
            : "Tambah video YouTube ke katalog subtes."}
        </p>
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

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
          <div>
            <label className="label">Subtes</label>
            <select
              value={form.subtest_code}
              onChange={(e) => set("subtest_code", e.target.value)}
              className="input"
              required
            >
              {subtests.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Nama Topik</label>
            <input
              className="input"
              required
              value={form.topic_name}
              onChange={(e) => set("topic_name", e.target.value)}
              placeholder="mis. Silogisme"
            />
          </div>

          <div>
            <label className="label">Nama Submateri</label>
            <input
              className="input"
              required
              value={form.subtopic_name}
              onChange={(e) => set("subtopic_name", e.target.value)}
              placeholder="mis. Dasar-dasar Silogisme"
            />
          </div>

          <div>
            <label className="label">Link YouTube</label>
            <div className="relative">
              <Youtube className="absolute left-3 top-2.5 h-4 w-4 text-red-500" />
              <input
                className="input pl-9"
                required
                value={form.youtube_url}
                onChange={(e) => set("youtube_url", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            {form.youtube_url && (
              <p className={`mt-1 text-xs ${previewId ? "text-emerald-600" : "text-red-500"}`}>
                {previewId ? `Video ID: ${previewId}` : "URL tidak dikenali"}
              </p>
            )}
          </div>

          <div>
            <label className="label">Durasi Video (opsional)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                className="input"
                value={form.duration_min}
                onChange={(e) => set("duration_min", e.target.value)}
                placeholder="menit"
              />
              <span className="text-slate-400">:</span>
              <input
                type="number"
                min="0"
                max="59"
                className="input"
                value={form.duration_sec}
                onChange={(e) => set("duration_sec", e.target.value)}
                placeholder="detik"
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Dipakai untuk info kartu. Auto-complete tetap pakai durasi asli dari player.
            </p>
          </div>

          <div>
            <label className="label">Catatan Materi (opsional)</label>
            <textarea
              className="input min-h-[80px]"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Ringkasan singkat materi yang tampil di atas video."
            />
          </div>

          <div>
            <label className="label">Daftar Topik (opsional)</label>
            <textarea
              className="input min-h-[80px]"
              value={form.topics_text}
              onChange={(e) => set("topics_text", e.target.value)}
              placeholder={"Satu baris = satu topik\nmis. Premis mayor & minor\nmis. Penarikan kesimpulan"}
            />
            <p className="mt-1 text-xs text-slate-400">Satu baris = satu poin bullet.</p>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingId ? "Simpan Perubahan" : "Tambah Materi"}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn-ghost shrink-0">
                <XCircle className="h-4 w-4" />
                Batal
              </button>
            )}
          </div>
        </form>

        {/* Preview + list */}
        <div className="space-y-4">
          {previewId && (
            <div className="card overflow-hidden">
              <div className="aspect-video w-full bg-black">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${previewId}`}
                  title="Preview"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-800">
              Materi Tersimpan ({subtopics.length})
            </h2>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {subtopics.length === 0 && (
                <p className="text-sm text-slate-400">Belum ada materi.</p>
              )}
              {subtopics.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
                    editingId === s.id ? "border-brand-500 bg-brand-50" : "border-slate-100"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">
                      <span className="mr-1 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-bold text-brand-600">
                        {s.subtest_code}
                      </span>
                      {s.subtopic_name}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {s.topic_name}
                      {s.duration_seconds ? ` • ${formatDuration(s.duration_seconds)}` : ""}
                      {s.notes || (Array.isArray(s.topics) && s.topics.length) ? " • 📝" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => startEdit(s)}
                      className="btn-ghost !px-2 text-brand-600 hover:bg-brand-50"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="btn-ghost !px-2 text-red-500 hover:bg-red-50"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
