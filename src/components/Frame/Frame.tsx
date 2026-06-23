import { ReactNode } from "react";
import styles from "./Frame.module.css";
import { PersonaSwitcher } from "@/components/PersonaSwitcher/PersonaSwitcher";
import { ScenarioCaption } from "@/components/ScenarioCaption/ScenarioCaption";
import { DemoReset } from "@/components/forher/DemoReset/DemoReset";

export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.stage}>
      <header className={styles.stageHeader}>
        <div className={styles.headLeft}>
          <div className={styles.brand}>For Her · prototype</div>
          <DemoReset />
        </div>
        <PersonaSwitcher />
      </header>
      <ScenarioCaption />
      <div className={styles.deviceWrap}>
        <div className={styles.device}>
          <div className={styles.notch} aria-hidden />
          <div className={styles.viewport}>{children}</div>
        </div>
      </div>
    </div>
  );
}
