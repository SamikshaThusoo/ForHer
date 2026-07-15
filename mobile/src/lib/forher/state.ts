import { storage } from "@/lib/storage";
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";

// All For Her UI state lives in storage, namespaced per persona so switching
// personas keeps their progress separate. Keys: forher.<id>.{assessed,day,done,schedule}.
const PLAN_LAST_DAY = 90; // 90-day care plan (engine schedule runs longer; UI caps here)

const kAssessed = (id: string) => `forher.${id}.assessed`;
const kDay = (id: string) => `forher.${id}.day`;
const kDone = (id: string) => `forher.${id}.done`;
const kSchedule = (id: string) => `forher.${id}.schedule`;
const kCycle = (id: string) => `forher.${id}.cycle`;

export type CycleIntent = "track" | "ttc" | "pregnant";
export type CycleLog = {
  intent: CycleIntent;
  lastPeriod?: string;    // track + ttc
  duration?: number;      // track + ttc — days of bleeding
  cycleLength?: number;   // track + ttc — typical interval, one period start → the next
  weeksPregnant?: number; // pregnant
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export { PLAN_LAST_DAY };

export function markAssessed(personaId: string) { write(kAssessed(personaId), true); }
export function saveSchedule(personaId: string, schedule: Record<string, string>) {
  write(kSchedule(personaId), schedule);
}
export function saveCycleLog(personaId: string, log: CycleLog) {
  write(kCycle(personaId), log);
}
export function readCycleLog(personaId: string): CycleLog | null {
  return read<CycleLog | null>(kCycle(personaId), null);
}

/** Clears every forher.* key (demo Reset). */
export function resetForHer() {
  try {
    storage.keys().filter((k) => k.startsWith("forher.")).forEach((k) => storage.removeItem(k));
  } catch { /* ignore */ }
}

/** One hook driving the home + plan: hydrated flag, assessed state, the shared
 *  current day, and per-day task completion. */
export function useForHer(personaId: string) {
  const [hydrated, setHydrated] = useState(false);
  const [assessed, setAssessed] = useState(false);
  const [day, setDayState] = useState(1);
  const [done, setDone] = useState<Record<number, string[]>>({});
  const [cycleLog, setCycleLog] = useState<CycleLog | null>(null);

  // Re-read persisted state from storage. Runs on mount/persona change AND whenever
  // the screen regains focus — so e.g. scrubbing the plan day then returning home
  // refreshes the day-driven cards (consult, meals, retest) instead of showing stale.
  const hydrate = useCallback(() => {
    setAssessed(read(kAssessed(personaId), false));
    setDayState(read(kDay(personaId), 1));
    setDone(read(kDone(personaId), {}));
    setCycleLog(read<CycleLog | null>(kCycle(personaId), null));
    setHydrated(true);
  }, [personaId]);

  useEffect(() => { hydrate(); }, [hydrate]);
  useFocusEffect(useCallback(() => { hydrate(); }, [hydrate]));

  const setDay = useCallback((d: number) => {
    const clamped = Math.max(1, Math.min(PLAN_LAST_DAY, Math.round(d)));
    setDayState(clamped);
    write(kDay(personaId), clamped);
  }, [personaId]);

  const isDone = useCallback((taskId: string) => (done[day] ?? []).includes(taskId), [done, day]);

  const toggleDone = useCallback((taskId: string) => {
    setDone((prev) => {
      const forDay = new Set(prev[day] ?? []);
      forDay.has(taskId) ? forDay.delete(taskId) : forDay.add(taskId);
      const next = { ...prev, [day]: [...forDay] };
      write(kDone(personaId), next);
      return next;
    });
  }, [day, personaId]);

  const doneCount = (done[day] ?? []).length;

  // Streak = consecutive days up to `day` that have at least one completed task.
  let streak = 0;
  for (let d = day; d >= 1; d--) {
    if ((done[d] ?? []).length > 0) streak++;
    else break;
  }

  return { hydrated, assessed, day, setDay, isDone, toggleDone, doneCount, streak, done, cycleLog, cycleLogged: !!cycleLog };
}
