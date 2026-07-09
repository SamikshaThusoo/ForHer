import { Redirect } from "expo-router";

// PMOS-only: the companion is the PMOS plan (matches the web /cares redirect).
export default function CaresIndex() {
  return <Redirect href="/plan" />;
}
