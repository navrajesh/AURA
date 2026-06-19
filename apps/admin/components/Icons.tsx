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

export const IconUsers = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Wrap>
);

export const IconActivity = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.5.5 0 0 1-.96 0L9.24 2.18a.5.5 0 0 0-.96 0l-2.35 8.36A2 2 0 0 1 4 12H2" />
  </Wrap>
);

export const IconTrash = (p: IconProps) => (
  <Wrap {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
