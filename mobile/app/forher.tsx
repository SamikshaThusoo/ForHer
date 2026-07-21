import { Redirect } from "expo-router";

// The For Her hub lives inline on the Habit home — nothing links here anymore.
export default function ForHerDashboard() {
  return <Redirect href="/" />;
}
