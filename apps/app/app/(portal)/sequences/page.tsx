export default function SequencesPage() {
  const steps = [
    { day: 1, channel: 'sms', label: 'Hi {first_name}, it has been a while — would love to see you back!' },
    { day: 3, channel: 'sms', label: 'Reminder: we have new treatments since your last visit.' },
    { day: 7, channel: 'sms', label: 'Special: 20% off rebooking before {offer_expiry}.' },
    { day: 14, channel: 'sms', label: '{spa_name}: still thinking it over? Book here {booking_link}.' },
    { day: 21, channel: 'sms', label: 'Last call on the 20% offer.' },
    { day: 25, channel: 'sms', label: 'We will pause messages soon — book any time.' },
    { day: 28, channel: 'sms', label: 'Final check-in. Wishing you well!' },
  ];
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-sub">28-day reactivation sequence. Editable in v1.x.</p>
        </div>
        <div className="page-actions">
          <button className="btn" type="button" disabled>
            Preview send
          </button>
          <button className="btn btn-primary" type="button" disabled>
            Edit sequence
          </button>
        </div>
      </div>

      <div className="timeline">
        {steps.map((s, i) => (
          <div className="tl-item" key={s.day}>
            <div className={`tl-dot ${i === 0 ? 'sent' : 'scheduled'}`}>
              <span className="mono" style={{ fontSize: 11 }}>
                {s.day}d
              </span>
            </div>
            <div className={`tl-content ${i === 0 ? '' : 'scheduled'}`}>
              <div className="tl-meta">
                <span className="chip">SMS</span>
                <span>•</span>
                <span>Day {s.day}</span>
              </div>
              <div className="tl-msg">
                {s.label.split(/(\{[^}]+\})/g).map((part, idx) =>
                  part.startsWith('{') ? (
                    <span className="var" key={idx}>
                      {part}
                    </span>
                  ) : (
                    <span key={idx}>{part}</span>
                  ),
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
