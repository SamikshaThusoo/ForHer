import type { ProgramContent } from "@/types/program";

export const PREDIABETES_REVERSAL: ProgramContent = {
  key: "prediabetes-reversal",
  displayName: "Prediabetes Reversal",
  durationWeeks: 12,
  weeks: Array.from({ length: 12 }, (_, i) => {
    const week = i + 1;
    if (week === 3) {
      return {
        week, theme: "Steady your glucose curve",
        threeThingsToday: [
          { id: "t1", label: "10-min walk after lunch", anchor: "right after you finish eating" },
          { id: "t2", label: "Swap evening biscuit for roasted chana", anchor: "with your 4pm chai" },
          { id: "t3", label: "Sleep by 11:15pm", anchor: "phone away by 11pm" },
        ],
        coachAgenda: "Review last week's logs · plan a glucose-friendly breakfast set · lock the evening snack swap",
      };
    }
    return {
      week, theme: week <= 4 ? "Stabilise" : week <= 8 ? "Reduce" : "Lock-in",
      threeThingsToday: [
        { id: "t1", label: "10-min walk after a meal", anchor: "after your largest meal" },
        { id: "t2", label: "Pick the lower-sodium option", anchor: "at lunch" },
        { id: "t3", label: "Sleep 7 hrs", anchor: "in bed by 11:15pm" },
      ],
      coachAgenda: "Pattern review and next-week reset",
      doctorTouchpoint: week === 6 ? "Partial lab retest (HbA1c, BP, lipid)" : week === 12 ? "Full retest + Smart Reports re-run" : undefined,
    };
  }),
};
