"use client";
import { usePersona } from "@/context/PersonaContext";
import { StatusBar } from "@/components/home/StatusBar/StatusBar";
import { TopBar } from "@/components/home/TopBar/TopBar";
import { Greeting } from "@/components/home/Greeting/Greeting";
import { PromoCard } from "@/components/home/PromoCard/PromoCard";
import { HealthScoreCard } from "@/components/home/HealthScoreCard/HealthScoreCard";
import { QuickActions } from "@/components/home/QuickActions/QuickActions";
import { CareBanner } from "@/components/home/CareBanner/CareBanner";
import { WellnessSolutions } from "@/components/home/WellnessSolutions/WellnessSolutions";
import { StepCounterCard } from "@/components/home/StepCounterCard/StepCounterCard";
import { LeaderboardCard } from "@/components/home/LeaderboardCard/LeaderboardCard";
import { BottomNav } from "@/components/home/BottomNav/BottomNav";
import { ForHerEntryCard } from "@/components/forher/ForHerEntryCard/ForHerEntryCard";

export default function Home() {
  const { persona } = usePersona();
  const enrolled = persona.cares.enrolled;

  return (
    <main>
      <StatusBar />
      <TopBar />
      <Greeting />
      {enrolled ? (
        <>
          {/* STATE B — Cares-enrolled */}
          <HealthScoreCard />
          <ForHerEntryCard />
          <QuickActions />
          <CareBanner />
          <WellnessSolutions />
          <StepCounterCard />
          <LeaderboardCard />
        </>
      ) : (
        <>
          {/* STATE A — not enrolled */}
          <PromoCard />
          <ForHerEntryCard />
          <QuickActions />
          <WellnessSolutions />
          <HealthScoreCard />
          <StepCounterCard />
          <LeaderboardCard />
        </>
      )}
      <BottomNav />
    </main>
  );
}
