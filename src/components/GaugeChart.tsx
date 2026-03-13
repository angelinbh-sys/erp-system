interface GaugeChartProps {
  value: number; // 0-100
  size?: number;
}

export default function GaugeChart({ value, size = 200 }: GaugeChartProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size * 0.38;
  const strokeWidth = size * 0.09;

  // Arc from 180° (left) to 0° (right) — semicircle
  const startAngle = 180;
  const endAngle = 0;
  const sweepAngle = startAngle - endAngle; // 180
  const valueAngle = startAngle - (clampedValue / 100) * sweepAngle;

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  };

  const arcPath = (from: number, to: number) => {
    const start = polarToCartesian(from);
    const end = polarToCartesian(to);
    const largeArc = from - to > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  // Needle
  const needleAngle = valueAngle;
  const needleLen = r - strokeWidth * 0.3;
  const needleTip = polarToCartesian(needleAngle);
  const needleBase1Angle = needleAngle + 90;
  const needleBase2Angle = needleAngle - 90;
  const baseR = 4;
  const nb1 = { x: cx + baseR * Math.cos((needleBase1Angle * Math.PI) / 180), y: cy - baseR * Math.sin((needleBase1Angle * Math.PI) / 180) };
  const nb2 = { x: cx + baseR * Math.cos((needleBase2Angle * Math.PI) / 180), y: cy - baseR * Math.sin((needleBase2Angle * Math.PI) / 180) };

  // Color based on value
  const getColor = () => {
    if (clampedValue < 30) return "hsl(0, 50%, 50%)";
    if (clampedValue < 60) return "hsl(35, 60%, 50%)";
    if (clampedValue < 85) return "hsl(200, 40%, 45%)";
    return "hsl(145, 45%, 42%)";
  };

  const needleTipScaled = {
    x: cx + needleLen * Math.cos((needleAngle * Math.PI) / 180),
    y: cy - needleLen * Math.sin((needleAngle * Math.PI) / 180),
  };

  return (
    <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
      {/* Background arc */}
      <path
        d={arcPath(startAngle, endAngle)}
        fill="none"
        stroke="hsl(225, 15%, 90%)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Value arc */}
      {clampedValue > 0 && (
        <path
          d={arcPath(startAngle, valueAngle)}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}
      {/* Needle */}
      <polygon
        points={`${needleTipScaled.x},${needleTipScaled.y} ${nb1.x},${nb1.y} ${nb2.x},${nb2.y}`}
        fill="hsl(225, 25%, 18%)"
      />
      <circle cx={cx} cy={cy} r={5} fill="hsl(225, 25%, 18%)" />
      {/* Tick labels */}
      {[0, 25, 50, 75, 100].map((tick) => {
        const angle = startAngle - (tick / 100) * sweepAngle;
        const labelR = r + strokeWidth * 0.8 + 10;
        const pos = { x: cx + labelR * Math.cos((angle * Math.PI) / 180), y: cy - labelR * Math.sin((angle * Math.PI) / 180) };
        return (
          <text
            key={tick}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize={size * 0.055}
          >
            {tick}%
          </text>
        );
      })}
    </svg>
  );
}
