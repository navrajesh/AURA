import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AURA Admin',
  description: 'AURA super admin console',
};

const clerkAppearance = {
  variables: {
    colorBackground: '#0D1422',
    colorInputBackground: '#0D1422',
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
  elements: {
    card: {
      backgroundColor: '#131B2B',
      border: '1px solid #253044',
      boxShadow: '0 24px 60px -16px rgba(0,0,0,0.8)',
    },
    formFieldInput: {
      backgroundColor: '#0D1422',
      borderColor: '#253044',
      color: '#FAF9F5',
    },
    formFieldLabel: {
      color: '#D6D2CA',
    },
    socialButtonsBlockButton: {
      backgroundColor: '#1C2637',
      borderColor: '#253044',
      color: '#FAF9F5',
    },
    socialButtonsBlockButtonText: {
      color: '#FAF9F5',
    },
    dividerLine: {
      backgroundColor: '#253044',
    },
    dividerText: {
      color: '#6E6A64',
    },
    headerTitle: {
      color: '#FAF9F5',
    },
    headerSubtitle: {
      color: '#AEAAA4',
    },
    footerActionText: {
      color: '#D6D2CA',
    },
    footerActionLink: {
      color: '#C9A84C',
    },
    identityPreviewText: {
      color: '#FAF9F5',
    },
    identityPreviewEditButton: {
      color: '#C9A84C',
    },
    // UserButton dropdown / UserProfile modal
    modalContent: {
      backgroundColor: '#0D1422',
    },
    navbar: {
      backgroundColor: '#131B2B',
      borderColor: '#253044',
    },
    navbarButton: {
      color: '#D6D2CA',
    },
    navbarButtonText: {
      color: '#D6D2CA',
    },
    navbarButtonIcon: {
      color: '#AEAAA4',
    },
    pageHeader: {
      color: '#FAF9F5',
    },
    pageHeaderText: {
      color: '#FAF9F5',
    },
    pageScrollBox: {
      backgroundColor: '#131B2B',
    },
    profileSectionTitle: {
      borderColor: '#253044',
    },
    profileSectionTitleText: {
      color: '#FAF9F5',
    },
    profileSectionContent: {
      color: '#D6D2CA',
    },
    profileSectionItemValue: {
      color: '#D6D2CA',
    },
    profileSectionPrimaryButton: {
      color: '#C9A84C',
    },
    userPreviewMainIdentifier: {
      color: '#FAF9F5',
    },
    userPreviewSecondaryIdentifier: {
      color: '#AEAAA4',
    },
    badge: {
      backgroundColor: '#1C2637',
      borderColor: '#253044',
      color: '#D6D2CA',
    },
    menuList: {
      backgroundColor: '#131B2B',
      borderColor: '#253044',
    },
    menuItem: {
      color: '#D6D2CA',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
