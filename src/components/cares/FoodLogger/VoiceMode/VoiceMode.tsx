"use client";
import { useRef, useState } from "react";
import { FOODS } from "@/data/foods";
import { Mic, Square, Check } from "lucide-react";
import styles from "./VoiceMode.module.css";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Log a meal by voice — records audio via MediaRecorder. (In production the clip
 *  would be transcribed and matched; here it logs a representative item.) */
export function VoiceMode({ onLog }: { onLog: (foodId: string) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "recorded">("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const start = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        setState("recorded");
      };
      mediaRef.current = mr;
      mr.start();
      setSeconds(0);
      setState("recording");
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setErr("Microphone unavailable — try Search or Photo instead.");
    }
  };
  const stop = () => {
    mediaRef.current?.stop();
    if (timerRef.current) window.clearInterval(timerRef.current);
  };
  const reset = () => { setAudioUrl(null); setSeconds(0); setState("idle"); };

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>Say what you ate — e.g. &ldquo;a bowl of dal and two rotis&rdquo;.</p>

      {state === "idle" && (
        <button type="button" className={styles.mic} onClick={start} aria-label="Start recording"><Mic size={26} /></button>
      )}
      {state === "recording" && (
        <>
          <button type="button" className={`${styles.mic} ${styles.recording}`} onClick={stop} aria-label="Stop recording"><Square size={20} /></button>
          <span className={styles.timer}>Recording… {fmt(seconds)}</span>
        </>
      )}
      {state === "recorded" && (
        <div className={styles.recorded}>
          {audioUrl && <audio controls src={audioUrl} className={styles.audio} />}
          <div className={styles.row}>
            <button type="button" className={styles.secondary} onClick={reset}>Re-record</button>
            <button type="button" className={styles.primary} onClick={() => onLog(FOODS[0].id)}><Check size={15} /> Log meal</button>
          </div>
        </div>
      )}
      {err && <p className={styles.err}>{err}</p>}
    </div>
  );
}
