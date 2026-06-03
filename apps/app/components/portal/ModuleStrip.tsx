'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconHeadset, IconLayout, IconLock, IconRefresh, IconSparkle } from './Icons';

type Mod = {
  id: string;
  stage: string;
  name: string;
  tagline: string;
  Icon: (p: { size?: number; className?: string }) => React.JSX.Element;
  active: boolean;
  price: string;
};

const MODULES: Mod[] = [
  {
    id: 'reactivation',
    stage: 'Stage 02',
    name: 'Reactivation Engine',
    tagline: 'Bring lapsed patients back',
    Icon: IconRefresh,
    active: true,
    price: 'Active',
  },
  {
    id: 'frontdesk',
    stage: 'Stage 03',
    name: 'Always-On Front Desk',
    tagline: 'Capture every missed call — 24/7',
    Icon: IconHeadset,
    active: false,
    price: '+ $1,500 setup · $1,000/mo',
  },
  {
    id: 'content',
    stage: 'Stage 04',
    name: 'Content Autopilot',
    tagline: 'On-brand posts, on a schedule',
    Icon: IconSparkle,
    active: false,
    price: '+ $5,000 setup · $1,500/mo',
  },
  {
    id: 'templates',
    stage: 'Stage 01',
    name: 'Website Templates',
    tagline: 'Premium med-spa sites',
    Icon: IconLayout,
    active: false,
    price: 'From $97',
  },
];

export function ModuleStrip() {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToastMsg(null), 2500);
  }

  return (
    <>
      <div className="module-strip">
        <div className="module-strip-label">
          <span>Modules</span>
          <span className="module-strip-count">1 of 4</span>
        </div>
        {MODULES.map((m) =>
          m.active ? (
            <ActiveModule key={m.id} mod={m} />
          ) : (
            <LockedModule
              key={m.id}
              mod={m}
              onAdd={() => showToast(`${m.name} — contact us to add this module.`)}
            />
          ),
        )}
      </div>

      {mounted && toastMsg && createPortal(
        <div className="module-toast" role="status" aria-live="polite">
          {toastMsg}
        </div>,
        document.body,
      )}
    </>
  );
}

function ActiveModule({ mod: m }: { mod: Mod }) {
  return (
    <div className="module-active">
      <div className="module-icon module-icon-active">
        <m.Icon size={14} />
      </div>
      <div className="module-text">
        <span className="module-name">{m.name}</span>
        <span className="module-stage">{m.stage} · Active</span>
      </div>
      <span className="module-dot" />
    </div>
  );
}

function LockedModule({ mod: m, onAdd }: { mod: Mod; onAdd: () => void }) {
  return (
    <button className="module-locked" type="button" onClick={onAdd}>
      <div className="module-icon module-icon-locked">
        <m.Icon size={14} />
        <span className="module-lock-badge">
          <IconLock size={8} />
        </span>
      </div>
      <div className="module-text">
        <span className="module-name module-name-locked">{m.name}</span>
        <span className="module-stage">{m.stage}</span>
      </div>
      <span className="module-add">Add ›</span>
    </button>
  );
}
