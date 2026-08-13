"use client";

import { useEffect } from "react";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { X, Loader2, CheckCircle2, NotebookPen, Check } from "lucide-react";
import AIChat from "@/components/AIChat";

export default function VideoOverlay({ subtopic, progress, onClose, onProgress, onComplete }) {
  const containerId = `yt-player-${subtopic.id}`;

  const { ready } = useYouTubePlayer({
    containerId,
    videoId: subtopic.video_id,
    startSeconds: progress?.last_position_seconds || 0,
    onProgress: (pos) => onProgress(pos),
    onComplete: () => onComplete(),
  });

  // close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const chatContext = {
    topicName: subtopic.topic_name,
    subtopicName: subtopic.subtopic_name,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-6xl flex-col gap-4 lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video column */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                {subtopic.topic_name}
              </p>
              <h3 className="truncate font-semibold text-slate-800">{subtopic.subtopic_name}</h3>
            </div>
            <div className="flex items-center gap-3">
              {progress?.is_belajar && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Selesai
                </span>
              )}
              <button onClick={onClose} className="btn-ghost !px-2" title="Tutup (Esc)">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <NotesCard subtopic={subtopic} />

          <div className="relative aspect-video w-full bg-black">
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {/* The IFrame API replaces this div with the player iframe */}
            <div id={containerId} className="h-full w-full" />
          </div>

          <p className="px-4 py-2 text-center text-xs text-slate-400">
            Posisi tonton disimpan otomatis. Status &quot;Belajar&quot; tercentang saat tonton {">"}85%.
          </p>
        </div>

        {/* Chat column (desktop) */}
        <div className="hidden w-80 flex-col overflow-hidden rounded-xl bg-white shadow-xl lg:flex">
          <AIChat mode="embedded" context={chatContext} />
        </div>

        {/* Chat mobile (below video, collapsed by default) */}
        <div className="h-64 overflow-hidden rounded-xl bg-white shadow-xl lg:hidden">
          <AIChat mode="embedded" context={chatContext} />
        </div>
      </div>
    </div>
  );
}

/** Ringkasan topik & catatan materi, tampil di atas player. */
function NotesCard({ subtopic }) {
  const notes = subtopic.notes?.trim() || "";
  const topics = Array.isArray(subtopic.topics) ? subtopic.topics.filter(Boolean) : [];
  const isEmpty = !notes && topics.length === 0;

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <NotebookPen className="h-4 w-4 text-brand-600" /> Ringkasan Topik &amp; Catatan Materi
      </h4>

      {isEmpty ? (
        <p className="text-xs text-slate-400">Catatan untuk materi ini belum tersedia.</p>
      ) : (
        <div className="max-h-40 space-y-2 overflow-y-auto">
          {notes && (
            <p className="whitespace-pre-line text-sm text-slate-600">{notes}</p>
          )}
          {topics.length > 0 && (
            <ul className="space-y-1">
              {topics.map((t, i) => (
                <li key={i} className="flex items-start gap-1.5 text-sm text-slate-600">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
