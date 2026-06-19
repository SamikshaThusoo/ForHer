"use client";
import { useState } from "react";
import { usePersona } from "@/context/PersonaContext";
import { PACKET_SCANS } from "@/data/packetScans";
import { verdictFor } from "@/lib/personalize";
import { ScannerViewport } from "@/components/cares/PacketScanner/ScannerViewport/ScannerViewport";
import { ScanVerdict } from "@/components/cares/PacketScanner/ScanVerdict/ScanVerdict";
import styles from "./scan.module.css";

export default function ScanPage() {
  const { persona } = usePersona();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState<typeof PACKET_SCANS[number] | null>(null);

  function fakeScan() {
    setScanning(true);
    setScanned(null);
    setTimeout(() => {
      const pick = PACKET_SCANS[Math.floor(Math.random() * PACKET_SCANS.length)];
      setScanned(pick);
      setScanning(false);
    }, 1400);
  }

  return (
    <main className={styles.main}>
      <h2 className={styles.title}>Scan a packet</h2>
      <p className={styles.sub}>Verdict in 1 second, anchored to your labs.</p>
      <ScannerViewport scanning={scanning} onScan={fakeScan} />
      {scanned && <ScanVerdict packet={scanned} verdict={verdictFor(scanned, persona)} />}
    </main>
  );
}
