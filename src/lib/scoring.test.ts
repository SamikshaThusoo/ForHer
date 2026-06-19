import { describe, it, expect } from "vitest";
import { bandFor, labelFor, colorVarFor } from "./scoring";

describe("bandFor", () => {
  it("returns poor below 300", () => {
    expect(bandFor(0)).toBe("poor");
    expect(bandFor(299)).toBe("poor");
  });
  it("returns fair 300–599", () => {
    expect(bandFor(300)).toBe("fair");
    expect(bandFor(599)).toBe("fair");
  });
  it("returns warm 600–749", () => {
    expect(bandFor(600)).toBe("warm");
    expect(bandFor(749)).toBe("warm");
  });
  it("returns good 750+", () => {
    expect(bandFor(750)).toBe("good");
    expect(bandFor(1000)).toBe("good");
  });
});

describe("labelFor", () => {
  it("maps bands to user-facing labels", () => {
    expect(labelFor(280)).toBe("Poor");
    expect(labelFor(550)).toBe("Fair");
    expect(labelFor(720)).toBe("Good");
    expect(labelFor(800)).toBe("Excellent");
  });
});

describe("colorVarFor", () => {
  it("returns the CSS var name for the band", () => {
    expect(colorVarFor(720)).toBe("--color-score-warm");
    expect(colorVarFor(800)).toBe("--color-score-good");
  });
});
