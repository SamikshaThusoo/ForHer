import { CaresHeader } from "@/components/cares/CaresHeader/CaresHeader";

export default function CaresLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fhTheme"
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #FBF3F5 0%, #F5F0F6 100%)",
      }}
    >
      <CaresHeader />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
