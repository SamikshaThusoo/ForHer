import { CaresHeader } from "@/components/cares/CaresHeader/CaresHeader";

export default function CaresLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100%",
        background:
          "radial-gradient(360px 280px at 50% 6%, #E7F0FA 0%, var(--color-page) 60%)",
      }}
    >
      <CaresHeader />
      {children}
    </div>
  );
}
