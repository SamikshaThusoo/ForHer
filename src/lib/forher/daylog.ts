// Per-day tracker log: flow (feeds the period/cycle data prediction reads) and
// symptoms (structured IDs the PCOS pattern detection queries). Stored under the
// same key the tracker has always used — legacy string[] period logs migrate on
// read, so data written before this change still loads.

export type Flow = "light" | "medium" | "heavy" | "spotting";

/** One day's log. `period`/`flow` are the cycle role; `symptoms` are their own
 *  role (loggable on any day, period or not). */
export type DayEntry = {
  period?: boolean;
  flow?: Flow;
  symptoms?: string[];
};

export type DayLog = Record<string, DayEntry>; // keyed by YYYY-MM-DD

const key = (id: string) => `forher.${id}.loggedperiods`;

export const FLOWS: { id: Flow; label: string }[] = [
  { id: "light", label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "heavy", label: "Heavy" },
  { id: "spotting", label: "Spotting" },
];

/** Structured symptom taxonomy. IDs are stable — pattern detection reads them
 *  directly (e.g. "acne", "hair_loss"). On/off only; no severity here. */
export const SYMPTOM_GROUPS: { group: string; items: { id: string; label: string }[] }[] = [
  { group: "Pain", items: [
    { id: "cramps", label: "Abdominal cramps" },
    { id: "lower_back_pain", label: "Lower back pain" },
    { id: "pelvic_pain", label: "Pelvic pain" },
    { id: "breast_pain", label: "Breast pain" },
    { id: "headache", label: "Headache" },
  ] },
  { group: "Digestion & appetite", items: [
    { id: "bloating", label: "Bloating" },
    { id: "nausea", label: "Nausea" },
    { id: "constipation", label: "Constipation" },
    { id: "diarrhoea", label: "Diarrhoea" },
    { id: "appetite_changes", label: "Appetite changes" },
  ] },
  { group: "Mood, energy & sleep", items: [
    { id: "mood_changes", label: "Mood changes" },
    { id: "fatigue", label: "Fatigue" },
    { id: "sleep_changes", label: "Sleep changes" },
  ] },
  { group: "Skin & hair", items: [
    { id: "acne", label: "Acne" },
    { id: "hair_loss", label: "Hair loss" },
  ] },
  { group: "Body & temperature", items: [
    { id: "hot_flushes", label: "Hot flushes" },
    { id: "night_sweats", label: "Night sweats" },
    { id: "chills", label: "Chills" },
    { id: "bladder_incontinence", label: "Bladder incontinence" },
  ] },
];

/** Normalise whatever is in storage into the current DayLog shape. Legacy value
 *  was a string[] of period-day ISO dates → each becomes { period: true }. */
export function migrateDayLog(raw: unknown): DayLog {
  if (Array.isArray(raw)) {
    const out: DayLog = {};
    for (const iso of raw) if (typeof iso === "string") out[iso] = { period: true };
    return out;
  }
  if (raw && typeof raw === "object") return raw as DayLog;
  return {};
}

/** The set of dates marked as a period day — the input to the cycle math. */
export function periodDaysSet(log: DayLog): Set<string> {
  return new Set(Object.keys(log).filter((iso) => log[iso]?.period));
}

/** A day with nothing worth persisting (used to prune the map on save). */
export function isEmptyEntry(entry: DayEntry): boolean {
  return !entry.period && !entry.flow && (entry.symptoms?.length ?? 0) === 0;
}

export function readDayLog(id: string): DayLog {
  try {
    return migrateDayLog(JSON.parse(localStorage.getItem(key(id)) ?? "null"));
  } catch {
    return {};
  }
}

export function writeDayLog(id: string, log: DayLog) {
  try {
    localStorage.setItem(key(id), JSON.stringify(log));
  } catch {
    /* ignore */
  }
}
