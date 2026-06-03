'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { IconChevDown, IconDownload, IconUpload, IconX } from '@/components/portal/Icons';

type ImportSummary = {
  importId: string;
  totalRows: number;
  imported: number;
  skipped: number;
  errors: { rowIndex: number; reason: string }[];
  unmappedHeaders: string[];
};

export function UploadCsvModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [consented, setConsented] = useState(false);
  const [disclosureOpen, setDisclosureOpen] = useState(false);

  function pickFile(f: File | undefined) {
    setError(null);
    setConsented(false);
    if (!f) return;
    if (!/\.csv$/i.test(f.name) && f.type !== 'text/csv') {
      setError('Pick a .csv file.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File exceeds 5 MB limit.');
      return;
    }
    setFile(f);
  }

  async function submit() {
    if (!file || !consented) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/imports/csv', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? `Upload failed (${res.status})`);
        return;
      }
      setResult(json as ImportSummary);
      router.refresh();
    } catch (err) {
      setError((err as Error).message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function downloadErrorReport() {
    if (!result?.errors.length) return;
    const csv =
      'row,reason\n' +
      result.errors.map((e) => `${e.rowIndex},"${e.reason.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aura-csv-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={backdrop} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <div className="card-title">Upload patient CSV</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <IconX size={14} />
          </button>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!result && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-strong)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '32px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver ? 'var(--accent-soft)' : 'var(--panel-2)',
                  transition: 'border-color 0.1s, background 0.1s',
                }}
              >
                <IconUpload size={28} />
                <div style={{ fontWeight: 500, marginTop: 8 }}>
                  {file ? file.name : 'Drop a CSV here or click to choose'}
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
                  ≤ 5 MB, ~10,000 rows max. Required: phone <em>or</em> email.
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => pickFile(e.target.files?.[0] ?? undefined)}
                />
              </div>

              <a
                href="/patient-import-template.csv"
                download
                style={{
                  fontSize: 12,
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  alignSelf: 'flex-start',
                }}
              >
                <IconDownload size={12} /> Download template CSV
              </a>

              {/* Consent block — only shown after file is selected */}
              {file && (
                <div style={consentBox}>
                  <label style={consentLabel}>
                    <input
                      type="checkbox"
                      checked={consented}
                      onChange={(e) => setConsented(e.target.checked)}
                      style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
                      By uploading this list, I confirm that these contacts have given me
                      permission to contact them, and I agree to AURA Invites'{' '}
                      <a href="#" style={policyLink}>Acceptable Use Policy</a>
                      {' '}and{' '}
                      <a href="#" style={policyLink}>Privacy Policy</a>.
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setDisclosureOpen((o) => !o)}
                    style={disclosureToggle}
                  >
                    <IconChevDown
                      size={11}
                      style={{
                        transform: disclosureOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s',
                      }}
                    />
                    What does this mean?
                  </button>

                  {disclosureOpen && (
                    <div style={disclosurePanel}>
                      <p style={{ fontWeight: 600, fontSize: 12, margin: '0 0 8px', color: 'var(--text)' }}>
                        A note about your contacts
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {DISCLOSURE_ITEMS.map((item, i) => (
                          <li key={i} style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="chip danger" style={{ alignSelf: 'flex-start' }}>
                  <span className="chip-dot" />
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn" type="button" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn btn-accent"
                  type="button"
                  disabled={!file || !consented || uploading}
                  onClick={submit}
                >
                  {uploading ? 'Importing…' : 'Upload'}
                </button>
              </div>
            </>
          )}

          {result && (
            <>
              <div className="chip success" style={{ alignSelf: 'flex-start' }}>
                <span className="chip-dot" />
                Imported {result.imported} • Skipped {result.skipped}
              </div>

              {result.unmappedHeaders.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Ignored columns: {result.unmappedHeaders.join(', ')}
                </div>
              )}

              {result.errors.length > 0 && (
                <details style={{ background: 'var(--panel-2)', padding: 12, borderRadius: 6 }}>
                  <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    {result.errors.length} skipped rows
                  </summary>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--muted)' }}>
                    {result.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>Row {e.rowIndex}: {e.reason}</li>
                    ))}
                    {result.errors.length > 10 && <li>… and {result.errors.length - 10} more</li>}
                  </ul>
                  <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={downloadErrorReport}>
                    <IconDownload size={12} /> Download full error report
                  </button>
                </details>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" type="button" onClick={onClose}>
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const DISCLOSURE_ITEMS = [
  'You have a prior relationship with each contact on this list, or have otherwise obtained their consent to receive event invitations and promotional communications from you and AURA Invites.',
  'Your list was not purchased, rented, or scraped from a third-party source.',
  'Each contact is a US resident aged 18 or older, or you have verified that minors have appropriate parental consent where required.',
  'Contacts on this list may receive event invitations and marketing communications sent jointly by you and AURA Invites. They will always have the ability to unsubscribe at any time.',
  'AURA Invites reserves the right to suspend accounts that upload lists in violation of these terms. For more information, see our Privacy Policy and Acceptable Use Policy.',
];

const backdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(20, 20, 25, 0.4)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 100,
  padding: 24,
};

const modal: React.CSSProperties = {
  width: '100%',
  maxWidth: 540,
  background: 'var(--panel)',
  boxShadow: 'var(--shadow-lg)',
};

const consentBox: React.CSSProperties = {
  background: 'var(--panel-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const consentLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  cursor: 'pointer',
};

const policyLink: React.CSSProperties = {
  color: 'var(--accent)',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

const disclosureToggle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontSize: 12,
  color: 'var(--muted)',
  alignSelf: 'flex-start',
};

const disclosurePanel: React.CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '12px 14px',
};
