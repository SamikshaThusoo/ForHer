import { useState } from "react";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

/** Native speech-to-text via expo-speech-recognition. Emits final chunks and the
 *  live interim string so the caller can fill an editable field. */
export function useVoice(onFinal: (text: string) => void, onInterim: (text: string) => void) {
  const [listening, setListening] = useState(false);

  useSpeechRecognitionEvent("result", (e) => {
    const t = e.results?.[0]?.transcript ?? "";
    if (e.isFinal) { if (t.trim()) onFinal(t.trim()); onInterim(""); }
    else onInterim(t);
  });
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("error", () => { setListening(false); onInterim(""); });

  const start = async () => {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) return;
      ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: false });
      setListening(true);
    } catch { setListening(false); }
  };
  const stop = () => { try { ExpoSpeechRecognitionModule.stop(); } catch { /* ignore */ } };

  return { supported: true, listening, start, stop };
}
