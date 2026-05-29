'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createPatient, updatePatient, type PatientFormData } from '@/app/(portal)/patients/actions';
import { IconX } from '@/components/portal/Icons';
import type { patients } from '@aura/db';

type Patient = typeof patients.$inferSelect;

type Props = {
  mode: 'create' | 'edit';
  patient?: Patient;
  onClose: () => void;
};

const STATUSES = [
  ['new', 'New'],
  ['enrolled', 'Enrolled'],
  ['replied', 'Replied'],
  ['converted', 'Converted'],
  ['opted_out', 'Opted out'],
  ['no_response', 'No response'],
  ['sequence_complete', 'Complete'],
] as const;

const TRACKS = [
  ['', 'None'],
  ['60_day', '60 day'],
  ['90_day', '90 day'],
  ['120_day', '120 day'],
] as const;

function toForm(p?: Patient): PatientFormData {
  return {
    firstName: p?.firstName ?? '',
    lastName: p?.lastName ?? '',
    phone: p?.phone ?? '',
    email: p?.email ?? '',
    lastVisitDate: p?.lastVisitDate ?? '',
    lastService: p?.lastService ?? '',
    sequenceTrack: p?.sequenceTrack ?? '',
    status: p?.status ?? 'new',
    notes: p?.notes ?? '',
  };
}

export function PatientFormModal({ mode, patient, onClose }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<PatientFormData>(toForm(patient));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof PatientFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      if (mode === 'create') {
        await createPatient(form);
      } else {
        await updatePatient(patient!.id, form);
      }
      router.refresh();
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={backdrop} onClick={onClose}>
      <div className="card" style={modal} onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <div className="card-title">
            {mode === 'create' ? 'Add patient' : 'Edit patient'}
          </div>
          <button className="btn btn-ghost btn-icon" type="button" onClick={onClose} aria-label="Close">
            <IconX size={14} />
          </button>
        </div>

        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={grid2}>
            <Field label="First name">
              <input className="input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Jane" />
            </Field>
            <Field label="Last name">
              <input className="input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Smith" />
            </Field>
          </div>

          <div style={grid2}>
            <Field label="Phone">
              <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 555 000 0000" />
            </Field>
            <Field label="Email">
              <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@example.com" />
            </Field>
          </div>

          <div style={grid2}>
            <Field label="Last visit date">
              <input className="input" type="date" value={form.lastVisitDate} onChange={(e) => set('lastVisitDate', e.target.value)} />
            </Field>
            <Field label="Last service">
              <input className="input" value={form.lastService} onChange={(e) => set('lastService', e.target.value)} placeholder="Botox" />
            </Field>
          </div>

          <div style={grid2}>
            <Field label="Sequence track">
              <select className="select" value={form.sequenceTrack} onChange={(e) => set('sequenceTrack', e.target.value)}>
                {TRACKS.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className="select" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUSES.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes">
            <textarea className="textarea" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Internal notes…" />
          </Field>

          {error && (
            <div className="chip danger" style={{ alignSelf: 'flex-start' }}>
              <span className="chip-dot" />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="button" disabled={saving} onClick={submit}>
              {saving ? 'Saving…' : mode === 'create' ? 'Add patient' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
    </div>
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
  maxWidth: 580,
  background: 'var(--panel)',
  boxShadow: 'var(--shadow-lg)',
  maxHeight: '90vh',
  overflowY: 'auto',
};

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
};
