import { NextResponse } from 'next/server';

import { ImportError, importCsvForTenant } from '@/lib/services/csv-imports';
import { requireCurrentContext } from '@/lib/tenant';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireCurrentContext();
  } catch {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${file.size} bytes; max ${MAX_BYTES})` },
      { status: 413 },
    );
  }

  const csvText = await file.text();

  try {
    const summary = await importCsvForTenant({
      tenantId: ctx.tenantId,
      clerkUserId: ctx.userId,
      filename: file.name || 'upload.csv',
      csvText,
      csvBytes: file.size,
    });
    return NextResponse.json(summary, { status: 200 });
  } catch (err) {
    if (err instanceof ImportError) {
      return NextResponse.json({ error: err.message, details: err.details }, { status: err.status });
    }
    console.error('[csv-import] unexpected error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
