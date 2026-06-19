import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import { PersonaProvider } from "@/context/PersonaContext";
import { Frame } from "@/components/Frame/Frame";
import "./globals.css";

// Primary product font — replaces Geist + Instrument Serif from v3.
// Exposed as both --font-sans (new) and --font-geist / --font-display
// (legacy aliases handled in globals.css :root).
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

// Heavy serif used ONLY for the Habit Health wordmark lockup.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
  variable: "--font-serif-logo",
});

export const metadata: Metadata = {
  title: "Habit Cares",
  description: "Hyper-personalised digital care for Habit Health Smart Reports users",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable}`}>
      <body>
        <PersonaProvider>
          <Frame>{children}</Frame>
        </PersonaProvider>
      </body>
    </html>
  );
}
