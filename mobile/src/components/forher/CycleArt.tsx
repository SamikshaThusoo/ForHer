import Svg, { Defs, LinearGradient, Stop, Path, Ellipse, Circle, G } from "react-native-svg";

/* For Her cycle iconography — a soft five-petal florette (fertile/ovulation) and a
   teardrop blood drop (period days). RN port of the web CycleArt SVGs. */

const PETALS = [0, 72, 144, 216, 288];

export function Florette({ size = 22, color = "#4F9D69", bright = false }: { size?: number; color?: string; bright?: boolean }) {
  const eye = bright ? 3.5 : 3.0;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G>
        {PETALS.map((a) => (
          <Ellipse key={a} cx={12} cy={6.6} rx={3.1} ry={5.3} fill={color} opacity={bright ? 1 : 0.9} rotation={a} originX={12} originY={12} />
        ))}
        <Circle cx={12} cy={12} r={eye} fill="#fff" opacity={0.94} />
        <Circle cx={12} cy={12} r={eye - 1.5} fill={color} />
      </G>
    </Svg>
  );
}

export function BloodDrop({ size = 16, color = "#C76B7A", deep = "#9E3B50", fill = true }: { size?: number; color?: string; deep?: string; fill?: boolean }) {
  const gid = `fhDrop-${color.replace("#", "")}-${deep.replace("#", "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor={deep} />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 3.4 C12 3.4 6 11 6 14.8 A6 6 0 1 0 18 14.8 C18 11 12 3.4 12 3.4 Z"
        fill={fill ? `url(#${gid})` : "none"}
        stroke={fill ? "none" : color}
        strokeWidth={fill ? 0 : 1.7}
      />
      {fill && <Ellipse cx={9.8} cy={14.8} rx={1.6} ry={2.4} fill="#fff" opacity={0.34} />}
    </Svg>
  );
}
