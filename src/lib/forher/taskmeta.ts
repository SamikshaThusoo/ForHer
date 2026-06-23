import type { JourneyTask, TaskCategory, TaskTarget, RouteTarget } from "@/types/journey";

// Where a task's "Log ›" action goes. Surfaces that exist get a real route;
// the rest fall back to the mood/cycle log so every task stays actionable.
export const ROUTE_HREF: Partial<Record<RouteTarget, string>> = {
  "food-logger": "/cares/food",
  scanner: "/cares/scan",
  ask: "/cares/ask",
  consult: "/cares/care-team",
  "cycle-log": "/log/mood",
  activity: "/log/move",
  learn: "/learn",
  community: "/community",
};

export const CAT_LABEL: Record<TaskCategory, string> = {
  move: "Move", nourish: "Nourish", track: "Track", sleep: "Sleep",
  mind: "Mind", learn: "Learn", connect: "Connect", clinical: "Clinical",
};

// Display order for grouped task lists.
export const CAT_ORDER: TaskCategory[] = [
  "clinical", "move", "nourish", "track", "sleep", "mind", "learn", "connect",
];

export function fmtTarget(t: TaskTarget): string {
  switch (t.kind) {
    case "steps": return `${t.value.toLocaleString()} steps`;
    case "duration_min": return `${t.value} ${t.unit ?? "min"}`;
    case "count": return `${t.value}${t.unit ? " " + t.unit : ""}`;
    case "sessions_week": return `${t.value}×/week`;
    case "boolean": return "";
  }
}

export function hrefForTask(task: JourneyTask): string | undefined {
  return ROUTE_HREF[task.routeTo];
}
