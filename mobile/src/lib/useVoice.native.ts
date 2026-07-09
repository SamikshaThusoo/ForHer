import { useEffect, useState } from "react";

// Load the native speech module defensively: a custom-dev/EAS build has it, but
// Expo Go does not. If it's absent we report unsupported and the caller falls back
// to typing — no crash.
type SRModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (opts: { lang: string; interimResults: boolean; continuous: boolean }) => void;
  stop: () => void;
  addListener: (event: string, cb: (e: unknown) => void) => { remove: () => void } | undefined;
};
let SR: SRModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("expo-speech-recognition");
  SR = (mod?.ExpoSpeechRecognitionModule as SRModule) ?? null;
} catch {
  SR = null;
}

type ResultEvent = { results?: { transcript: string }[]; isFinal?: boolean };

/** Native speech-to-text via expo-speech-recognition when available. */
export function useVoice(onFinal: (text: string) => void, onInterim: (text: string) => void) {
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!SR) return;
    const subs = [
      SR.addListener("result", (e) => {
        const ev = e as ResultEvent;
        const t = ev.results?.[0]?.transcript ?? "";
        if (ev.isFinal) { if (t.trim()) onFinal(t.trim()); onInterim(""); }
        else onInterim(t);
      }),
      SR.addListener("end", () => setListening(false)),
      SR.addListener("error", () => { setListening(false); onInterim(""); }),
    ];
    return () => subs.forEach((s) => s?.remove?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = async () => {
    if (!SR) return;
    try {
      const perm = await SR.requestPermissionsAsync();
      if (!perm.granted) return;
      SR.start({ lang: "en-US", interimResults: true, continuous: false });
      setListening(true);
    } catch { setListening(false); }
  };
  const stop = () => { try { SR?.stop(); } catch { /* ignore */ } };

  return { supported: !!SR, listening, start, stop };
}
