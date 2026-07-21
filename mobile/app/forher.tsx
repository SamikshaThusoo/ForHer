import { Screen } from "@/components/ui/Screen";
import { Header } from "@/components/ui/Header";
import { ForHerPromo } from "@/components/home/ForHerPromo";

// The For Her dashboard — the full hub (carousel, meal plan, clinic entry) that
// used to live inline on the Habit home, now behind the home-page banner.
export default function ForHerDashboard() {
  return (
    <Screen>
      <Header title="For Her" />
      <ForHerPromo />
    </Screen>
  );
}
