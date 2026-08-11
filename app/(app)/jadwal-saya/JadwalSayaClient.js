"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SUBTESTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ListTodo, Loader2, Plus, Trash2 } from "lucide-react";

const UMUM = { code: "Umum", name: "Umum", color: "#64748b" };
/** 7 subtes resmi + "Umum" untuk target di luar kurikulum */
const CATEGORIES = [...SUBTESTS, UMUM];

export default function JadwalSayaClient({ initialChecklists }) {
  const supabase = createClient();

  const [items, setItems] = useState(initialChecklists);
  const [form, setForm] = useState({ category: UMUM.code, title: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const done = items.filter((i) => i.is_completed).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  // group by category, following the CATEGORIES order
  const groups = useMemo(() => {
    return CATEGORIES.map((c) => ({
      category: c,
      list: items.filter((i) => i.category === c.code),
    })).filter((g) => g.list.length > 0);
  }, [items]);

  async function handleAdd(e) {
    e.preventDefault();
    setMsg(null);

    const title = form.title.trim();
    if (!title) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    const { data, error } = await supabase
      .from("user_checklists")
      .insert({ user_id: user.id, title, category: form.category })
      .select()
      .single();
    setSaving(false);

    if (error) {
      setMsg({ type: "error", text: error.message });
      return;
    }
    setItems((prev) => [data, ...prev]);
    setForm((f) => ({ ...f, title: "" }));
  }

  async function toggleCompleted(item) {
    const next = !item.is_completed;

    // optimistic local update
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_completed: next } : i)));

    const { error } = await supabase
      .from("user_checklists")
      .update({ is_completed: next })
      .eq("id", item.id);

    if (error) {
      // roll back on failure
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_completed: item.is_completed } : i))
      );
      setMsg({ type: "error", text: error.message });
    }
  }

  async function handleDelete(id) {
    if (!confirm("Hapus target ini?")) return;
    const { error } = await supabase.from("user_checklists").delete().eq("id", id);
    if (error) {
      setMsg({ type: "error", text: error.message });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <ListTodo className="h-6 w-6 text-brand-600" /> Jadwal Saya
        </h1>
        <p className="text-sm text-slate-500">
          Target belajar mandiri di luar daftar materi resmi.
        </p>
      </div>

      {/* Progress header */}
      <div className="card p-5">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-500">Progress Target</p>
            <p className="text-2xl font-bold text-slate-800">
              {done}
              <span className="text-base font-medium text-slate-400"> / {items.length} selesai</span>
            </p>
          </div>
          <p className="text-2xl font-bold text-brand-600">{pct}%</p>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
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

      {/* Add form */}
      <form onSubmit={handleAdd} className="card grid gap-3 p-5 sm:grid-cols-[160px_1fr_auto]">
        <div>
          <label className="label">Kategori</label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code === UMUM.code ? c.name : `${c.code} — ${c.name}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Target Belajar</label>
          <input
            className="input"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="mis. Latihan soal logika 30 menit tiap pagi"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Tambah Target
          </button>
        </div>
      </form>

      {/* Checklist grouped by category */}
      {items.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-10 text-center text-slate-400">
          <ListTodo className="h-8 w-8" />
          <p>Belum ada target. Tambahkan target pertamamu di atas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(({ category, list }) => (
            <div key={category.code} className="card p-5">
              <h2 className="mb-3 flex items-center gap-2">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.code}
                </span>
                <span className="text-sm font-semibold text-slate-700">{category.name}</span>
                <span className="text-xs text-slate-400">
                  {list.filter((i) => i.is_completed).length}/{list.length}
                </span>
              </h2>

              <ul className="space-y-2">
                {list.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={!!item.is_completed}
                      onChange={() => toggleCompleted(item)}
                      className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-brand-600 focus:ring-brand-500"
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 break-words text-sm",
                        item.is_completed ? "text-slate-400 line-through" : "text-slate-700"
                      )}
                    >
                      {item.title}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="btn-ghost shrink-0 !px-2 text-red-500 hover:bg-red-50"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
