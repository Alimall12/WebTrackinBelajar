"use client";

import { useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDuration } from "@/lib/utils";
import VideoOverlay from "./VideoOverlay";
import { BookOpen, PlayCircle, Layers } from "lucide-react";

export default function MateriClient({ subtests, subtopics, initialProgress }) {
  const supabase = createClient();

  // progress keyed by subtopic_id for O(1) lookup
  const [progressMap, setProgressMap] = useState(() => {
    const m = {};
    for (const p of initialProgress) m[p.subtopic_id] = p;
    return m;
  });

  const [activeSubtest, setActiveSubtest] = useState(subtests[0]?.code ?? null);
  const [playing, setPlaying] = useState(null); // subtopic object

  const filtered = useMemo(
    () => subtopics.filter((s) => s.subtest_code === activeSubtest),
    [subtopics, activeSubtest]
  );

  // count subtopics per subtest for the sidebar badges
  const counts = useMemo(() => {
    const c = {};
    for (const s of subtopics) c[s.subtest_code] = (c[s.subtest_code] || 0) + 1;
    return c;
  }, [subtopics]);

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

  /** Upsert a progress row with partial changes and update local state. */
  const updateProgress = useCallback(
    async (subtopicId, patch) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const existing = progressMap[subtopicId] || {};
      const row = {
        user_id: user.id,
        subtopic_id: subtopicId,
        last_position_seconds: existing.last_position_seconds || 0,
        is_belajar: existing.is_belajar || false,
        is_latsol: existing.is_latsol || false,
        is_review: existing.is_review || false,
        ...patch,
      };

      // optimistic local update
      setProgressMap((prev) => ({ ...prev, [subtopicId]: { ...prev[subtopicId], ...row } }));

      const { error } = await supabase
        .from("user_progress")
        .upsert(row, { onConflict: "user_id,subtopic_id" });

      if (!error) markStreak();
    },
    [supabase, progressMap, markStreak]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Sidebar: 7 subtests */}
      <aside className="lg:sticky lg:top-20 h-max">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Layers className="h-4 w-4" /> Subtes
        </h2>
        <div className="flex gap-2 overflow-x-auto lg:flex-col">
          {subtests.map((s) => (
            <button
              key={s.code}
              onClick={() => setActiveSubtest(s.code)}
              className={cn(
                "flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full",
                activeSubtest === s.code
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              )}
            >
              <span className="font-bold">{s.code}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs",
                  activeSubtest === s.code ? "bg-white/20" : "bg-slate-100 text-slate-500"
                )}
              >
                {counts[s.code] || 0}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Grid of subtopic cards */}
      <section>
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-800">
            {subtests.find((s) => s.code === activeSubtest)?.name}
          </h1>
          <p className="text-sm text-slate-500">
            {filtered.length} submateri • Belajar otomatis tercentang saat tonton {">"}85%;
            centang manual ada di Capaian Belajar
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-10 text-center text-slate-400">
            <BookOpen className="h-8 w-8" />
            <p>Belum ada materi untuk subtes ini.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((st) => {
              const p = progressMap[st.id] || {};
              return (
                <article key={st.id} className="card flex flex-col p-4">
                  <div className="mb-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                      {st.topic_name}
                    </p>
                    <h3 className="font-semibold text-slate-800">{st.subtopic_name}</h3>
                    {st.duration_seconds ? (
                      <p className="text-xs text-slate-400">{formatDuration(st.duration_seconds)}</p>
                    ) : null}
                  </div>

                  <div className="mt-auto">
                    <Thumbnail
                      subtopic={st}
                      resume={!!p.last_position_seconds}
                      onClick={() => setPlaying(st)}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {playing && (
        <VideoOverlay
          subtopic={playing}
          progress={progressMap[playing.id]}
          onClose={() => setPlaying(null)}
          onProgress={(pos) => updateProgress(playing.id, { last_position_seconds: pos })}
          onComplete={() => updateProgress(playing.id, { is_belajar: true })}
        />
      )}
    </div>
  );
}

/** YouTube thumbnail + play overlay; the whole thing opens the player. */
function Thumbnail({ subtopic, resume, onClick }) {
  if (!subtopic.video_id) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <BookOpen className="h-7 w-7" />
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      title={resume ? "Lanjutkan menonton" : "Tonton"}
      className="group relative block w-full overflow-hidden rounded-lg bg-slate-900"
    >
      {/* hqdefault is 4:3 with pillarbox bars — object-cover crops them off */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${subtopic.video_id}/hqdefault.jpg`}
        alt={subtopic.subtopic_name}
        loading="lazy"
        className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
        <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" strokeWidth={1.5} />
      </span>
      {resume && (
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Lanjutkan
        </span>
      )}
    </button>
  );
}
