import { useRef, useState } from "react";

// Web / fallback implementation using the browser Web Speech API. Metro loads the
// .native.ts variant on iOS/Android, so the native speech module is never bundled
// for web. Same interface as the native hook.
type Rec = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start(): void; stop(): void;
};

function getCtor(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoice(onFinal: (text: string) => void, onInterim: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<Rec | null>(null);
  const Ctor = getCtor();

  const start = () => {
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false;
    rec.onresult = (e) => {
      let fin = "", inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) fin += t; else inter += t;
      }
      if (fin.trim()) onFinal(fin.trim());
      onInterim(inter);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); onInterim(""); };
    recRef.current = rec;
    try { rec.start(); setListening(true); } catch { setListening(false); }
  };
  const stop = () => { try { recRef.current?.stop(); } catch { /* ignore */ } };

  return { supported: !!Ctor, listening, start, stop };
}
