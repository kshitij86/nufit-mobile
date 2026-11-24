import { useEffect, useRef, useState } from "react";

// expo-video can't load subtitle files that sit beside the video, so the player fetches the
// WebVTT itself and draws the cue that's showing over the video.

export interface Cue {
  start: number;
  end: number;
  text: string;
}

const LANGUAGE_LABELS: Record<string, string> = { en: "English", hi: "Hindi" };

export function languageLabel(code: string): string {
  return LANGUAGE_LABELS[code] ?? code.toUpperCase();
}

/** "01:02:03.500" or "02:03.500" (a comma works too) → seconds; null if it isn't a timestamp. */
function seconds(stamp: string): number | null {
  const match = /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/.exec(stamp.trim());
  if (!match) return null;
  const [, h, m, s, ms] = match;
  return Number(h ?? 0) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, "0")) / 1000;
}

/** The cues of a WebVTT file, in order. Styling tags are dropped; NOTE and STYLE blocks are skipped. */
export function parseVtt(text: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split("\n");
    const timing = lines.findIndex((l) => l.includes("-->"));
    if (timing < 0) continue;
    const [from, rest] = lines[timing].split("-->");
    const start = seconds(from);
    const end = seconds(rest.trim().split(/\s+/)[0] ?? "");
    const body = lines
      .slice(timing + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (start === null || end === null || !body) continue;
    cues.push({ start, end, text: body });
  }
  return cues.sort((a, b) => a.start - b.start);
}

/** The text showing at `time`, or null between cues. */
export function cueAt(cues: Cue[], time: number): string | null {
  const showing = cues.filter((c) => time >= c.start && time < c.end);
  return showing.length ? showing.map((c) => c.text).join("\n") : null;
}

/** The cues at `url`, fetched once per url; empty while loading, off (null) or if it fails. */
export function useCaptions(url: string | null): { cues: Cue[]; failed: boolean } {
  const cache = useRef(new Map<string, Cue[]>());
  const [state, setState] = useState<{ url: string | null; cues: Cue[]; failed: boolean }>({ url: null, cues: [], failed: false });

  useEffect(() => {
    if (!url) return;
    const cached = cache.current.get(url);
    if (cached) {
      setState({ url, cues: cached, failed: false });
      return;
    }
    let live = true;
    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => {
        const cues = parseVtt(text);
        cache.current.set(url, cues);
        if (live) setState({ url, cues, failed: false });
      })
      .catch(() => live && setState({ url, cues: [], failed: true }));
    return () => {
      live = false;
    };
  }, [url]);

  return url && state.url === url ? { cues: state.cues, failed: state.failed } : { cues: [], failed: false };
}
