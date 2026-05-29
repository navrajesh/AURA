'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { deletePatients } from '@/app/(portal)/patients/actions';
import { IconPlus, IconTrash, IconX } from '@/components/portal/Icons';
import { StatusChip } from '@/components/portal/StatusChip';
import { TrackChip } from '@/components/portal/TrackChip';
import type { patients } from '@aura/db';

import { PatientFormModal } from './PatientFormModal';

type Patient = typeof patients.$inferSelect;

export function PatientsTable({ rows }: { rows: Patient[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editTarget, setEditTarget] = useState<Patient | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // AddPatientButton (rendered in the server page header) fires this event
  useEffect(() => {
    const handler = () => setShowCreate(true);
    window.addEventListener('aura:add-patient', handler);
    return () => window.removeEventListener('aura:add-patient', handler);
  }, []);

  const allChecked = rows.length > 0 && selected.size === rows.length;
  const someChecked = selected.size > 0 && !allChecked;

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deletePatients(Array.from(selected));
      setSelected(new Set());
      setShowConfirm(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {selected.size > 0 && (
        <div style={actionBar}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {selected.size} patient{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => setSelected(new Set())}
            >
              <IconX size={12} /> Clear
            </button>
            <button
              className="btn btn-sm"
              type="button"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger-soft)' }}
              onClick={() => setShowConfirm(true)}
            >
              <IconTrash size={12} /> Delete {selected.size}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {rows.length === 0 ? (
          <div className="empty">
            <div className="empty-title">No patients yet</div>
            <div>Upload a CSV of lapsed patients or add one manually.</div>
            <button
              className="btn btn-primary"
              type="button"
              style={{ marginTop: 12 }}
              onClick={() => setShowCreate(true)}
            >
              <IconPlus size={14} /> Add patient
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      onChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Last visit</th>
                  <th>Last service</th>
                  <th>Track</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className={selected.has(p.id) ? 'selected' : ''}
                    onClick={() => setEditTarget(p)}
                  >
                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOne(p.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        readOnly
                        aria-label={`Select ${fullName(p)}`}
                      />
                    </td>
                    <td>
                      <div className="cell-stack">
                        <span className="primary">{fullName(p)}</span>
                        {p.email && <span className="secondary">{p.email}</span>}
                      </div>
                    </td>
                    <td className="num">{p.phone ?? <span className="muted">—</span>}</td>
                    <td>{p.lastVisitDate ?? <span className="muted">—</span>}</td>
                    <td>{p.lastService ?? <span className="muted">—</span>}</td>
                    <td>
                      <TrackChip track={p.sequenceTrack} />
                    </td>
                    <td>
                      <StatusChip status={p.status} />
                    </td>
                    <td>
                      <span className="chip" style={{ textTransform: 'capitalize' }}>
                        {p.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editTarget && (
        <PatientFormModal
          mode="edit"
          patient={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      {showCreate && (
        <PatientFormModal mode="create" onClose={() => setShowCreate(false)} />
      )}

      {showConfirm && (
        <div style={backdropStyle} onClick={() => setShowConfirm(false)}>
          <div className="card" style={confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <div className="card-title">Delete patients</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Delete{' '}
                <strong>
                  {selected.size} patient{selected.size !== 1 ? 's' : ''}
                </strong>
                ? This will also remove their conversations and messages. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn" type="button" onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-accent"
                  type="button"
                  disabled={deleting}
                  onClick={confirmDelete}
                  style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  {deleting ? 'Deleting…' : `Delete ${selected.size}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function AddPatientButton() {
  return (
    <button
      className="btn btn-primary"
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('aura:add-patient'))}
    >
      <IconPlus size={14} /> Add patient
    </button>
  );
}

function fullName(p: Patient): string {
  const parts = [p.firstName, p.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unnamed patient';
}

const actionBar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  background: 'var(--accent-soft)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  marginBottom: 8,
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(20, 20, 25, 0.4)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 100,
  padding: 24,
};

const confirmModal: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: 'var(--panel)',
  boxShadow: 'var(--shadow-lg)',
};
