// Chart primitives matching the POC's `.chart`/`.bars`/`.donut`/`.progress-ring`
// classes (FitWise_POC_Demo_Package/FitWise_POC_Demo_Enhanced.html). The POC's
// versions are static decoration; these render real data.

export function LineChart({ points, color }: { points: number[]; color: string }) {
  if (points.length === 0) return <div className="muted small">No data yet</div>;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const coords = points
    .map((p, i) => `${(i / Math.max(points.length - 1, 1)) * 500},${150 - ((p - min) / range) * 140 - 5}`)
    .join(" ");
  return (
    <div className="chart">
      <svg viewBox="0 0 500 150" preserveAspectRatio="none">
        <polyline points={coords} fill="none" stroke={color} strokeWidth={4} />
      </svg>
    </div>
  );
}

export function BarChart({ values }: { values: number[] }) {
  if (values.length === 0) return <div className="muted small">No data yet</div>;
  const max = Math.max(...values, 1);
  return (
    <div className="bars">
      {values.map((v, i) => (
        <i key={i} style={{ height: `${Math.max((v / max) * 100, 2)}%` }} />
      ))}
    </div>
  );
}

export function Donut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: { value: number; color: string }[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <div className="muted small">No data yet</div>;
  let acc = 0;
  const stops = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = (acc / total) * 100;
      acc += s.value;
      const end = (acc / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    })
    .join(", ");
  return <div className="donut" style={{ background: `conic-gradient(${stops})` }} data-label={`${centerValue}\n${centerLabel}`} />;
}

export function Ring({ percent, label }: { percent: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="progress-ring"
      style={{ background: `conic-gradient(var(--blue) 0 ${clamped}%, #e3ebf5 ${clamped}% 100%)` }}
      data-label={`${Math.round(clamped)}%\n${label}`}
    />
  );
}
