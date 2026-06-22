"use client";
import { Silhouette } from "./Silhouette";
import { ScoreRing } from "@/components/cares/ScoreRing/ScoreRing";
import { avatarSvgUriFor } from "@/lib/avatar";
import { colorVarFor } from "@/lib/scoring";
import styles from "./DigitalTwin.module.css";

interface Props {
  initial: string;
  biologicalAge: number;
  chronologicalAge: number;
  score: number;
  /** "lg" = Cares-home hero (172 ring); "sm" = compact (96 ring). */
  size?: "sm" | "lg";
  variant?: "silhouette" | "avatar";
  seed?: string;
}

export function DigitalTwin({
  initial: _initial,
  biologicalAge,
  chronologicalAge,
  score,
  size = "sm",
  variant = "silhouette",
  seed,
}: Props) {
  const isLarge = size === "lg";
  // Match reference 03-cares-home: 172 / 138 / 112
  const ringDim = isLarge ? 172 : 96;
  const haloDim = isLarge ? 138 : 78;
  const innerDim = isLarge ? 112 : 64;
  const thickness = isLarge ? 10 : 7;

  const ageDelta = biologicalAge - chronologicalAge;
  const scoreColorVar = colorVarFor(score);

  const avatarSrc = variant === "avatar" && seed ? avatarSvgUriFor(seed) : null;

  return (
    <div className={styles.twin} data-size={size}>
      <div
        className={styles.ringWrap}
        style={{ width: ringDim, height: ringDim }}
      >
        <ScoreRing
          score={score}
          size={ringDim}
          thickness={thickness}
          showInnerNumber={false}
        />
        <div
          className={styles.halo}
          style={{ width: haloDim, height: haloDim }}
        >
          <div className={styles.inner} style={{ width: innerDim, height: innerDim }}>
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="" className={styles.avatarImg} draggable={false} />
            ) : (
              <Silhouette size={innerDim} />
            )}
          </div>
        </div>
        {isLarge && (
          <div className={styles.scoreNum}>
            <div className={styles.scoreValue} style={{ color: `var(${scoreColorVar})` }}>
              {score}
            </div>
            <div className={styles.scoreDenom}>/1000</div>
          </div>
        )}
      </div>

      <div className={styles.ageBadge}>
        <span className={styles.bioAge}>{biologicalAge}</span>
        <span className={styles.bioLabel}>biological age</span>
        {ageDelta > 0 && <span className={styles.delta}>+{ageDelta} yrs</span>}
        {ageDelta < 0 && <span className={styles.deltaGood}>{ageDelta} yrs</span>}
      </div>
    </div>
  );
}
