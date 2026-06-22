"use client";
import { useMemo } from "react";
import { usePersona } from "@/context/PersonaContext";
import { avatarSvgUriFor } from "@/lib/avatar";

/**
 * Cartoon avatar shown inside the Cares hero ring.
 *
 * Uses DiceBear `personas` style (flat-illustration character with head + shoulders)
 * seeded deterministically from `persona.avatarSeed`. Background is pre-filled
 * with #E5E8EE so it blends with the avatarInner circle behind it.
 */
export function CartoonAvatar({ size = 96 }: { size?: number }) {
  const { persona } = usePersona();
  const seed = persona.avatarSeed ?? persona.id ?? "default";
  const src = useMemo(() => avatarSvgUriFor(seed, "hero"), [seed]);

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
}
