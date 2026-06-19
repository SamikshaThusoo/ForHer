"use client";
import { motion } from "framer-motion";

interface Props {
  /** Numeric series, last value = today. Min 2 points. */
  values: number[];
  /** Width and height in CSS px. */
  width?: number;
  height?: number;
  /** Stroke color. Orange to match brand accent. */
  stroke?: string;
  /** Optional faint area fill below the line. */
  fillBelow?: boolean;
  /** Optional class applied to the root svg. */
  className?: string;
}

/**
 * Thin trend sparkline — no axes, no labels, no grid.
 * Just a curve + a small dot at the latest point. Designed to sit
 * directly under a hero metric and read at a glance.
 *
 * Strict rules:
 *  • No more than 24px tall.
 *  • One color stroke.
 *  • Smoothed via Catmull-Rom-style Bezier control points.
 */
export function Sparkline({
  values,
  width = 120,
  height = 22,
  stroke = "#F67F1B",
  fillBelow = false,
  className,
}: Props) {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  // Inset so the round stroke isn't clipped at top/bottom edges
  const pad = 3;
  const innerH = Math.max(1, height - pad * 2);
  const innerW = Math.max(1, width - pad * 2);

  const points = values.map((v, i) => {
    const x = pad + (innerW * i) / (values.length - 1);
    const y = pad + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });

  // Smoothed path using simple cardinal-spline-ish curve
  const d = points
    .map((p, i, arr) => {
      if (i === 0) return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      const prev = arr[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `Q ${cx.toFixed(2)} ${prev.y.toFixed(2)} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    })
    .join(" ");

  const areaD = fillBelow
    ? `${d} L ${points[points.length - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`
    : null;

  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className={className}>
      {areaD && (
        <path d={areaD} fill={stroke} opacity="0.08" />
      )}
      <motion.path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
      />
      <motion.circle
        cx={last.x}
        cy={last.y}
        r={2.4}
        fill={stroke}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 1.05 }}
      />
    </svg>
  );
}
