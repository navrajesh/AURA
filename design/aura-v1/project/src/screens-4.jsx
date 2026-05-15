/* global React, Icons, ACTIVITY, PATIENTS, REPLIES, TRENDS, FUNNEL, Sparkline */
const { useState, useMemo } = React;

// ============================================================================
// CONNECTION
// ============================================================================
function ScreenConnection() {
  const sources = [
    { name: 'Boulevard', short: 'BV', desc: 'Direct API · OAuth 2.0', status: 'connected', last: '4h ago', records: '128', method: 'api' },
    { name: 'Mangomint', short: 'MM', desc: 'Direct API · X-API-Key header', status: 'available', records: null, method: 'api' },
    { name: 'Aesthetic Record', short: 'AR', desc: 'CSV upload via Google Drive', status: 'available', records: null, method: 'csv' },
    { name: 'Custom CSV', short: 'CSV', desc: 'Manual upload — any source', status: 'available', records: null, method: 'csv' },
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data sources</h1>
          <div className="page-sub">Connect a CRM or upload patient records. Workflow 1 runs daily at 06:00 PT.</div>
        </div>
        <div className="page-actions">
          <button className="btn"><Icons.refresh size={14}/> Run sync now</button>
          <button className="btn btn-primary"><Icons.plus size={14}/> Add source</button>
        </div>
      </div>

      {/* Active source summary */}
      <div className="card" style={{marginBottom: 16}}>
        <div className="card-body" style={{padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16}}>
          {[
            ['Active source', 'Boulevard API', 'Connected May 4, 2026'],
            ['Total records', '1,284', '128 lapsed in last sync'],
            ['Schedule', 'Daily · 06:00 PT', 'Next: tomorrow 06:00'],
            ['Last sync', '4 hours ago', '8.3s · no errors'],
          ].map(([l, v, s], i) => (
            <div key={i}>
              <div style={{fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6}}>{l}</div>
              <div style={{fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 2}}>{v}</div>
              <div style={{fontSize: 12, color: 'var(--muted)'}}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{marginBottom: 16}}>
        {sources.map((s, i) => (
          <div key={i} className={`conn-card ${s.status === 'connected' ? 'connected' : ''}`}>
            <div className="row" style={{justifyContent: 'space-between'}}>
              <div className="row" style={{gap: 12}}>
                <div className="conn-logo" style={{
                  background: s.status === 'connected' ? 'var(--accent-soft)' : 'var(--panel-2)',
                  color: s.status === 'connected' ? 'var(--accent-strong)' : 'var(--text)'
                }}>{s.short}</div>
                <div>
                  <div style={{fontWeight: 600, fontSize: 14}}>{s.name}</div>
                  <div style={{color: 'var(--muted)', fontSize: 12}}>{s.desc}</div>
                </div>
              </div>
              {s.status === 'connected' ?
                <span className="chip success"><span className="chip-dot"></span>Connected</span> :
                <span className="chip"><span className="chip-dot"></span>Available</span>}
            </div>
            {s.status === 'connected' ? (
              <>
                <hr className="div" style={{margin: '10px 0'}}/>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12}}>
                  <div>
                    <div style={{color: 'var(--muted)', marginBottom: 2}}>Records</div>
                    <div className="mono" style={{fontWeight: 500}}>1,284</div>
                  </div>
                  <div>
                    <div style={{color: 'var(--muted)', marginBottom: 2}}>Lapsed (60-120d)</div>
                    <div className="mono" style={{fontWeight: 500}}>128</div>
                  </div>
                  <div>
                    <div style={{color: 'var(--muted)', marginBottom: 2}}>Last sync</div>
                    <div className="mono" style={{fontWeight: 500}}>4h ago</div>
                  </div>
                </div>
                <div className="row" style={{gap: 6, marginTop: 12}}>
                  <button className="btn btn-sm">Configure</button>
                  <button className="btn btn-sm">View logs</button>
                  <button className="btn btn-sm" style={{marginLeft: 'auto', color: 'var(--danger)'}}>Disconnect</button>
                </div>
              </>
            ) : (
              <button className="btn btn-sm" style={{marginTop: 6, alignSelf: 'flex-start'}}>
                {s.method === 'api' ? <><Icons.link size={11}/> Connect API</> : <><Icons.upload size={11}/> Set up upload</>}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* CSV Drop Zone */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">CSV upload — direct ingest</div>
          <span className="chip">Watching <span className="mono" style={{marginLeft: 4}}>drive://aura/imports/glow-lv/</span></span>
        </div>
        <div className="card-body">
          <div style={{
            border: '2px dashed var(--border-strong)',
            borderRadius: 10,
            padding: 32,
            textAlign: 'center',
            color: 'var(--muted)',
            background: 'var(--panel-2)',
            cursor: 'pointer'
          }}>
            <div style={{display: 'flex', justifyContent: 'center', marginBottom: 8}}>
              <div style={{width: 44, height: 44, borderRadius: 10, background: 'var(--panel)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--text)'}}>
                <Icons.upload size={20}/>
              </div>
            </div>
            <div style={{color: 'var(--text)', fontWeight: 500, marginBottom: 4}}>Drop CSV here, or browse</div>
            <div style={{fontSize: 12}}>Required columns: <span className="mono">patient_id, first_name, phone, email, last_visit_date</span></div>
          </div>

          <div style={{marginTop: 18}}>
            <div className="row" style={{justifyContent: 'space-between', marginBottom: 10}}>
              <div style={{fontWeight: 500, fontSize: 13}}>Recent imports</div>
              <button className="btn btn-sm btn-ghost">View all</button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Source</th>
                  <th style={{textAlign: 'right'}}>Records</th>
                  <th style={{textAlign: 'right'}}>Imported</th>
                  <th style={{textAlign: 'right'}}>Skipped</th>
                  <th>Status</th>
                  <th style={{textAlign: 'right'}}>Time</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['glow-lv-may-export.csv', 'Aesthetic Record', 142, 128, 14, 'success', '2h ago'],
                  ['boulevard_sync_20260510.csv', 'Boulevard API', 1284, 1284, 0, 'success', '4h ago'],
                  ['glow-lv-april-batch.csv', 'Aesthetic Record', 89, 71, 18, 'warning', '8d ago'],
                ].map((r, i) => (
                  <tr key={i}>
                    <td><span className="mono" style={{fontSize: 12}}>{r[0]}</span></td>
                    <td className="muted">{r[1]}</td>
                    <td className="num" style={{textAlign: 'right'}}>{r[2]}</td>
                    <td className="num" style={{textAlign: 'right', color: 'var(--success)', fontWeight: 500}}>{r[3]}</td>
                    <td className="num" style={{textAlign: 'right', color: r[4] > 0 ? 'var(--warning)' : 'var(--muted-2)'}}>{r[4]}</td>
                    <td>{r[5] === 'success'
                      ? <span className="chip success"><span className="chip-dot"></span>Complete</span>
                      : <span className="chip warning"><Icons.alert size={10}/>Partial</span>}</td>
                    <td className="num muted" style={{textAlign: 'right'}}>{r[6]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACTIVITY LOG
// ============================================================================
function ScreenActivity() {
  const [filter, setFilter] = useState('all');

  const filtered = ACTIVITY.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'errors') return a.lvl === 'error' || a.lvl === 'warn';
    return a.meta === filter;
  });

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity log</h1>
          <div className="page-sub">Live event stream from Make.com · 287 events today · auto-refreshing every 30s</div>
        </div>
        <div className="page-actions">
          <button className="btn"><Icons.pause size={14}/> Pause stream</button>
          <button className="btn"><Icons.download size={14}/> Export</button>
        </div>
      </div>

      <div className="filters">
        {[
          { k: 'all', l: 'All events' },
          { k: 'wf1', l: 'Workflow 1 · Enrollment' },
          { k: 'wf2', l: 'Workflow 2 · Sends' },
          { k: 'wf3', l: 'Workflow 3 · Replies' },
          { k: 'wf4', l: 'Workflow 4 · Reports' },
          { k: 'errors', l: 'Errors only' },
        ].map(f => (
          <button key={f.k} className={`filter-pill ${filter === f.k ? 'active' : ''}`} onClick={() => setFilter(f.k)}>
            {f.l}
          </button>
        ))}
        <div style={{marginLeft: 'auto'}} className="row">
          <span className="row" style={{gap: 5, fontSize: 12, color: 'var(--success)'}}>
            <span style={{width: 6, height: 6, background: 'var(--success)', borderRadius: '50%', animation: 'pulse 1.6s infinite'}}></span>
            Streaming
          </span>
        </div>
      </div>

      <div className="card" style={{padding: 0}}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '110px 90px 1fr 80px',
          gap: 16,
          padding: '10px 14px',
          background: 'var(--panel-2)',
          borderBottom: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500
        }}>
          <div>Time (PT)</div>
          <div>Level</div>
          <div>Event</div>
          <div style={{textAlign: 'right'}}>Workflow</div>
        </div>
        <div style={{maxHeight: 'calc(100vh - 320px)', overflow: 'auto'}}>
          {filtered.map((a, i) => (
            <div key={i} className="log-line">
              <div className="log-time">{a.t}</div>
              <div className={`log-level ${a.lvl}`}>{a.lvl.toUpperCase()}</div>
              <div className="log-msg">{a.msg}</div>
              <div className="log-meta">{a.meta}</div>
            </div>
          ))}
        </div>
        <div style={{padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)'}}>
          <div>Showing {filtered.length} of 287 events today</div>
          <div className="row">
            <button className="btn btn-sm">Load earlier</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}

// ============================================================================
// REPORTS
// ============================================================================
function ScreenReports() {
  const week = [
    { day: 'Mon', sent: 0, replies: 1, conv: 0 },
    { day: 'Tue', sent: 64, replies: 8, conv: 2 },
    { day: 'Wed', sent: 58, replies: 11, conv: 3 },
    { day: 'Thu', sent: 71, replies: 9, conv: 2 },
    { day: 'Fri', sent: 0, replies: 4, conv: 1 },
    { day: 'Sat', sent: 0, replies: 2, conv: 1 },
    { day: 'Sun', sent: 0, replies: 1, conv: 0 },
  ];
  const maxSent = Math.max(...week.map(w => w.sent + w.replies + w.conv));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <div className="page-sub">Weekly summary auto-emailed to owner@glowlv.com every Monday at 08:30 PT</div>
        </div>
        <div className="page-actions">
          <button className="btn">Week of May 4 <Icons.chevDown size={14}/></button>
          <button className="btn"><Icons.send size={14}/> Send now</button>
          <button className="btn"><Icons.download size={14}/> Export PDF</button>
        </div>
      </div>

      {/* Email preview */}
      <div style={{display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16}}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Weekly summary · May 4 — May 10</div>
              <div className="page-sub" style={{marginTop: 2}}>Glow Aesthetics Las Vegas · 287 patients in sequence</div>
            </div>
            <span className="chip success"><Icons.check size={10}/> Sent Monday 08:30</span>
          </div>
          <div className="card-body">
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18}}>
              {[
                ['Contacted', '193', '+12% WoW', 'up'],
                ['Replies', '36', '+8% WoW · 9 hot', 'up'],
                ['Booking clicks', '47', '+24% WoW', 'up'],
                ['Converted', '9', '4 awaiting check-in', 'up'],
                ['Est. revenue', '$3.6k', 'avg ticket $400', 'up'],
                ['No response', '12', 'sequence complete', 'flat'],
              ].map(([l, v, s, t], i) => (
                <div key={i} style={{padding: '12px 14px', background: 'var(--panel-2)', borderRadius: 8, border: '1px solid var(--border)'}}>
                  <div style={{fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em'}}>{l}</div>
                  <div style={{fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginBottom: 4}}>{v}</div>
                  <div className="kpi-trend up" style={{fontSize: 11}}>
                    {t === 'up' && <Icons.arrowUp size={10} sw={2.4}/>}
                    {s}
                  </div>
                </div>
              ))}
            </div>

            <div style={{marginBottom: 18}}>
              <div style={{fontSize: 13, fontWeight: 500, marginBottom: 10}}>Daily activity</div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, alignItems: 'flex-end', height: 140}}>
                {week.map((w, i) => {
                  const total = w.sent + w.replies + w.conv;
                  const h = total === 0 ? 4 : (total / maxSent) * 120;
                  return (
                    <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
                      <div style={{
                        height: h,
                        width: '100%',
                        background: total === 0 ? 'var(--panel-2)' : 'var(--text)',
                        borderRadius: 4,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column-reverse',
                        overflow: 'hidden',
                      }}>
                        {w.conv > 0 && <div style={{height: (w.conv/total)*h, background: 'var(--success)'}}/>}
                        {w.replies > 0 && <div style={{height: (w.replies/total)*h, background: 'var(--accent)'}}/>}
                      </div>
                      <div style={{fontSize: 11, color: 'var(--muted)'}}>{w.day}</div>
                      <div className="mono" style={{fontSize: 11}}>{total}</div>
                    </div>
                  );
                })}
              </div>
              <div className="row" style={{gap: 14, marginTop: 8, fontSize: 11, color: 'var(--muted)'}}>
                <span className="row" style={{gap: 5}}><span style={{width:8, height:8, background:'var(--text)', borderRadius:2}}></span>Sent</span>
                <span className="row" style={{gap: 5}}><span style={{width:8, height:8, background:'var(--accent)', borderRadius:2}}></span>Replies</span>
                <span className="row" style={{gap: 5}}><span style={{width:8, height:8, background:'var(--success)', borderRadius:2}}></span>Converted</span>
              </div>
            </div>

            <hr className="div"/>

            <div style={{fontSize: 13, fontWeight: 500, marginBottom: 10}}>Conversions this week</div>
            <table className="table">
              <thead>
                <tr><th>Patient</th><th>Track</th><th>Replied on</th><th>Service</th><th style={{textAlign: 'right'}}>Revenue</th></tr>
              </thead>
              <tbody>
                {PATIENTS.filter(p => p.status === 'converted').slice(0, 5).map(p => (
                  <tr key={p.id}>
                    <td><div className="row"><div className="avatar avatar-sm">{p.first_name[0]}{p.last_name[0]}</div>{p.first_name} {p.last_name}</div></td>
                    <td><span className="track-chip">{p.sequence_track.replace('_day','d')}</span></td>
                    <td className="muted num">{p.enrolled_days - 6}d ago</td>
                    <td className="muted">{p.last_service}</td>
                    <td className="num" style={{textAlign: 'right', fontWeight: 500, color: 'var(--success)'}}>${p.estimated_revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Performance by track</div>
            </div>
            <div className="card-body">
              {[
                { name: '60-day · warm', enrolled: 84, conv: 7, color: 'var(--info)' },
                { name: '90-day · urgent', enrolled: 121, conv: 10, color: 'var(--accent)' },
                { name: '120-day · value', enrolled: 82, conv: 4, color: 'var(--warning)' },
              ].map((t, i) => (
                <div key={i} style={{marginBottom: 14}}>
                  <div className="row" style={{justifyContent: 'space-between', marginBottom: 6}}>
                    <span style={{fontSize: 13, fontWeight: 500}}>{t.name}</span>
                    <span className="mono" style={{fontSize: 12, color: 'var(--muted)'}}>{t.conv}/{t.enrolled} · {(t.conv/t.enrolled*100).toFixed(1)}%</span>
                  </div>
                  <div className="bar"><div className="bar-fill" style={{width: `${(t.conv/t.enrolled*100*5)}%`, background: t.color}}/></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Best performing message</div></div>
            <div className="card-body">
              <div className="row" style={{gap: 8, marginBottom: 8}}>
                <span className="chip"><Icons.message size={10}/>SMS</span>
                <span style={{fontWeight: 500}}>Day 7 — The Offer</span>
              </div>
              <div style={{padding: 12, background: 'var(--panel-2)', borderRadius: 6, fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)', marginBottom: 12}}>
                Hi <span className="var" style={{color: 'var(--accent)', fontFamily: "'Geist Mono', monospace"}}>{`{first_name}`}</span>, Dr. Sarah here from Glow Aesthetics. I wanted to extend this just for returning patients: 15% off your next Botox session…
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12}}>
                <div><div style={{color: 'var(--muted)', marginBottom: 2}}>Reply rate</div><div style={{fontWeight: 600, fontSize: 16}} className="mono">22.4%</div></div>
                <div><div style={{color: 'var(--muted)', marginBottom: 2}}>Click rate</div><div style={{fontWeight: 600, fontSize: 16}} className="mono">14.1%</div></div>
                <div><div style={{color: 'var(--muted)', marginBottom: 2}}>Convert rate</div><div style={{fontWeight: 600, fontSize: 16}} className="mono">5.8%</div></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Delivery health</div></div>
            <div className="card-body">
              {[
                ['Twilio SMS', 'success', '99.2% delivered', '1,232 of 1,242'],
                ['Mailchimp email', 'success', '98.7% delivered', '684 of 693'],
                ['Boulevard API', 'success', '0 sync errors', '4h ago · 8.3s'],
                ['Google Sheets API', 'success', 'No throttling', '0.4s avg write'],
              ].map(([name, st, msg, sub], i, a) => (
                <div key={i} style={{display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, padding: '10px 0', borderBottom: i < a.length-1 ? '1px solid var(--border)' : 'none'}}>
                  <div>
                    <div style={{fontSize: 13, fontWeight: 500}}>{name}</div>
                    <div style={{color: 'var(--muted)', fontSize: 12}}>{sub}</div>
                  </div>
                  <span className={`chip ${st}`}><span className="chip-dot"></span>{msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenConnection, ScreenActivity, ScreenReports });
