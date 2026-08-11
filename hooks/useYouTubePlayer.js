"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadYouTubeAPI } from "@/lib/youtube";
import { BELAJAR_THRESHOLD, POSITION_SAVE_INTERVAL_SEC } from "@/lib/constants";

/**
 * Mounts a YouTube player into `containerId` and wires up:
 *  - resume playback from `startSeconds`
 *  - periodic position reporting (every POSITION_SAVE_INTERVAL_SEC seconds)
 *  - auto-complete once watched fraction crosses BELAJAR_THRESHOLD (>85%)
 *
 * @param {object}   opts
 * @param {string}   opts.containerId  DOM id the iframe replaces
 * @param {string}   opts.videoId      YouTube video id
 * @param {number}   opts.startSeconds resume position
 * @param {function} opts.onProgress   (positionSeconds, durationSeconds) => void, throttled to 5s
 * @param {function} opts.onComplete   () => void, fired once when >85% watched
 */
export function useYouTubePlayer({
  containerId,
  videoId,
  startSeconds = 0,
  onProgress,
  onComplete,
}) {
  const playerRef = useRef(null);
  const pollRef = useRef(null);
  const completedRef = useRef(false);
  const lastSavedRef = useRef(0);
  const [ready, setReady] = useState(false);

  // keep latest callbacks without re-creating the player
  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onProgressRef.current = onProgress;
    onCompleteRef.current = onComplete;
  });

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      const current = Math.floor(p.getCurrentTime() || 0);
      const duration = Math.floor(p.getDuration() || 0);
      if (!duration) return;

      // report position at most every POSITION_SAVE_INTERVAL_SEC seconds
      if (current - lastSavedRef.current >= POSITION_SAVE_INTERVAL_SEC) {
        lastSavedRef.current = current;
        onProgressRef.current?.(current, duration);
      }

      // auto-complete once past the threshold (fires only once)
      if (!completedRef.current && current / duration >= BELAJAR_THRESHOLD) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    }, 1000);
  }, [stopPolling]);

  useEffect(() => {
    let cancelled = false;
    completedRef.current = false;
    lastSavedRef.current = startSeconds;
    setReady(false);

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !YT) return;

      // Destroy any previous instance before creating a new one.
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new YT.Player(containerId, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          start: Math.max(0, Math.floor(startSeconds)),
        },
        events: {
          onReady: () => {
            if (!cancelled) setReady(true);
          },
          onStateChange: (e) => {
            // 1 = playing, 2 = paused, 0 = ended
            if (e.data === YT.PlayerState.PLAYING) {
              startPolling();
            } else if (e.data === YT.PlayerState.PAUSED) {
              // save exact position on pause
              const current = Math.floor(playerRef.current?.getCurrentTime() || 0);
              const duration = Math.floor(playerRef.current?.getDuration() || 0);
              if (duration) {
                lastSavedRef.current = current;
                onProgressRef.current?.(current, duration);
              }
              stopPolling();
            } else if (e.data === YT.PlayerState.ENDED) {
              stopPolling();
              if (!completedRef.current) {
                completedRef.current = true;
                onCompleteRef.current?.();
              }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      stopPolling();
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId, videoId, startSeconds, startPolling, stopPolling]);

  return { ready };
}
