/* global React, Icons, StatusChip, TrackChip, SeqProgress, PATIENTS, REPLIES, SMS_TEMPLATES, ACTIVITY, SETTINGS */
const { useState, useMemo } = React;

// ============================================================================
// PATIENT DETAIL
// ============================================================================
function ScreenPatientDetail({ patientId, go, openPatient }) {
  const p = PATIENTS.find(x => x.id === patientId) || PATIENTS[0];
  const reply = REPLIES.find(r => r.patientId === p.id);

  const days = [1, 3, 7, 12, 18, 23, 28];
  const stepStatus = (d) => {
    if (p.opted_out && d > p.last_message_number) return 'opted_out';
    if (p.replied && d > p.last_message_number) return 'paused';
    if (d <= p.last_message_number) return d === p.last_message_number ? 'current' : 'sent';
    if (d <= p.enrolled_days) return 'overdue';
    return 'scheduled';
  };

  return (
    <div className="page fade-in" style={{maxWidth: 1280}}>
      <div className="row" style={{marginBottom: 14, color: 'var(--muted)', fontSize: 12}}>
        <button className="btn btn-sm btn-ghost" onClick={() => go('patients')}>
          <Icons.chevRight size={12} style={{transform: 'rotate(180deg)'}}/> Back to patients
        </button>
      </div>

      <div className="page-header" style={{alignItems: 'center'}}>
        <div className="row" style={{gap: 14}}>
          <div className="avatar" style={{width: 48, height: 48, fontSize: 16, background: 'var(--accent-soft)', color: 'var(--accent-strong)'}}>
            {p.first_name[0]}{p.last_name[0]}
          </div>
          <div>
            <div className="row" style={{gap: 10}}>
              <h1 className="page-title" style={{margin: 0}}>{p.first_name} {p.last_name}</h1>
              <StatusChip status={p.status}/>
              <TrackChip track={p.sequence_track}/>
            </div>
            <div className="page-sub mono" style={{marginTop: 4}}>
              {p.id} · {p.phone} · {p.email}
            </div>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn"><Icons.message size={14}/> Send manual SMS</button>
          <button className="btn"><Icons.pause size={14}/> Pause sequence</button>
          <button className="btn btn-accent"><Icons.check size={14}/> Mark converted</button>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16}}>
        {/* LEFT: Sequence timeline */}
        <div>
          <div className="card" style={{marginBottom: 12}}>
            <div className="card-header">
              <div>
                <div className="card-title">28-day sequence</div>
                <div className="page-sub" style={{marginTop: 2}}>
                  Day {p.enrolled_days} of 28 · enrolled {p.enrollment_date} · track {p.sequence_track.replace('_', ' ')}
                </div>
              </div>
              <div className="row">
                <SeqProgress current={p.last_message_number}/>
                <span className="mono" style={{fontSize: 12, color: 'var(--muted)'}}>{p.last_message_number}/7</span>
              </div>
            </div>
            <div className="card-body">
              <div className="timeline">
                {days.map((d, i) => {
                  const st = stepStatus(d);
                  const tmpl = SMS_TEMPLATES.find(t => t.day === d);
                  const isSent = st === 'sent' || st === 'current';
                  const isReply = st === 'current' && p.replied;

                  let dotCls = 'scheduled', dotIcon = <Icons.clock size={14}/>;
                  if (isSent) { dotCls = 'sent'; dotIcon = <Icons.check size={14} sw={2.4}/>; }
                  if (isReply) { dotCls = 'replied'; dotIcon = <Icons.message size={14} sw={2.4}/>; }
                  if (st === 'opted_out') { dotCls = 'scheduled'; dotIcon = <Icons.block size={14}/>; }

                  const body = tmpl?.body || '';
                  // highlight {variables}
                  const parts = body.split(/(\{[^}]+\})/g);

                  return (
                    <div key={d} className="tl-item">
                      <div className={`tl-dot ${dotCls}`}>{dotIcon}</div>
                      <div className={`tl-content ${st === 'scheduled' ? 'scheduled' : ''}`}>
                        <div className="tl-meta">
                          <span style={{fontWeight: 600, color: 'var(--text)', fontSize: 13}}>Day {d} · Message {i+1}</span>
                          <span className="chip">{tmpl.channel === 'sms' ? <Icons.message size={10}/> : <Icons.mail size={10}/>} {tmpl.channel.toUpperCase()}</span>
                          <span>·</span>
                          <span>{tmpl.purpose}</span>
                          <span style={{marginLeft: 'auto'}} className="mono">
                            {isSent && `delivered ${d}d ago`}
                            {st === 'scheduled' && `scheduled ${d - p.enrolled_days}d`}
                            {st === 'opted_out' && 'halted — opted out'}
                            {st === 'paused' && 'paused — replied'}
                          </span>
                        </div>
                        <div className="tl-msg">
                          {parts.map((part, j) =>
                            part.startsWith('{') ? <span key={j} className="var">{part}</span> : <span key={j}>{part}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {reply && (
            <div className="card">
              <div className="card-header">
                <div className="row">
                  <div className="card-title">Inbound replies</div>
                  {reply.temperature === 'hot' && <span className="chip warning"><Icons.flame size={11}/> Hot lead</span>}
                  {reply.temperature === 'warm' && <span className="chip"><span className="chip-dot"></span>Warm</span>}
                </div>
                <button className="btn btn-sm" onClick={() => go('inbox')}><Icons.external size={11}/> Open in inbox</button>
              </div>
              <div className="card-body" style={{background: 'var(--panel-2)', padding: 18}}>
                {reply.thread.map((m, i) => (
                  <div key={i}>
                    <div className={`bubble-meta ${m.dir}`} style={{textAlign: m.dir === 'out' ? 'right' : 'left'}}>{m.t} · {m.dir === 'out' ? 'AURA' : `${p.first_name} ${p.last_name}`}</div>
                    <div className={`bubble bubble-${m.dir}`}>{m.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Side facts */}
        <div className="col">
          <div className="card">
            <div className="card-header"><div className="card-title">Patient details</div></div>
            <div className="card-body" style={{padding: 0}}>
              {[
                ['Patient ID', <span className="mono">{p.id}</span>],
                ['Phone', <span className="mono">{p.phone}</span>],
                ['Email', <span className="mono" style={{fontSize: 12}}>{p.email}</span>],
                ['Last visit', `${p.last_visit_date} (${p.lapse_days}d ago)`],
                ['Last service', p.last_service],
                ['Enrollment', p.enrollment_date],
                ['Track', <TrackChip track={p.sequence_track}/>],
                ['Channel last used', <span className="chip">{p.channel_last_used.toUpperCase()}</span>],
                ['Booking link clicked', p.booking_link_clicked ? <span className="chip success"><Icons.check size={10}/> Yes</span> : <span className="chip">No</span>],
                ['Opted out', p.opted_out ? <span className="chip danger"><span className="chip-dot"></span>Yes</span> : <span className="chip">No</span>],
                ['Est. revenue', <span style={{color: p.estimated_revenue ? 'var(--success)' : 'var(--muted)', fontWeight: 500}}>{p.estimated_revenue ? `$${p.estimated_revenue}` : '—'}</span>],
              ].map(([l, v], i, arr) => (
                <div key={i} style={{display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, padding: '10px 16px', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none', alignItems: 'center'}}>
                  <span style={{fontSize: 12, color: 'var(--muted)'}}>{l}</span>
                  <span style={{fontSize: 13}}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Notes</div></div>
            <div className="card-body">
              <textarea className="textarea" placeholder="Internal notes about this patient…" defaultValue={p.replied ? `Patient replied — confirm preferred time slot before booking.` : ''}></textarea>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Audit log</div></div>
            <div className="card-body" style={{padding: '8px 0', maxHeight: 240, overflow: 'auto'}}>
              {[
                { t: '2 days ago', a: 'Booking link clicked' },
                { t: '3 days ago', a: 'Day 7 SMS delivered' },
                { t: '7 days ago', a: 'Day 3 email opened' },
                { t: '9 days ago', a: 'Day 3 email sent' },
                { t: `${p.enrolled_days}d ago`, a: `Enrolled into ${p.sequence_track.replace('_', ' ')} track` },
              ].map((e, i) => (
                <div key={i} style={{padding: '8px 16px', display: 'grid', gridTemplateColumns: '90px 1fr', gap: 10, fontSize: 12}}>
                  <span className="mono" style={{color: 'var(--muted)'}}>{e.t}</span>
                  <span>{e.a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// INBOX (Hot Lead)
// ============================================================================
function ScreenInbox() {
  const [tab, setTab] = useState('all');
  const [active, setActive] = useState(REPLIES[0].patientId);
  const filtered = REPLIES.filter(r => {
    if (tab === 'hot') return r.temperature === 'hot';
    if (tab === 'warm') return r.temperature === 'warm';
    if (tab === 'optouts') return r.temperature === 'opted_out';
    return r.temperature !== 'opted_out';
  });
  const reply = filtered.find(r => r.patientId === active) || filtered[0] || REPLIES[0];
  const patient = PATIENTS.find(p => p.id === reply.patientId) || { first_name: 'Maya', last_name: 'Patel', phone: '+17025551234', email: 'm.p@gmail.com', sequence_track: '90_day', last_service: 'Botox' };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inbox</h1>
          <div className="page-sub">{REPLIES.filter(r => r.unread).length} unread · 2 hot leads need follow-up within 1h</div>
        </div>
        <div className="page-actions">
          <button className="btn"><Icons.refresh size={14}/> Refresh</button>
          <button className="btn"><Icons.check size={14}/> Mark all read</button>
        </div>
      </div>

      <div className="tabs">
        {[
          { k: 'all', l: 'All replies', c: REPLIES.filter(r => r.temperature !== 'opted_out').length },
          { k: 'hot', l: 'Hot', c: REPLIES.filter(r => r.temperature === 'hot').length },
          { k: 'warm', l: 'Warm', c: REPLIES.filter(r => r.temperature === 'warm').length },
          { k: 'optouts', l: 'Opt-outs', c: REPLIES.filter(r => r.temperature === 'opted_out').length },
        ].map(t => (
          <div key={t.k} className={`tab ${tab === t.k ? 'active' : ''}`} onClick={() => { setTab(t.k); }}>
            {t.l}<span className="count">{t.c}</span>
          </div>
        ))}
      </div>

      <div className="inbox-grid">
        <div className="inbox-list">
          {filtered.map(r => {
            const p = PATIENTS.find(x => x.id === r.patientId) || { first_name: 'Patient', last_name: '' };
            return (
              <div key={r.patientId} className={`inbox-row ${r.patientId === active ? 'active' : ''} ${r.unread ? 'unread' : ''}`} onClick={() => setActive(r.patientId)}>
                <div style={{display: 'grid', gridTemplateColumns: '36px 1fr auto', gap: 10}}>
                  <div className="avatar" style={{width: 36, height: 36, fontSize: 13, background: 'var(--accent-soft)', color: 'var(--accent-strong)'}}>
                    {p.first_name[0]}{p.last_name[0]||''}
                  </div>
                  <div style={{minWidth: 0}}>
                    <div style={{display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2}}>
                      <span style={{fontWeight: 500, fontSize: 13}}>{p.first_name} {p.last_name}</span>
                      {r.temperature === 'hot' && <span className="chip warning" style={{padding: '0 5px', fontSize: 10}}><Icons.flame size={9}/></span>}
                      {r.temperature === 'opted_out' && <span className="chip danger" style={{padding: '0 5px', fontSize: 10}}>STOP</span>}
                    </div>
                    <div style={{color: 'var(--muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{r.preview}</div>
                  </div>
                  <div className="mono" style={{fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap'}}>{r.time}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="inbox-detail">
          <div className="inbox-detail-header">
            <div className="row" style={{gap: 12}}>
              <div className="avatar" style={{width: 40, height: 40, fontSize: 13, background: 'var(--accent-soft)', color: 'var(--accent-strong)'}}>
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div>
                <div className="row" style={{gap: 8}}>
                  <span style={{fontWeight: 600, fontSize: 14}}>{patient.first_name} {patient.last_name}</span>
                  {reply.temperature === 'hot' && <span className="chip warning"><Icons.flame size={11}/> Hot lead</span>}
                  {reply.temperature === 'warm' && <span className="chip"><span className="chip-dot"></span>Warm</span>}
                  {reply.temperature === 'opted_out' && <span className="chip danger"><span className="chip-dot"></span>Opted out</span>}
                </div>
                <div style={{fontSize: 12, color: 'var(--muted)', marginTop: 2}} className="mono">
                  {patient.phone} · {patient.last_service} · {patient.sequence_track && patient.sequence_track.replace('_', ' ')} track
                </div>
              </div>
            </div>
            <div className="row">
              <button className="btn btn-sm"><Icons.phone size={12}/> Call</button>
              <button className="btn btn-sm"><Icons.external size={12}/> Open patient</button>
              <button className="btn btn-sm btn-icon"><Icons.more size={14}/></button>
            </div>
          </div>

          <div className="inbox-thread">
            {reply.thread.map((m, i) => (
              <div key={i}>
                <div className="bubble-meta" style={{textAlign: m.dir === 'out' ? 'right' : 'left'}}>{m.t} · {m.dir === 'out' ? 'AURA · sequence' : `${patient.first_name}`}</div>
                <div className={`bubble bubble-${m.dir}`}>{m.text}</div>
              </div>
            ))}
            {reply.temperature === 'hot' && (
              <div style={{marginTop: 16, padding: 12, background: 'var(--warning-soft)', borderRadius: 8, fontSize: 12, color: 'var(--warning)', display: 'flex', gap: 8, alignItems: 'flex-start'}}>
                <Icons.flame size={14}/>
                <div>
                  <div style={{fontWeight: 600, marginBottom: 2}}>Hot lead alert sent at {reply.thread[reply.thread.length-1]?.t}</div>
                  <div style={{color: 'var(--text-2)'}}>SMS to +1 (702) 555-0101 · email to owner@glowlv.com · keywords matched: <span className="mono">book, tuesday, available</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="inbox-actions">
            <input className="input" placeholder={reply.temperature === 'opted_out' ? 'Replies disabled — patient opted out' : `Reply to ${patient.first_name}…`} disabled={reply.temperature === 'opted_out'}/>
            <button className="btn btn-sm">Templates</button>
            <button className="btn btn-primary btn-sm" disabled={reply.temperature === 'opted_out'}><Icons.send size={12}/> Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenPatientDetail, ScreenInbox });
