'use client';

import { useState } from 'react';

import { UploadCsvModal } from './UploadCsvModal';

export function UploadCsvButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
        Upload CSV
      </button>
      {open && <UploadCsvModal onClose={() => setOpen(false)} />}
    </>
  );
}
