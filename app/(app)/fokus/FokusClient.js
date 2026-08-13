"use client";

import { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";

export default function FokusClient({ userName }) {
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  function startTimer() {
    if (timeLeft === null) {
      setTimeLeft(duration * 60);
    }
    setIsRunning(true);
    setIsComplete(false);
  }

  function pauseTimer() {
    setIsRunning(false);
  }

  function resetTimer() {
    setIsRunning(false);
    setTimeLeft(null);
    setIsComplete(false);
  }

  function playBeep() {
    if (typeof window !== "undefined" && window.AudioContext) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => osc.stop(), 200);
    }
  }

  const displayTime = timeLeft !== null ? timeLeft : duration * 60;
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-8">
        <div className="mb-6 flex items-center gap-3">
          <Timer className="h-8 w-8 text-brand-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mode Fokus Belajar</h1>
            <p className="text-sm text-slate-500">Tingkatkan konsentrasi dengan timer Pomodoro</p>
          </div>
        </div>

        {isComplete && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Sesi fokus selesai! Bagus, {userName}! 🎉</span>
          </div>
        )}

        {timeLeft === null ? (
          <div className="space-y-4">
            <div>
              <label className="label">Durasi (menit)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                className="input"
              />
              <p className="mt-1 text-xs text-slate-400">Rekomendasi: 25 menit (Pomodoro)</p>
            </div>
            <button onClick={startTimer} className="btn-primary w-full">
              <Play className="h-4 w-4" />
              Mulai Timer
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-7xl font-bold tabular-nums text-slate-800">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {isRunning ? "Timer berjalan..." : "Timer dijeda"}
              </p>
            </div>

            <div className="flex gap-3">
              {!isRunning ? (
                <button onClick={startTimer} className="btn-primary flex-1">
                  <Play className="h-4 w-4" />
                  {timeLeft === duration * 60 ? "Mulai" : "Lanjutkan"}
                </button>
              ) : (
                <button onClick={pauseTimer} className="btn-ghost flex-1">
                  <Pause className="h-4 w-4" />
                  Jeda
                </button>
              )}
              <button onClick={resetTimer} className="btn-ghost">
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium">💡 Tips:</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>• Fokus pada satu materi selama timer berjalan</li>
            <li>• Matikan notifikasi dan hindari distraksi</li>
            <li>• Istirahat 5-10 menit setelah setiap sesi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
