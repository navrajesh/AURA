'use server';

import { and, eq, inArray } from 'drizzle-orm';

import { patients, withTenant } from '@aura/db';

import { getDb } from '@/lib/db';
import { requireCurrentContext } from '@/lib/tenant';

export type PatientFormData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  lastVisitDate: string;
  lastService: string;
  sequenceTrack: string;
  status: string;
  notes: string;
};

export async function createPatient(data: PatientFormData) {
  const ctx = await requireCurrentContext();

  const phone = data.phone.trim() || null;
  const email = data.email.trim() || null;
  if (!phone && !email) {
    throw new Error('Phone or email is required.');
  }

  await withTenant(getDb(), ctx.tenantId, (tx) =>
    tx.insert(patients).values({
      tenantId: ctx.tenantId,
      firstName: data.firstName.trim() || null,
      lastName: data.lastName.trim() || null,
      phone,
      email,
      lastVisitDate: data.lastVisitDate || null,
      lastService: data.lastService.trim() || null,
      sequenceTrack: data.sequenceTrack || null,
      status: data.status || 'new',
      notes: data.notes.trim() || null,
      source: 'manual',
    }),
  );
}

export async function updatePatient(id: string, data: PatientFormData) {
  const ctx = await requireCurrentContext();

  const phone = data.phone.trim() || null;
  const email = data.email.trim() || null;
  if (!phone && !email) {
    throw new Error('Phone or email is required.');
  }

  await withTenant(getDb(), ctx.tenantId, (tx) =>
    tx
      .update(patients)
      .set({
        firstName: data.firstName.trim() || null,
        lastName: data.lastName.trim() || null,
        phone,
        email,
        lastVisitDate: data.lastVisitDate || null,
        lastService: data.lastService.trim() || null,
        sequenceTrack: data.sequenceTrack || null,
        status: data.status || 'new',
        notes: data.notes.trim() || null,
      })
      .where(and(eq(patients.id, id), eq(patients.tenantId, ctx.tenantId))),
  );
}

export async function deletePatients(ids: string[]) {
  if (ids.length === 0) return;
  const ctx = await requireCurrentContext();

  await withTenant(getDb(), ctx.tenantId, (tx) =>
    tx
      .delete(patients)
      .where(and(eq(patients.tenantId, ctx.tenantId), inArray(patients.id, ids))),
  );
}
