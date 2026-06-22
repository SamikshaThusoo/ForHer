import { redirect } from "next/navigation";

// PMOS-only: the companion is the PMOS plan. The old prediabetes dashboard is gone.
// (The /cares/* logging surfaces — food, scan, ask, care-team — remain.)
export default function CaresIndex() {
  redirect("/plan");
}
