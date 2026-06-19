import { describe, it, expect } from "vitest";
import { resolveTasksForDay, pickThreeThings } from "./tasks";
import { AANYA, RIYA } from "@/data/pmosPersonas";

describe("resolveTasksForDay", () => {
  it("gives Aanya (high) a richer set than Riya (none) on the same day", () => {
    const aanya = resolveTasksForDay(AANYA, 35);
    const riya = resolveTasksForDay(RIYA, 35);
    expect(aanya.length).toBeGreaterThan(riya.length);
  });

  it("changes Aanya's set across the journey (day 5 vs 95 vs 175)", () => {
    const d5 = resolveTasksForDay(AANYA, 5).map((t) => t.id).sort().join();
    const d95 = resolveTasksForDay(AANYA, 95).map((t) => t.id).sort().join();
    const d175 = resolveTasksForDay(AANYA, 175).map((t) => t.id).sort().join();
    expect(new Set([d5, d95, d175]).size).toBeGreaterThan(1);
  });

  it("includes a clinical task on a touchpoint day (Aanya, day 90 retest)", () => {
    expect(resolveTasksForDay(AANYA, 90).some((t) => t.category === "clinical")).toBe(true);
  });

  it("scales Aanya's high-track steps toward 10k by day 90", () => {
    const early = resolveTasksForDay(AANYA, 5).find((t) => t.id === "steps")!;
    const late = resolveTasksForDay(AANYA, 90).find((t) => t.id === "steps")!;
    expect(late.target.value).toBeGreaterThan(early.target.value);
    expect(late.target.value).toBeLessThanOrEqual(10000);
  });

  it("omits BBT unless TTC", () => {
    expect(resolveTasksForDay(RIYA, 7).some((t) => t.id === "bbt")).toBe(false);
  });
});

describe("pickThreeThings", () => {
  it("returns at most three, clinical first, one per category", () => {
    const picked = pickThreeThings(resolveTasksForDay(AANYA, 90));
    expect(picked.length).toBeLessThanOrEqual(3);
    expect(picked[0].category).toBe("clinical"); // day 90 has a touchpoint
    const cats = picked.map((t) => t.category);
    expect(new Set(cats).size).toBe(cats.length);  // unique categories
  });
});
