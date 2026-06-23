"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePersona } from "@/context/PersonaContext";
import { personaTrack } from "@/lib/journey";
import { Home, Activity, Moon, BookOpen, Users } from "lucide-react";
import styles from "./BottomNav.module.css";

const TABS = [
  { href: "/forher", label: "Home", icon: Home, carePlanOnly: false },
  { href: "/plan", label: "Plan", icon: Activity, carePlanOnly: true },
  { href: "/log/mood", label: "Track", icon: Moon, carePlanOnly: false },
  { href: "/learn", label: "Learn", icon: BookOpen, carePlanOnly: false },
  { href: "/cares/care-team", label: "Care", icon: Users, carePlanOnly: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const { persona } = usePersona();
  const carePlan = personaTrack(persona) !== "none";
  const tabs = TABS.filter((t) => !t.carePlanOnly || carePlan);

  return (
    <nav className={styles.nav}>
      {tabs.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href} className={`${styles.tab} ${active ? styles.active : ""}`}>
            <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
