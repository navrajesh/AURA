const labels: Record<string, string> = {
  '60_day': '60d',
  '90_day': '90d',
  '120_day': '120d',
};

export function TrackChip({ track }: { track: string | null | undefined }) {
  if (!track) return null;
  return <span className="track-chip">{labels[track] ?? track}</span>;
}
