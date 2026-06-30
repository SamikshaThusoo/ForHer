"use client";
import { motion, useReducedMotion } from "framer-motion";

/* =====================================================================
   For Her cycle iconography — two reusable, themeable SVG marks used on
   the cycle ring and the calendar. Both colour via props (default to the
   existing ForHer phase tokens) and respect prefers-reduced-motion.
   ===================================================================== */

const PETALS = [0, 72, 144, 216, 288];

/** Brand florette ❀ — a soft five-petal bloom. Marks the fertile window
 *  (small) and the exact ovulation day (`bright` + larger). Optional
 *  bloom-in entrance and a slow sway loop, both stilled under reduced motion. */
export function Florette({
  size = 22,
  color = "#4F9D69",
  bright = false,
  bloom = false,
  sway = false,
  className,
}: {
  size?: number;
  color?: string;
  bright?: boolean;
  bloom?: boolean;
  sway?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const eye = bright ? 3.5 : 3.0;

  const bloomProps =
    bloom && !reduce
      ? {
          initial: { scale: 0.3, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { type: "spring" as const, stiffness: 240, damping: 13 },
        }
      : { initial: { scale: 1, opacity: 1 } };

  const swayProps =
    sway && !reduce
      ? {
          animate: { rotate: [0, -7, 0, 7, 0] },
          transition: { duration: 7, repeat: Infinity, ease: "easeInOut" as const },
        }
      : {};

  return (
    <motion.svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: "block", overflow: "visible", transformBox: "fill-box", transformOrigin: "center" }}
      {...bloomProps}
    >
      <motion.g style={{ transformBox: "fill-box", transformOrigin: "center" }} {...swayProps}>
        {PETALS.map((a) => (
          <ellipse
            key={a}
            cx={12}
            cy={6.6}
            rx={3.1}
            ry={5.3}
            fill={color}
            opacity={bright ? 1 : 0.9}
            transform={`rotate(${a} 12 12)`}
          />
        ))}
        <circle cx={12} cy={12} r={eye} fill="#fff" opacity={0.94} />
        <circle cx={12} cy={12} r={eye - 1.5} fill={color} />
      </motion.g>
    </motion.svg>
  );
}

/** A clean teardrop. Marks period days on the ring and calendar. `fill={false}`
 *  gives an outlined drop for predicted (not-yet-logged) period days. */
export function BloodDrop({
  size = 16,
  color = "#C76B7A",
  deep = "#9E3B50",
  fill = true,
  className,
}: {
  size?: number;
  color?: string;
  deep?: string;
  fill?: boolean;
  className?: string;
}) {
  const gid = `fh-drop-${color.replace("#", "")}-${deep.replace("#", "")}`;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
      </defs>
      <path
        d="M12 2.6 C12 2.6 5.2 11 5.2 15.4 A6.8 6.8 0 1 0 18.8 15.4 C18.8 11 12 2.6 12 2.6 Z"
        fill={fill ? `url(#${gid})` : "none"}
        stroke={fill ? "none" : color}
        strokeWidth={fill ? 0 : 1.7}
      />
      {fill && <ellipse cx="9.5" cy="15.4" rx="1.7" ry="2.5" fill="#fff" opacity="0.34" />}
    </svg>
  );
}
