import { redirect } from "next/navigation";

// The standalone For Her dashboard is retired — the live carousel now lives on the
// Habit home (the For Her card). Anything still pointing here goes home.
export default function ForHerRedirect() {
  redirect("/");
}
