export function Sparkline({
  data,
  color = 'currentColor',
  width = 64,
  height = 26,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const last = data[data.length - 1]!;
  const lx = width;
  const ly = height - ((last - min) / range) * height;
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r="2" fill={color} />
    </svg>
  );
}
