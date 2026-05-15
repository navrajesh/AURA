/* global React, Icons, SMS_TEMPLATES, SETTINGS, ACTIVITY, PATIENTS, REPLIES, TRENDS, Sparkline */
const { useState, useMemo } = React;

// ============================================================================
// TEMPLATES
// ============================================================================
function ScreenTemplates() {
  const [active, setActive] = useState(0);
  const [track, setTrack] = useState('60_day');
  const tmpl = SMS_TEMPLATES[active];

  const renderBody = (body) => {
    const parts = body.split(/(\{[^}]+\})/g);
    return parts.map((p, i) =>
      p.startsWith('{') ? <span key={i} className="var">{p}</span> : <span key={i}>{p}</span>
    );
  };

  // Sample preview values
  const preview = (body) => body
    .replace(/\{first_name\}/g, 'Maya')
    .replace(/\{provider_name\}/g, SETTINGS.provider_name)
    .replace(/\{spa_name\}/g, SETTINGS.spa_name)
    .replace(/\{reactivation_offer\}/g, SETTINGS.reactivation_offer)
    .replace(/\{offer_expiry_date\}/g, SETTINGS.offer_expiry_date)
    .replace(/\{booking_link\}/g, SETTINGS.booking_link);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Message templates</h1>
          <div className="page-sub">28-day sequence · variables resolve from Settings + Master Patient List at send time</div>
        </div>
        <div className="page-actions">
          <select className="select" style={{width: 160}} value={track} onChange={e => setTrack(e.target.value)}>
            <option value="60_day">60-day track · warm</option>
            <option value="90_day">90-day track · urgent</option>
            <option value="120_day">120-day track · value</option>
          </select>
          <button className="btn"><Icons.refresh size={14}/> Test send</button>
          <button className="btn btn-primary"><Icons.check size={14}/> Save changes</button>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16}}>
        {/* List */}
        <div className="card">
          <div className="card-header"><div className="card-title">Sequence steps</div></div>
          <div style={{padding: 6}}>
            {SMS_TEMPLATES.map((t, i) => (
              <div key={i} onClick={() => setActive(i)} style={{
                padding: '10px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                background: active === i ? 'var(--panel-2)' : 'transparent',
                border: active === i ? '1px solid var(--border)' : '1px solid transparent',
                marginBottom: 2,
              }}>
                <div style={{display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 10, alignItems: 'center'}}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 6,
                    background: active === i ? 'var(--accent)' : 'var(--panel-2)',
                    color: active === i ? 'white' : 'var(--muted)',
                    display: 'grid', placeItems: 'center',
                    fontWeight: 600,
                    fontSize: 13,
                    border: active === i ? 'none' : '1px solid var(--border)',
                  }}>D{t.day}</div>
                  <div>
                    <div style={{fontWeight: 500, fontSize: 13}}>Message {i+1}</div>
                    <div style={{color: 'var(--muted)', fontSize: 12}}>{t.purpose}</div>
                  </div>
                  <span className="chip">{t.channel === 'sms' ? <Icons.message size={10}/> : <Icons.mail size={10}/>}{t.channel}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{padding: 12, borderTop: '1px solid var(--border)'}}>
            <div style={{fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8}}>Available variables</div>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 4}}>
              {['first_name', 'provider_name', 'spa_name', 'reactivation_offer', 'offer_expiry_date', 'booking_link', 'last_service'].map(v => (
                <span key={v} className="chip" style={{fontFamily: "'Geist Mono', monospace", fontSize: 11}}>{`{${v}}`}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="col">
          <div className="card">
            <div className="card-header">
              <div className="row" style={{gap: 10}}>
                <div className="card-title">Day {tmpl.day} — {tmpl.purpose}</div>
                <span className="chip">{tmpl.channel === 'sms' ? <Icons.message size={10}/> : <Icons.mail size={10}/>}{tmpl.channel.toUpperCase()}</span>
              </div>
              <div className="row">
                <span style={{color: 'var(--muted)', fontSize: 12}}>Last edited 6 days ago by Mira</span>
              </div>
            </div>
            <div className="card-body" style={{padding: 0}}>
              {tmpl.channel === 'email' && (
                <div style={{padding: '14px 18px', borderBottom: '1px solid var(--border)'}}>
                  <div className="field-label" style={{marginBottom: 6}}>Subject line</div>
                  <input className="input" defaultValue={tmpl.subject || ''}/>
                </div>
              )}
              <div style={{padding: '14px 18px'}}>
                <div className="row" style={{justifyContent: 'space-between', marginBottom: 6}}>
                  <div className="field-label">Body</div>
                  <div className="row">
                    <span style={{fontSize: 11, color: 'var(--muted)', fontFamily: "'Geist Mono', monospace"}}>
                      {tmpl.body.length}/160 chars
                    </span>
                    <span className="chip success">{tmpl.channel === 'sms' ? '1 SMS segment' : 'HTML enabled'}</span>
                  </div>
                </div>
                <textarea className="textarea mono" style={{minHeight: 140, fontSize: 13, lineHeight: 1.6}} defaultValue={tmpl.body}></textarea>
              </div>
              <div style={{padding: '12px 18px', borderTop: '1px solid var(--border)', background: 'var(--panel-2)', display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)'}}>
                <div className="row" style={{gap: 6}}><Icons.check size={11}/> STOP keyword always appended</div>
                <div className="row" style={{gap: 6}}><Icons.check size={11}/> 10DLC compliant</div>
                <div className="row" style={{gap: 6}}><Icons.check size={11}/> All variables valid</div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Preview · with sample data</div>
                <span className="chip">{tmpl.channel === 'sms' ? <Icons.phone size={10}/> : <Icons.mail size={10}/>} {tmpl.channel === 'sms' ? '+1 (702) 555-9999' : 'no-reply@aura.app'}</span>
              </div>
              <div className="card-body">
                {tmpl.channel === 'sms' ? (
                  <div style={{maxWidth: 280, margin: '0 auto'}}>
                    <div style={{fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginBottom: 8}}>SMS · Today 10:30 AM</div>
                    <div style={{
                      background: 'var(--panel-2)',
                      padding: '12px 14px',
                      borderRadius: '14px 14px 14px 4px',
                      fontSize: 13,
                      lineHeight: 1.5,
                      border: '1px solid var(--border)'
                    }}>{preview(tmpl.body)}</div>
                  </div>
                ) : (
                  <div style={{border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'white'}}>
                    <div style={{padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, background: 'var(--panel-2)', color: 'var(--text)'}}>
                      <div style={{fontWeight: 600}}>{preview(tmpl.subject || 'Subject')}</div>
                      <div style={{color: 'var(--muted)', marginTop: 2}}>From {SETTINGS.spa_name}</div>
                    </div>
                    <div style={{padding: 18, fontSize: 13, lineHeight: 1.6, color: '#18181B', minHeight: 80, background: 'white'}}>
                      <div style={{fontWeight: 500, marginBottom: 10}}>Hi Maya,</div>
                      <div>{preview(tmpl.body)}</div>
                      <div style={{marginTop: 14}}>
                        <a href="#" style={{display: 'inline-block', padding: '8px 16px', background: '#C75D3C', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 500}}>Book your spot →</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">Performance · last 30 days</div></div>
              <div className="card-body">
                {[
                  ['Sent', '1,247', null],
                  ['Delivered', '1,232', '98.8%'],
                  ['Opened', tmpl.channel === 'email' ? '684' : '—', tmpl.channel === 'email' ? '55.5%' : null],
                  ['Replied', '186', '15.0%'],
                  ['Booking link clicked', '94', '7.5%'],
                ].map(([l, v, p], i, a) => (
                  <div key={i} style={{display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '8px 0', borderBottom: i < a.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13}}>
                    <span style={{color: 'var(--muted)'}}>{l}</span>
                    <span className="mono" style={{fontWeight: 500}}>{v}</span>
                    <span className="mono" style={{color: 'var(--accent)', minWidth: 50, textAlign: 'right'}}>{p || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SETTINGS
// ============================================================================
function ScreenSettings() {
  const [tab, setTab] = useState('client');

  const fields = [
    { key: 'spa_name', label: 'Spa name', desc: 'Used in all SMS, email, and escalation alerts.', value: SETTINGS.spa_name, type: 'text' },
    { key: 'provider_name', label: 'Provider name', desc: 'Personal sender identity. Appears as "from" in SMS.', value: SETTINGS.provider_name, type: 'text' },
    { key: 'booking_link', label: 'Booking link', desc: 'Where converted patients land. Tracked for click events.', value: SETTINGS.booking_link, type: 'url' },
    { key: 'reactivation_offer', label: 'Reactivation offer', desc: 'Inline copy for the headline incentive.', value: SETTINGS.reactivation_offer, type: 'text' },
    { key: 'offer_expiry_date', label: 'Offer expires', desc: 'Used in days 7, 23, and 28 messages for urgency.', value: SETTINGS.offer_expiry_date, type: 'text' },
    { key: 'spa_phone', label: 'Spa phone', desc: 'Front-desk number patients can call back.', value: SETTINGS.spa_phone, type: 'text', mono: true },
  ];

  const schedule = [
    { key: 'business_hours_start', label: 'Business hours start', value: SETTINGS.business_hours_start, mono: true },
    { key: 'business_hours_end', label: 'Business hours end', value: SETTINGS.business_hours_end, mono: true },
    { key: 'send_days', label: 'Send days', value: SETTINGS.send_days },
    { key: 'timezone', label: 'Timezone', value: SETTINGS.timezone, mono: true },
  ];

  const integrations = [
    { key: 'twilio_from_number', label: 'Twilio from number', desc: 'Outbound 10DLC-registered number.', value: SETTINGS.twilio_from_number, mono: true },
    { key: 'mailchimp_list_id', label: 'Mailchimp list ID', desc: 'Audience list for transactional sends.', value: SETTINGS.mailchimp_list_id, mono: true },
  ];

  const escalation = [
    { key: 'escalation_phone', label: 'Escalation phone (SMS)', desc: 'Hot lead alerts SMS to this number within 60 seconds.', value: SETTINGS.escalation_phone, mono: true },
    { key: 'escalation_email', label: 'Escalation email', desc: 'Hot leads, daily digest, and weekly summary.', value: SETTINGS.escalation_email, mono: true },
  ];

  const sections = {
    client: { title: 'Client identity', desc: 'Single source of truth for client-facing copy. Every variable below resolves at send time.', items: fields },
    schedule: { title: 'Send window', desc: 'Make.com checks these before any send fires. Outside-window sends are dropped (not queued).', items: schedule },
    integrations: { title: 'Outbound integrations', desc: 'Twilio handles SMS. Mailchimp handles email.', items: integrations },
    escalation: { title: 'Escalation routing', desc: 'Where the system routes hot leads, opt-outs, and daily/weekly reports.', items: escalation },
  };

  const tabs = [
    { k: 'client', l: 'Client identity', i: 'variable' },
    { k: 'schedule', l: 'Send window', i: 'clock' },
    { k: 'integrations', l: 'Integrations', i: 'link' },
    { k: 'escalation', l: 'Escalation', i: 'flame' },
  ];

  const sec = sections[tab];

  return (
    <div className="page fade-in" style={{maxWidth: 1100}}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-sub">All values flow into Make.com from a single Google Sheets Settings tab. No hardcoded values.</div>
        </div>
        <div className="page-actions">
          <button className="btn"><Icons.external size={14}/> Open Google Sheet</button>
          <button className="btn btn-primary"><Icons.check size={14}/> Save changes</button>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24}}>
        <div>
          {tabs.map(t => {
            const I = Icons[t.i];
            return (
              <div key={t.k} className={`nav-item ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)} style={{marginBottom: 2}}>
                <I className="icon"/>
                {t.l}
              </div>
            );
          })}
          <div style={{padding: 12, marginTop: 16, background: 'var(--panel-2)', borderRadius: 6, border: '1px solid var(--border)'}}>
            <div style={{fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 6, fontWeight: 500}}>Deployment</div>
            <div className="row" style={{gap: 6, marginBottom: 4}}>
              <span className="chip success"><span className="chip-dot"></span>Live</span>
              <span className="mono" style={{fontSize: 11, color: 'var(--muted)'}}>v1.4.2</span>
            </div>
            <div style={{fontSize: 11, color: 'var(--muted)'}}>Updated 2 days ago by Mira K.</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{sec.title}</div>
              <div className="page-sub" style={{marginTop: 2}}>{sec.desc}</div>
            </div>
          </div>
          <div style={{padding: '0 18px'}}>
            {sec.items.map((f, i) => (
              <div key={f.key} className="field-row">
                <div className="field-meta">
                  <div className="field-meta-label">{f.label}</div>
                  <div className="field-meta-desc">{f.desc || ''}</div>
                  <div className="mono" style={{fontSize: 11, color: 'var(--muted-2)', marginTop: 4}}>{`{${f.key}}`}</div>
                </div>
                <div>
                  <input className={`input ${f.mono ? 'mono' : ''}`} defaultValue={f.value}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenTemplates, ScreenSettings });
