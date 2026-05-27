/**
 * Hand-rolled lucide-style icon set. Ported from design source so component
 * markup matches 1:1.
 */
import type { SVGProps } from 'react';

type IconProps = {
  size?: number;
  className?: string;
};

const Wrap = ({
  size = 16,
  className,
  children,
  ...rest
}: IconProps & { children: React.ReactNode } & SVGProps<SVGSVGElement>) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...rest}
  >
    {children}
  </svg>
);

export const IconDashboard = (p: IconProps) => (
  <Wrap {...p}>
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </Wrap>
);
export const IconUsers = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Wrap>
);
export const IconInbox = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
  </Wrap>
);
export const IconMessage = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Wrap>
);
export const IconSettings = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2" />
    <circle cx="12" cy="12" r="3" />
  </Wrap>
);
export const IconDatabase = (p: IconProps) => (
  <Wrap {...p}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14a9 3 0 0 0 18 0V5" />
    <path d="M3 12a9 3 0 0 0 18 0" />
  </Wrap>
);
export const IconActivity = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.5.5 0 0 1-.96 0L9.24 2.18a.5.5 0 0 0-.96 0l-2.35 8.36A2 2 0 0 1 4 12H2" />
  </Wrap>
);
export const IconReport = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </Wrap>
);
export const IconSearch = (p: IconProps) => (
  <Wrap {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </Wrap>
);
export const IconBell = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Wrap>
);
export const IconPlus = (p: IconProps) => (
  <Wrap {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Wrap>
);
export const IconChevDown = (p: IconProps) => (
  <Wrap {...p}>
    <polyline points="6 9 12 15 18 9" />
  </Wrap>
);
export const IconChevRight = (p: IconProps) => (
  <Wrap {...p}>
    <polyline points="9 18 15 12 9 6" />
  </Wrap>
);
export const IconFilter = (p: IconProps) => (
  <Wrap {...p}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </Wrap>
);
export const IconDownload = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Wrap>
);
export const IconZap = (p: IconProps) => (
  <Wrap {...p}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Wrap>
);
export const IconCheck = (p: IconProps) => (
  <Wrap {...p}>
    <polyline points="20 6 9 17 4 12" />
  </Wrap>
);
export const IconX = (p: IconProps) => (
  <Wrap {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Wrap>
);
export const IconClock = (p: IconProps) => (
  <Wrap {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Wrap>
);
export const IconSend = (p: IconProps) => (
  <Wrap {...p}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Wrap>
);
export const IconMail = (p: IconProps) => (
  <Wrap {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Wrap>
);
export const IconPhone = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Wrap>
);
export const IconUpload = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </Wrap>
);
export const IconRefresh = (p: IconProps) => (
  <Wrap {...p}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </Wrap>
);
export const IconExternal = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </Wrap>
);
export const IconCalendar = (p: IconProps) => (
  <Wrap {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </Wrap>
);
export const IconSun = (p: IconProps) => (
  <Wrap {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Wrap>
);
export const IconMoon = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </Wrap>
);
