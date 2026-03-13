interface GaugeChartProps {
  value: number; // 0-100
  size?: number;
}

export default function GaugeChart({ value, size = 200 }: GaugeChartProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const cx = size / 2;
  const cy = size * 0.52;
  const r = size * 0.36;
  const trackWidth = size * 0.06;
  const valueWidth = size * 0.08;

  const startAngle = 210;
  const endAngle = -30;
  const sweepAngle = startAngle - endAngle; // 240°
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

  // Gradient ID
  const gradId = `gauge-grad-${size}`;

  // Needle
  const needleLen = r - valueWidth * 0.2;
  const needleTip = polarToCartesian(valueAngle, needleLen);
  const baseR = size * 0.022;
  const nb1Angle = valueAngle + 90;
  const nb2Angle = valueAngle - 90;
  const nb1 = {
    x: cx + baseR * Math.cos((nb1Angle * Math.PI) / 180),
    y: cy - baseR * Math.sin((nb1Angle * Math.PI) / 180),
  };
  const nb2 = {
    x: cx + baseR * Math.cos((nb2Angle * Math.PI) / 180),
    y: cy - baseR * Math.sin((nb2Angle * Math.PI) / 180),
  };

  // Tick marks (small lines on the arc)
  const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const majorTicks = [0, 25, 50, 75, 100];

  return (
    <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(0, 45%, 55%)" />
          <stop offset="35%" stopColor="hsl(35, 55%, 50%)" />
          <stop offset="65%" stopColor="hsl(200, 35%, 45%)" />
          <stop offset="100%" stopColor="hsl(150, 40%, 40%)" />
        </linearGradient>
        <filter id="gauge-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
        </filter>
        <filter id="needle-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Background track */}
      <path
        d={arcPath(startAngle, endAngle)}
        fill="none"
        stroke="hsl(225, 12%, 92%)"
        strokeWidth={trackWidth}
        strokeLinecap="round"
      />

      {/* Colored value arc with gradient */}
      {clampedValue > 0.5 && (
        <path
          d={arcPath(startAngle, valueAngle)}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={valueWidth}
          strokeLinecap="round"
          filter="url(#gauge-shadow)"
        />
      )}

      {/* Tick marks */}
      {ticks.map((tick) => {
        const angle = startAngle - (tick / 100) * sweepAngle;
        const isMajor = majorTicks.includes(tick);
        const innerR = r - (isMajor ? trackWidth * 1.1 : trackWidth * 0.7);
        const outerR = r + (isMajor ? trackWidth * 0.6 : trackWidth * 0.3);
        const p1 = polarToCartesian(angle, innerR);
        const p2 = polarToCartesian(angle, outerR);
        return (
          <line
            key={tick}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={isMajor ? "hsl(225, 20%, 55%)" : "hsl(225, 12%, 82%)"}
            strokeWidth={isMajor ? 1.5 : 0.8}
            strokeLinecap="round"
          />
        );
      })}

      {/* Major tick labels */}
      {majorTicks.map((tick) => {
        const angle = startAngle - (tick / 100) * sweepAngle;
        const labelR = r + trackWidth * 0.6 + size * 0.06;
        const pos = polarToCartesian(angle, labelR);
        return (
          <text
            key={tick}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize={size * 0.058}
            fontWeight={tick === 0 || tick === 100 ? 600 : 400}
          >
            {tick}
          </text>
        );
      })}

      {/* Needle */}
      <g filter="url(#needle-shadow)">
        <polygon
          points={`${needleTip.x},${needleTip.y} ${nb1.x},${nb1.y} ${nb2.x},${nb2.y}`}
          fill="hsl(225, 30%, 22%)"
        />
      </g>

      {/* Center cap */}
      <circle cx={cx} cy={cy} r={size * 0.035} fill="hsl(225, 28%, 20%)" />
      <circle cx={cx} cy={cy} r={size * 0.018} fill="hsl(225, 15%, 40%)" />
    </svg>
  );
}
