import { useMemo } from "react";

interface GaugeChartProps {
  value: number; // 0-100
  size?: number;
}

export default function GaugeChart({ value, size = 180 }: GaugeChartProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const cx = size / 2;
  const cy = size * 0.5;
  const r = size * 0.34;
  const trackWidth = size * 0.045;

  const startAngle = 220;
  const endAngle = -40;
  const sweepAngle = startAngle - endAngle; // 260°
  const valueAngle = startAngle - (clampedValue / 100) * sweepAngle;

  const polarToCartesian = (angle: number, radius: number = r) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };

  const arcPath = (from: number, to: number, radius: number = r) => {
    const start = polarToCartesian(from, radius);
    const end = polarToCartesian(to, radius);
    const sweep = from - to;
    const largeArc = sweep > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  const uid = useMemo(() => Math.random().toString(36).substring(2, 8), []);
  const gradId = `gauge-g-${uid}`;

  // Segment colors — red → amber → blue → green
  const segments = [
    { from: 0, to: 25, color: "hsl(5, 50%, 52%)" },
    { from: 25, to: 50, color: "hsl(38, 55%, 50%)" },
    { from: 50, to: 75, color: "hsl(210, 35%, 48%)" },
    { from: 75, to: 100, color: "hsl(155, 40%, 40%)" },
  ];

  // Needle geometry — tapered
  const needleLen = r * 0.88;
  const needleTailLen = r * 0.18;
  const tipWidth = size * 0.008;
  const baseWidth = size * 0.028;
  const nRad = (valueAngle * Math.PI) / 180;
  const perpRad = nRad + Math.PI / 2;

  const tip = { x: cx + needleLen * Math.cos(nRad), y: cy - needleLen * Math.sin(nRad) };
  const tail = { x: cx - needleTailLen * Math.cos(nRad), y: cy + needleTailLen * Math.sin(nRad) };
  const tipL = { x: tip.x + tipWidth * Math.cos(perpRad), y: tip.y - tipWidth * Math.sin(perpRad) };
  const tipR = { x: tip.x - tipWidth * Math.cos(perpRad), y: tip.y + tipWidth * Math.sin(perpRad) };
  const baseL = { x: cx + baseWidth * Math.cos(perpRad), y: cy - baseWidth * Math.sin(perpRad) };
  const baseR2 = { x: cx - baseWidth * Math.cos(perpRad), y: cy + baseWidth * Math.sin(perpRad) };

  const majorTicks = [0, 25, 50, 75, 100];
  const minorTicks = [10, 20, 30, 40, 60, 70, 80, 90];

  return (
    <svg
      width={size}
      height={size * 0.58}
      viewBox={`0 0 ${size} ${size * 0.58}`}
    >
      <defs>
        <filter id={`ns-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="1" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Track segments (colored background) */}
      {segments.map((seg, i) => {
        const fromA = startAngle - (seg.from / 100) * sweepAngle;
        const toA = startAngle - (seg.to / 100) * sweepAngle;
        return (
          <path
            key={i}
            d={arcPath(fromA, toA)}
            fill="none"
            stroke={seg.color}
            strokeWidth={trackWidth}
            opacity={0.18}
            strokeLinecap={i === 0 || i === segments.length - 1 ? "round" : "butt"}
          />
        );
      })}

      {/* Active value arc */}
      {clampedValue > 0.5 && (
        <>
          {segments.map((seg, i) => {
            const segStart = startAngle - (seg.from / 100) * sweepAngle;
            const segEnd = startAngle - (seg.to / 100) * sweepAngle;
            // Clamp to the filled portion
            if (valueAngle >= segStart) return null; // value hasn't reached this segment
            const fromA = segStart;
            const toA = Math.max(valueAngle, segEnd);
            if (fromA <= toA) return null;
            return (
              <path
                key={`active-${i}`}
                d={arcPath(fromA, toA)}
                fill="none"
                stroke={seg.color}
                strokeWidth={trackWidth * 1.4}
                strokeLinecap={
                  (i === 0 && fromA === segStart) || toA === valueAngle
                    ? "round"
                    : "butt"
                }
              />
            );
          })}
        </>
      )}

      {/* Minor ticks */}
      {minorTicks.map((tick) => {
        const angle = startAngle - (tick / 100) * sweepAngle;
        const p1 = polarToCartesian(angle, r + trackWidth * 0.9);
        const p2 = polarToCartesian(angle, r + trackWidth * 0.9 + size * 0.018);
        return (
          <line
            key={tick}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke="hsl(225, 10%, 78%)"
            strokeWidth={0.8}
            strokeLinecap="round"
          />
        );
      })}

      {/* Major ticks + labels */}
      {majorTicks.map((tick) => {
        const angle = startAngle - (tick / 100) * sweepAngle;
        const p1 = polarToCartesian(angle, r + trackWidth * 0.9);
        const p2 = polarToCartesian(angle, r + trackWidth * 0.9 + size * 0.03);
        const labelPos = polarToCartesian(angle, r + trackWidth + size * 0.065);
        return (
          <g key={tick}>
            <line
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="hsl(225, 15%, 55%)"
              strokeWidth={1.2}
              strokeLinecap="round"
            />
            <text
              x={labelPos.x}
              y={labelPos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground"
              fontSize={size * 0.056}
              fontWeight={500}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {tick}
            </text>
          </g>
        );
      })}

      {/* Needle */}
      <g filter={`url(#ns-${uid})`}>
        <path
          d={`M ${tipL.x},${tipL.y} L ${baseL.x},${baseL.y} L ${tail.x},${tail.y} L ${baseR2.x},${baseR2.y} L ${tipR.x},${tipR.y} Z`}
          fill="hsl(225, 30%, 20%)"
        />
      </g>

      {/* Center hub */}
      <circle cx={cx} cy={cy} r={size * 0.04} fill="hsl(225, 25%, 25%)" />
      <circle cx={cx} cy={cy} r={size * 0.022} fill="hsl(225, 20%, 40%)" />
      <circle cx={cx} cy={cy} r={size * 0.008} fill="hsl(225, 15%, 60%)" />
    </svg>
  );
}
