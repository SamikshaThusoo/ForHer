import styles from "./HabitHealthLogo.module.css";

interface Props {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "wordmark-only";
  className?: string;
}

/**
 * Habit Health lockup — recreation of the real logo.
 *
 * "HABIT" in a heavy royal-blue serif (Playfair Display) with the "A"
 * replaced by a stylised yoga-pose human figure in an orange→coral
 * vertical gradient. Below, "HEALTH" sits in Poppins 600, same blue,
 * letter-spaced wide.
 */
export function HabitHealthLogo({ size = "md", variant = "full", className }: Props) {
  return (
    <div
      className={`${styles.lockup} ${className ?? ""}`}
      data-size={size}
      data-variant={variant}
    >
      <div className={styles.word}>
        <span className={styles.letter}>H</span>
        <svg
          className={styles.figureA}
          viewBox="0 0 100 120"
          aria-hidden="true"
          role="img"
        >
          <defs>
            <linearGradient id="habit-figure-a" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#F5A623" />
              <stop offset="60%" stopColor="#F08144" />
              <stop offset="100%" stopColor="#E94B3F" />
            </linearGradient>
          </defs>
          {/* Stylised yoga figure forming an inverted V — the letter A.
              Head at apex, two leg strokes splay outward, crossbar at ~70%. */}
          {/* head */}
          <circle cx="50" cy="16" r="10" fill="url(#habit-figure-a)" />
          {/* left leg sweep */}
          <path
            d="M 50 28 C 42 46, 32 78, 18 112 L 34 112 C 42 88, 48 68, 56 50 Z"
            fill="url(#habit-figure-a)"
          />
          {/* right leg sweep */}
          <path
            d="M 56 50 C 64 68, 70 88, 82 112 L 98 112 C 84 78, 74 46, 66 28 C 60 26, 55 26, 50 28 Z"
            fill="url(#habit-figure-a)"
          />
          {/* crossbar — the horizontal of letter A */}
          <rect x="36" y="78" width="32" height="7" rx="2.5" fill="url(#habit-figure-a)" />
        </svg>
        <span className={styles.letter}>B</span>
        <span className={styles.letter}>I</span>
        <span className={styles.letter}>T</span>
      </div>
      {variant === "full" && <div className={styles.sub}>HEALTH</div>}
    </div>
  );
}
