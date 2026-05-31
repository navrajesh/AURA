import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';

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

const clerkAppearance = {
  variables: {
    colorBackground: '#0D1422',
    colorInputBackground: '#131B2B',
    colorPrimary: '#C9A84C',
    colorText: '#FAF9F5',
    colorTextSecondary: '#AEAAA4',
    colorTextOnPrimaryBackground: '#0D1422',
    colorNeutral: '#AEAAA4',
    colorDanger: '#D9562E',
    colorSuccess: '#38A86B',
    borderRadius: '6px',
    fontFamily: 'var(--font-geist), ui-sans-serif, system-ui, sans-serif',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var t=localStorage.getItem('aura-theme');if(t!=='light'){document.documentElement.dataset.theme='dark'}})()`,
            }}
          />
        </head>
        <body>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
