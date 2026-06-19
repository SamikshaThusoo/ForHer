import { Salad, Calendar, Clock, ArrowRight } from "lucide-react";
import styles from "./CoachCard.module.css";
interface Props { coach: string; dateIso: string; }
export function CoachCard({ coach, dateIso }: Props) {
  const d = new Date(dateIso);
  const date = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return (
    <section className={styles.card}>
      <div className={styles.avatar}>
        <Salad size={24} strokeWidth={1.75} />
      </div>
      <div>
        <p className={styles.label}>Weekly coach session · Video</p>
        <p className={styles.name}>{coach}</p>
        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            <Calendar size={12} strokeWidth={2} />
            {date}
          </span>
          <span className={styles.metaItem}>
            <Clock size={12} strokeWidth={2} />
            {time}
          </span>
        </div>
      </div>
      <span className={styles.arrHint} aria-hidden>
        <ArrowRight size={18} strokeWidth={2} />
      </span>
      <p className={styles.agenda}>
        Agenda: review last week&apos;s logs, pick a glucose-friendly breakfast set, lock the evening snack swap.
      </p>
    </section>
  );
}
