"use client";
import { Calendar, Clock, Video } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import styles from "./CareBanner.module.css";

function StethoscopeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 2v6a4 4 0 0 0 8 0V2" />
      <path d="M8 14a6 6 0 0 0 12 0v-2" />
      <circle cx={20} cy={10} r={2} />
    </svg>
  );
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatBits(iso: string): { day: string; time: string } {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { day: "TBD", time: "TBD" };
  const day = `${WEEKDAY[d.getDay()]}, ${d.getDate()} ${MONTH[d.getMonth()]}`;
  let hh = d.getHours();
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  const time = `${hh}:${mm} ${ampm}`;
  return { day, time };
}

function shortDoctorName(name: string): string {
  // Strip parenthetical specialty from "Dr Anjali Rao (Endocrinology)"
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

/**
 * Upcoming consult banner — only renders for enrolled users with a scheduled
 * next consult on file.
 */
export function CareBanner() {
  const { persona } = usePersona();
  const next = persona.cares.nextDoctorConsult;
  if (!next) return null;

  const { day, time } = formatBits(next.date);

  return (
    <div className={styles.care}>
      <div className={styles.tile}><StethoscopeIcon /></div>
      <div>
        <div className={styles.eyebrow}>Next consult · tele/video</div>
        <div className={styles.nm}>{shortDoctorName(next.doctor)}</div>
        <div className={styles.mt}>
          <span><Calendar size={12} strokeWidth={2} /> {day}</span>
          <span><Clock size={12} strokeWidth={2} /> {time}</span>
        </div>
      </div>
      <button className={styles.join}>
        <Video size={13} strokeWidth={2} /> Join
      </button>
    </div>
  );
}
