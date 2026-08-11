// lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Extract YouTube video ID from a URL or return the value as-is
 * if it looks like a plain ID already.
 */
export function extractVideoId(urlOrId) {
  if (!urlOrId) return null;
  const regexps = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?#]+)/,
    /embed\/([^?#]+)/,
    /shorts\/([^?#]+)/,
  ];
  for (const re of regexps) {
    const m = urlOrId.match(re);
    if (m) return m[1];
  }
  // Plain ID (11 chars, no slashes)
  if (/^[A-Za-z0-9_-]{11}$/.test(urlOrId.trim())) return urlOrId.trim();
  return null;
}

/** Format seconds to MM:SS or H:MM:SS */
export function formatDuration(seconds) {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Days from today to targetDate (positive = future, negative = past) */
export function daysUntil(targetDate) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}
