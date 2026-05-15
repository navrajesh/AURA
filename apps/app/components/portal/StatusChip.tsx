type Status =
  | 'new'
  | 'enrolled'
  | 'replied'
  | 'converted'
  | 'opted_out'
  | 'no_response'
  | 'sequence_complete';

const map: Record<Status, { label: string; cls: string }> = {
  new: { label: 'New', cls: '' },
  enrolled: { label: 'Enrolled', cls: 'info' },
  replied: { label: 'Replied', cls: 'accent' },
  converted: { label: 'Converted', cls: 'success' },
  opted_out: { label: 'Opted out', cls: 'danger' },
  no_response: { label: 'No response', cls: '' },
  sequence_complete: { label: 'Complete', cls: '' },
};

export function StatusChip({ status }: { status: string }) {
  const s = map[status as Status] ?? { label: status, cls: '' };
  return (
    <span className={`chip ${s.cls}`}>
      <span className="chip-dot" />
      {s.label}
    </span>
  );
}
