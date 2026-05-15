import { CreateOrganization } from '@clerk/nextjs';

export default function SelectOrgPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: 16,
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 500 }}>Create your med spa workspace</h1>
      <p style={{ color: '#666', fontSize: 13, maxWidth: 360, textAlign: 'center' }}>
        Each workspace gets its own patient list, inbox, and Twilio number.
      </p>
      <CreateOrganization
        afterCreateOrganizationUrl="/dashboard"
        skipInvitationScreen
      />
    </main>
  );
}
