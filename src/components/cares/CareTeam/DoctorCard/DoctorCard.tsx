import { Stethoscope, Video, Calendar, Clock } from "lucide-react";
import styles from "./DoctorCard.module.css";

interface Props { doctor: string; dateIso: string; }
export function DoctorCard({ doctor, dateIso }: Props) {
  const d = new Date(dateIso);
  const date = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return (
    <section className={styles.card}>
      <div className={styles.avatar}>
        <Stethoscope size={24} strokeWidth={1.75} />
      </div>
      <div>
        <p className={styles.label}>Next doctor consult · Tele/video</p>
        <p className={styles.name}>{doctor}</p>
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
      <button className={styles.join}>
        <Video size={13} strokeWidth={2} />
        <span>Join</span>
      </button>
    </section>
  );
}
