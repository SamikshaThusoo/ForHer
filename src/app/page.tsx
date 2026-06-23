"use client";
import { StatusBar } from "@/components/home/StatusBar/StatusBar";
import { TopBar } from "@/components/home/TopBar/TopBar";
import { Greeting } from "@/components/home/Greeting/Greeting";
import { PromoCard } from "@/components/home/PromoCard/PromoCard";
import { QuickActions } from "@/components/home/QuickActions/QuickActions";
import { WellnessSolutions } from "@/components/home/WellnessSolutions/WellnessSolutions";
import { LeaderboardCard } from "@/components/home/LeaderboardCard/LeaderboardCard";
import { BottomNav } from "@/components/home/BottomNav/BottomNav";
import { ForHerPromo } from "@/components/forher/ForHerPromo/ForHerPromo";

// The Habit Health home — the entry point. For Her is showcased as a card where
// the activity tracker used to sit; tapping it opens the For Her section (/forher).
export default function HabitHome() {
  return (
    <main>
      <StatusBar />
      <TopBar />
      <Greeting />
      <PromoCard />
      <QuickActions />
      <WellnessSolutions />
      <ForHerPromo />
      <LeaderboardCard />
      <BottomNav />
    </main>
  );
}
