// lib/constants.js

export const SUBTESTS = [
  { code: "PU",  name: "Penalaran Umum",                color: "#6366f1" },
  { code: "PBM", name: "Pemahaman Bacaan dan Menulis",   color: "#06b6d4" },
  { code: "PPU", name: "Pengetahuan dan Pemahaman Umum", color: "#10b981" },
  { code: "PK",  name: "Pengetahuan Kuantitatif",        color: "#f59e0b" },
  { code: "LBI", name: "Literasi Bahasa Indonesia",      color: "#ef4444" },
  { code: "LBE", name: "Literasi Bahasa Inggris",        color: "#8b5cf6" },
  { code: "PM",  name: "Penalaran Matematika",           color: "#ec4899" },
];

export const SUBTEST_MAP = Object.fromEntries(SUBTESTS.map((s) => [s.code, s]));

/** Completion threshold: >85% watch time = auto-mark "Belajar" */
export const BELAJAR_THRESHOLD = 0.85;

/** Save video position to DB every N seconds */
export const POSITION_SAVE_INTERVAL_SEC = 5;

export const DEFAULT_TARGET_DATE = "2027-02-28";
