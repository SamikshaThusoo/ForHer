import type { ProgramKey } from "./persona";

export interface ProgramWeek {
  week: number;
  theme: string;
  threeThingsToday: { id: string; label: string; anchor: string }[];
  coachAgenda: string;
  doctorTouchpoint?: string;
}

export interface ProgramContent {
  key: ProgramKey;
  displayName: string;
  durationWeeks: 12;
  weeks: ProgramWeek[];
}
