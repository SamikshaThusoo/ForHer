"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Info } from "lucide-react";
import { MealField } from "../MealField/MealField";
import type { MealType } from "@/lib/forher/foodlog";
import styles from "./VoiceMode.module.css";

// Minimal typings for the browser Web Speech API (no library added). Only the
// members we use are declared; the constructor lives on window under one of two names.
type SpeechAlt = { transcript: string };
type SpeechResult = ArrayLike<SpeechAlt> & { isFinal: boolean };
interface SpeechEvent { resultIndex: number; results: ArrayLike<SpeechResult> }
interface SpeechErrEvent { error: string }
interface Recognition {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: SpeechErrEvent) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Log a meal by voice via the Web Speech API. Recognition is browser-provided and
 *  imperfect, so the transcript lands in the shared editable field for the user to
 *  correct before saving through the same Save button (method = voice). */
export function VoiceMode({ meal }: { meal: MealType }) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");        // committed transcript = the field value
  const [interim, setInterim] = useState("");  // in-progress words while speaking
  const [err, setErr] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(getRecognitionCtor() != null);
    return () => { try { recRef.current?.abort(); } catch { /* ignore */ } };
  }, []);

  const start = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) { setSupported(false); return; }
    setErr(null);
    const rec = new Ctor();
    rec.lang = typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let fin = "", inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) fin += t; else inter += t;
      }
      if (fin.trim()) setText((prev) => (prev ? prev + " " : "") + fin.trim());
      setInterim(inter);
    };
    rec.onerror = (e) => {
      setListening(false);
      setInterim("");
      if (e.error === "not-allowed" || e.error === "service-not-allowed")
        setErr("Microphone permission is blocked — allow it in your browser, or type your meal below.");
      else if (e.error === "no-speech")
        setErr("Didn't catch that — tap the mic to try again, or type it below.");
      else if (e.error === "audio-capture")
        setErr("No microphone found — type your meal below.");
      else if (e.error !== "aborted")
        setErr("Voice input stopped — you can type your meal below.");
    };
    rec.onend = () => { setListening(false); setInterim(""); };
    recRef.current = rec;
    try { rec.start(); setListening(true); }
    catch { setErr("Couldn't start voice input — type your meal below."); }
  };

  const stop = () => { try { recRef.current?.stop(); } catch { /* ignore */ } };

  // Unsupported browser → graceful fall back to the plain typed field.
  if (!supported) {
    return (
      <MealField
        meal={meal}
        method="voice"
        value={text}
        onChange={setText}
        placeholder="Type what you ate — e.g. two rotis, dal and a bowl of curd"
        note={<p className={styles.note}><Info size={13} /> Voice input isn&apos;t available in this browser — type your meal instead.</p>}
      />
    );
  }

  const topSlot = (
    <div className={styles.voiceTop}>
      {!listening ? (
        <button type="button" className={styles.mic} onClick={start} aria-label="Start voice input">
          <Mic size={24} />
        </button>
      ) : (
        <button type="button" className={`${styles.mic} ${styles.recording}`} onClick={stop} aria-label="Stop voice input">
          <Square size={18} />
        </button>
      )}
      <p className={styles.status} aria-live="polite">
        {listening
          ? (interim ? `“${interim}”` : "Listening… say what you ate")
          : "Tap the mic and speak — you can edit before saving"}
      </p>
    </div>
  );

  return (
    <MealField
      meal={meal}
      method="voice"
      value={text}
      onChange={setText}
      topSlot={topSlot}
      placeholder="Your words will appear here — you can edit before saving"
      note={err ? <p className={styles.err}>{err}</p> : null}
    />
  );
}
