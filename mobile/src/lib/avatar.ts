import { createAvatar } from "@dicebear/core";
import {
  notionistsNeutral,
  personas,
  notionists,
  loreleiNeutral,
  micah,
} from "@dicebear/collection";

/**
 * Deterministic, clean avatar SVG (as data URI) from a seed string.
 * Same seed → same avatar. Used for persona portraits across the app.
 *
 * `notionistsNeutral` is the default — minimal monochrome line art for peers,
 * coaches, and small leaderboard chips.
 *
 * Use `kind` to pick a richer style for the hero Cares avatar where we want
 * a friendly, color-illustrated character.
 */
export function avatarSvgUriFor(
  seed: string,
  kind: "neutral" | "hero" | "soft" | "flat" = "neutral",
): string {
  switch (kind) {
    case "hero":
      // Personas: clean flat-illustration character (head + shoulders).
      // Friendly + clinical — best fit for the Cares hero avatar.
      return createAvatar(personas, {
        seed,
        size: 128,
        backgroundColor: ["E5E8EE"],
        skinColor: ["b16a5b"],
      }).toDataUri();
    case "soft":
      return createAvatar(loreleiNeutral, { seed, size: 96 }).toDataUri();
    case "flat":
      return createAvatar(micah, { seed, size: 96 }).toDataUri();
    case "neutral":
    default:
      return createAvatar(notionistsNeutral, { seed, size: 64 }).toDataUri();
  }
}

// Keep notionists with color available if we want to switch the hero later.
export function colorfulNotionistFor(seed: string): string {
  return createAvatar(notionists, { seed, size: 128 }).toDataUri();
}

/** Raw SVG markup (not a data URI) for the same avatars — for react-native-svg's
 *  SvgXml. Avoids toDataUri's base64 (`btoa`), which Hermes doesn't provide. */
export function avatarSvgFor(
  seed: string,
  kind: "neutral" | "hero" | "soft" | "flat" = "neutral",
): string {
  switch (kind) {
    case "hero":
      return createAvatar(personas, { seed, size: 128, backgroundColor: ["E5E8EE"], skinColor: ["b16a5b"] }).toString();
    case "soft":
      return createAvatar(loreleiNeutral, { seed, size: 96 }).toString();
    case "flat":
      return createAvatar(micah, { seed, size: 96 }).toString();
    case "neutral":
    default:
      return createAvatar(notionistsNeutral, { seed, size: 64 }).toString();
  }
}
