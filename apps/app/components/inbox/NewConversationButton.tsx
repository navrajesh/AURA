'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { startConversationAction } from '@/lib/actions/start-conversation';
import type { EligiblePatient } from '@/lib/services/conversations';
import { IconPlus, IconX } from '@/components/portal/Icons';

export function NewConversationButton({
  patients,
  disabled,
  disabledReason,
}: {
  patients: EligiblePatient[];
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<EligiblePatient | null>(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? patients.filter((p) => p.name.toLowerCase().includes(q) || p.phone.includes(q))
      : patients;
    return pool.slice(0, 20);
  }, [patients, query]);

  function close() {
    setOpen(false);
    setQuery('');
    setSelected(null);
    setBody('');
    setError(null);
  }

  async function submit() {
    if (!selected || !body.trim() || sending) return;
    setSending(true);
    setError(null);
    const result = await startConversationAction(selected.id, body.trim());
    setSending(false);
    if (result.ok) {
      close();
      router.push(`/inbox?c=${result.conversationId}`);
    } else {
      setError(result.message);
    }
  }

  return (
    <>
      <button
        className="btn btn-primary"
        type="button"
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        onClick={() => setOpen(true)}
      >
        <IconPlus size={14} /> New conversation
      </button>

      {open && (
        <div style={backdrop} onClick={close}>
          <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <div className="card-title">New conversation</div>
              <button className="btn btn-ghost btn-icon" type="button" onClick={close} aria-label="Close">
                <IconX size={14} />
              </button>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!selected ? (
                <>
                  <input
                    className="input"
                    placeholder="Search patients by name or phone…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                  <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {filtered.length === 0 ? (
                      <div style={{ fontSize: 13, color: 'var(--muted)', padding: '12px 4px' }}>
                        No eligible patients found. Patients need a phone number and must not be
                        opted out.
                      </div>
                    ) : (
                      filtered.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="btn"
                          style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                          onClick={() => setSelected(p)}
                        >
                          <div>
                            <div style={{ fontWeight: 500 }}>{p.name}</div>
                            <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                              {p.phone}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--panel-2)',
                      borderRadius: 'var(--radius)',
                      padding: '8px 12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{selected.name}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {selected.phone}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => setSelected(null)}>
                      Change
                    </button>
                  </div>

                  <textarea
                    className="textarea"
                    placeholder="Type your first message…"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    autoFocus
                    style={{ minHeight: 100 }}
                  />

                  {error && (
                    <div className="chip danger" style={{ alignSelf: 'flex-start' }}>
                      <span className="chip-dot" />
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn" type="button" onClick={close}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-accent"
                      type="button"
                      disabled={!body.trim() || sending}
                      onClick={submit}
                    >
                      {sending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
  maxWidth: 480,
  background: 'var(--panel)',
  boxShadow: 'var(--shadow-lg)',
};
