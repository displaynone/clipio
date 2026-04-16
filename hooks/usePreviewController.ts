import { PreviewController } from "@/features/video-editor/preview/contracts";
import { VideoProject } from "@/features/video-editor/domain/video-project";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function clampTime(timeMs: number, durationMs: number) {
  return Math.max(0, Math.min(durationMs, timeMs));
}

export function usePreviewController(project: VideoProject): PreviewController {
  const durationMs = project.canvas.durationMs;
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const baseTimeRef = useRef(0);

  useEffect(() => {
    setCurrentTimeMs((previous) => clampTime(previous, durationMs));
  }, [durationMs]);

  useEffect(() => {
    if (!isPlaying) {
      startedAtRef.current = null;
      baseTimeRef.current = currentTimeMs;
      return;
    }

    startedAtRef.current = Date.now();
    baseTimeRef.current = currentTimeMs;

    const interval = setInterval(() => {
      const startedAt = startedAtRef.current;
      if (startedAt == null) {
        return;
      }

      const elapsedMs = Date.now() - startedAt;
      const nextTimeMs = clampTime(baseTimeRef.current + elapsedMs, durationMs);

      setCurrentTimeMs(nextTimeMs);
      if (nextTimeMs >= durationMs) {
        setIsPlaying(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentTimeMs, durationMs, isPlaying]);

  const play = useCallback(() => {
    setCurrentTimeMs((previous) => {
      const nextTime = previous >= durationMs ? 0 : previous;
      baseTimeRef.current = nextTime;
      return nextTime;
    });
    setIsPlaying(true);
  }, [durationMs]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const seekTo = useCallback(
    (timeMs: number) => {
      const nextTime = clampTime(timeMs, durationMs);
      baseTimeRef.current = nextTime;
      startedAtRef.current = isPlaying ? Date.now() : null;
      setCurrentTimeMs(nextTime);
    },
    [durationMs, isPlaying],
  );

  const seekBy = useCallback(
    (deltaMs: number) => {
      seekTo(currentTimeMs + deltaMs);
    },
    [currentTimeMs, seekTo],
  );

  const togglePlayback = useCallback(() => {
    setIsPlaying((previous) => !previous);
  }, []);

  return useMemo(
    () => ({
      state: {
        currentTimeMs,
        durationMs,
        isPlaying,
        isReady: true,
      },
      play,
      pause,
      togglePlayback,
      seekTo,
      seekBy,
    }),
    [currentTimeMs, durationMs, isPlaying, pause, play, seekBy, seekTo, togglePlayback],
  );
}

