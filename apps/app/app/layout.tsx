import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AURA — Patient Reactivation OS',
  description: 'SaaS portal for med spa patient reactivation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var t=localStorage.getItem('aura-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.dataset.theme='dark'}})()`,
            }}
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
