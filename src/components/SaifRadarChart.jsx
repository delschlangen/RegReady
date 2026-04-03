const LABELS = [
  'Security\nFoundations',
  'Detection &\nResponse',
  'Automated\nDefenses',
  'Platform\nControls',
  'Adaptive\nControls',
  'Business Process\nContextualization',
];

const coverageToScore = (coverage) => {
  if (coverage === 'Fully Addressed') return 100;
  if (coverage === 'Partially Addressed') return 50;
  return 0;
};

export default function SaifRadarChart({ saifMapping, complianceReadiness }) {
  const size = 300;
  const center = size / 2;
  const radius = 110;
  const levels = 4;
  const angleStep = (Math.PI * 2) / 6;
  const startAngle = -Math.PI / 2;

  const scores = saifMapping.map((m) => coverageToScore(m.coverage));

  function getPoint(index, value) {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  }

  // Grid rings
  const rings = Array.from({ length: levels }, (_, i) => {
    const r = ((i + 1) / levels) * radius;
    const points = Array.from({ length: 6 }, (_, j) => {
      const angle = startAngle + j * angleStep;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
    return points;
  });

  // Axis lines
  const axes = Array.from({ length: 6 }, (_, i) => {
    const angle = startAngle + i * angleStep;
    return {
      x2: center + radius * Math.cos(angle),
      y2: center + radius * Math.sin(angle),
    };
  });

  // Data polygon
  const dataPoints = scores.map((s, i) => {
    const pt = getPoint(i, s);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  // Label positions
  const labelPositions = Array.from({ length: 6 }, (_, i) => {
    const angle = startAngle + i * angleStep;
    const lr = radius + 32;
    return {
      x: center + lr * Math.cos(angle),
      y: center + lr * Math.sin(angle),
      lines: LABELS[i].split('\n'),
    };
  });

  const readinessColor = complianceReadiness >= 70 ? '#34a853' : complianceReadiness >= 40 ? '#f9ab00' : '#d93025';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 300" className="w-full max-w-[320px]">
        {/* Grid rings */}
        {rings.map((points, i) => (
          <polygon
            key={`ring-${i}`}
            points={points}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}

        {/* Axis lines */}
        {axes.map((axis, i) => (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={axis.x2}
            y2={axis.y2}
            stroke="#d1d5db"
            strokeWidth="0.5"
          />
        ))}

        {/* Data polygon */}
        <polygon
          points={dataPoints}
          fill="rgba(26, 115, 232, 0.2)"
          stroke="#1a73e8"
          strokeWidth="2"
        />

        {/* Data points */}
        {scores.map((s, i) => {
          const pt = getPoint(i, s);
          const color = s === 100 ? '#34a853' : s === 50 ? '#f9ab00' : '#d93025';
          return (
            <circle
              key={`dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r="4"
              fill={color}
              stroke="white"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels */}
        {labelPositions.map((lp, i) => (
          <text
            key={`label-${i}`}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[7px] fill-gray-500 font-medium"
          >
            {lp.lines.map((line, j) => (
              <tspan key={j} x={lp.x} dy={j === 0 ? 0 : 10}>
                {line}
              </tspan>
            ))}
          </text>
        ))}

        {/* Center score */}
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[22px] font-bold"
          fill={readinessColor}
        >
          {complianceReadiness}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[7px] font-medium fill-gray-400"
        >
          SAIF Coverage
        </text>
      </svg>
    </div>
  );
}
