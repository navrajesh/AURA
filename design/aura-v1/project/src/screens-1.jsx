/* global React, Icons, Sparkline, StatusChip, TrackChip, SeqProgress,
          PATIENTS, SETTINGS, REPLIES, SMS_TEMPLATES, ACTIVITY, FUNNEL, TRENDS, CLIENTS */
const { useState, useMemo, useEffect } = React;

// ============================================================================
// DASHBOARD
// ============================================================================
function ScreenDashboard({ go }) {
  const totalEnrolled = PATIENTS.filter(p => p.status === 'enrolled').length;
  const totalReplies = REPLIES.length;
  const hotLeads = REPLIES.filter(r => r.temperature === 'hot').length;
  const converted = PATIENTS.filter(p => p.status === 'converted').length;
  const revenue = PATIENTS.reduce((a,b) => a + (b.estimated_revenue||0), 0);

  const kpis = [
    { label: 'Active in sequence', value: totalEnrolled, trend: '+12%', up: true, spark: TRENDS.enrolled, sub: 'vs. last week' },
    { label: 'Replies (7d)', value: totalReplies, trend: '+8%', up: true, spark: TRENDS.replies, sub: `${hotLeads} hot leads` },
    { label: 'Converted (30d)', value: converted, trend: '+24%', up: true, spark: TRENDS.conversions, sub: `${(converted/totalEnrolled*100||0).toFixed(1)}% of active` },
    { label: 'Est. revenue (30d)', value: `$${(revenue/1000).toFixed(1)}k`, trend: '+31%', up: true, spark: TRENDS.revenue, sub: 'from converted bookings' },
  ];

  const recentReplies = REPLIES.slice(0, 5);
  const upcomingSends = PATIENTS
    .filter(p => p.status === 'enrolled' && !p.replied)
    .slice(0, 6);

  const maxFunnel = Math.max(...FUNNEL.map(f => f.count));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <div className="page-sub">Glow Aesthetics Las Vegas · America/Los_Angeles · Tuesday, May 10, 2026</div>
        </div>
        <div className="page-actions">
          <button className="btn"><Icons.refresh size={14}/> Sync now</button>
          <button className="btn"><Icons.calendar size={14}/> Last 7 days <Icons.chevDown size={14}/></button>
          <button className="btn btn-primary"><Icons.plus size={14}/> Enroll patients</button>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="kpi">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-meta">
              <span className={`kpi-trend ${k.up?'up':'down'}`}>
                {k.up ? <Icons.arrowUp size={11} sw={2.4}/> : <Icons.arrowDown size={11} sw={2.4}/>}
                {k.trend}
              </span>
              <span>·</span>
              <span>{k.sub}</span>
            </div>
            <div className="kpi-spark">
              <Sparkline data={k.spark} color="var(--accent)" />
            </div>
          </div>
        ))}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 12}}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Reactivation funnel</div>
              <div className="page-sub" style={{marginTop: 2}}>Last 30 days · all tracks</div>
            </div>
            <div className="row">
              <button className="btn btn-sm btn-ghost">By track <Icons.chevDown size={12}/></button>
            </div>
          </div>
          <div className="card-body">
            {FUNNEL.map((f, i) => {
              const pct = (f.count / maxFunnel) * 100;
              const conv = i > 0 ? (f.count / FUNNEL[i-1].count * 100).toFixed(0) : null;
              return (
                <div key={i} className="funnel-row">
                  <div className="funnel-label">{f.stage}</div>
                  <div className="funnel-bar">
                    <div className="funnel-bar-fill" style={{width: `${pct}%`, background: f.color}}>
                      {pct > 18 && f.count}
                    </div>
                  </div>
                  <div className="funnel-num">{pct < 18 ? f.count : ''}</div>
                  <div className="funnel-pct">{conv ? `${conv}%` : '—'}</div>
                </div>
              );
            })}
            <hr className="div"/>
            <div className="row" style={{justifyContent: 'space-between', color: 'var(--muted)', fontSize: 12}}>
              <span>Conversion: <span style={{color: 'var(--text)', fontWeight: 500}}>3.8%</span></span>
              <span>Avg time to convert: <span style={{color: 'var(--text)', fontWeight: 500}}>9.2 days</span></span>
              <span>Reply rate: <span style={{color: 'var(--text)', fontWeight: 500}}>14.3%</span></span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Workflow health</div>
            <span className="chip success"><span className="chip-dot"></span>All systems normal</span>
          </div>
          <div className="card-body" style={{padding: 0}}>
            {[
              { name: 'Workflow 1 — Enrollment', sub: 'Daily · 06:00 PT', last: '4h ago', runs: 142, errs: 0, ok: true },
              { name: 'Workflow 2 — Message execution', sub: 'Tue / Wed / Thu · 10:00–14:00', last: '12m ago', runs: 89, errs: 2, ok: true },
              { name: 'Workflow 3 — Reply handler', sub: 'Webhook · always on', last: '12m ago', runs: 287, errs: 0, ok: true },
              { name: 'Workflow 4 — Reporting & digests', sub: 'Daily 08:00 · Mon 08:30', last: '6h ago', runs: 28, errs: 0, ok: true },
            ].map((w, i) => (
              <div key={i} style={{display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '14px 18px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', alignItems: 'center'}}>
                <div>
                  <div style={{fontWeight: 500, fontSize: 13}}>{w.name}</div>
                  <div style={{color: 'var(--muted)', fontSize: 12}}>{w.sub}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div className="mono" style={{fontSize: 12, color: 'var(--muted)'}}>last run</div>
                  <div className="mono" style={{fontSize: 12, fontWeight: 500}}>{w.last}</div>
                </div>
                <span className={`chip ${w.ok ? 'success' : 'warning'}`}>
                  <span className="chip-dot"></span>{w.ok ? 'Healthy' : 'Issues'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Hot leads needing follow-up</div>
            <button className="btn btn-sm btn-ghost" onClick={() => go('inbox')}>Open inbox <Icons.chevRight size={12}/></button>
          </div>
          <div className="card-body" style={{padding: 0}}>
            {recentReplies.filter(r => r.temperature !== 'opted_out').slice(0,4).map((r, i) => {
              const p = PATIENTS.find(x => x.id === r.patientId) || {first_name: 'Unknown', last_name: '', phone: ''};
              return (
                <div key={i} style={{display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 12, padding: '12px 18px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', alignItems: 'center', cursor: 'pointer'}}
                     onClick={() => go('inbox')}>
                  <div className="avatar">{p.first_name[0]}{p.last_name[0] || ''}</div>
                  <div style={{minWidth: 0}}>
                    <div style={{display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2}}>
                      <span style={{fontWeight: 500, fontSize: 13}}>{p.first_name} {p.last_name}</span>
                      {r.temperature === 'hot' && <span className="chip warning"><Icons.flame size={10}/> Hot</span>}
                      {r.temperature === 'warm' && <span className="chip"><span className="chip-dot"></span>Warm</span>}
                    </div>
                    <div style={{color: 'var(--muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{r.preview}</div>
                  </div>
                  <div className="mono" style={{fontSize: 11, color: 'var(--muted)'}}>{r.time}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Send queue · today</div>
            <span className="chip"><Icons.clock size={10}/> 6 scheduled</span>
          </div>
          <div className="card-body" style={{padding: 0}}>
            {upcomingSends.slice(0, 4).map((p, i) => {
              const nextDay = [3, 7, 12, 18, 23, 28].find(d => d > p.enrolled_days) || 28;
              const tmpl = SMS_TEMPLATES.find(t => t.day === nextDay);
              return (
                <div key={i} style={{display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: 12, padding: '12px 18px', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', alignItems: 'center'}}>
                  <div className="avatar">{p.first_name[0]}{p.last_name[0]}</div>
                  <div style={{minWidth: 0}}>
                    <div style={{fontWeight: 500, fontSize: 13}}>{p.first_name} {p.last_name}</div>
                    <div style={{color: 'var(--muted)', fontSize: 12}}>
                      Day {nextDay} · {tmpl ? tmpl.purpose : '—'}
                    </div>
                  </div>
                  <span className="chip">{tmpl?.channel === 'sms' ? <Icons.message size={10}/> : <Icons.mail size={10}/>} {tmpl?.channel}</span>
                  <div className="mono" style={{fontSize: 11, color: 'var(--muted)'}}>10:30 PT</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PATIENTS
// ============================================================================
function ScreenPatients({ go, openPatient }) {
  const [filter, setFilter] = useState('all');
  const [track, setTrack] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return PATIENTS.filter(p => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (track !== 'all' && p.sequence_track !== track) return false;
      if (search && !`${p.first_name} ${p.last_name} ${p.phone}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filter, track, search]);

  const counts = useMemo(() => {
    const c = { all: PATIENTS.length };
    PATIENTS.forEach(p => c[p.status] = (c[p.status]||0) + 1);
    return c;
  }, []);

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patients</h1>
          <div className="page-sub">{filtered.length} of {PATIENTS.length} records · synced from Boulevard 4h ago</div>
        </div>
        <div className="page-actions">
          <button className="btn"><Icons.upload size={14}/> Import CSV</button>
          <button className="btn"><Icons.download size={14}/> Export</button>
          <button className="btn btn-primary"><Icons.plus size={14}/> Enroll patient</button>
        </div>
      </div>

      <div className="tabs">
        {[
          { k: 'all', l: 'All', c: counts.all },
          { k: 'enrolled', l: 'Enrolled', c: counts.enrolled },
          { k: 'replied', l: 'Replied', c: counts.replied },
          { k: 'converted', l: 'Converted', c: counts.converted },
          { k: 'no_response', l: 'No response', c: counts.no_response },
          { k: 'opted_out', l: 'Opted out', c: counts.opted_out },
          { k: 'sequence_complete', l: 'Complete', c: counts.sequence_complete },
        ].map(t => (
          <div key={t.k} className={`tab ${filter === t.k ? 'active' : ''}`} onClick={() => setFilter(t.k)}>
            {t.l}<span className="count">{t.c||0}</span>
          </div>
        ))}
      </div>

      <div className="filters">
        <div className="search" style={{width: 280}}>
          <Icons.search size={14}/>
          <input placeholder="Search name, phone, email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className={`filter-pill ${track !== 'all' ? 'active' : ''}`} onClick={() => {
          const tracks = ['all', '60_day', '90_day', '120_day'];
          setTrack(tracks[(tracks.indexOf(track)+1) % tracks.length]);
        }}>
          <Icons.filter size={11}/> Track {track !== 'all' && <span className="pill-value">{track.replace('_', ' ')}</span>}
        </button>
        <button className="filter-pill"><Icons.calendar size={11}/> Enrolled in <span className="pill-value">last 30d</span></button>
        <button className="filter-pill">Channel</button>
        <button className="filter-pill">Replied = any</button>
        <button className="filter-pill" style={{borderStyle: 'solid', color: 'var(--muted)'}}><Icons.plus size={11}/> Add filter</button>
        <div style={{marginLeft: 'auto'}} className="row">
          <span style={{color: 'var(--muted)', fontSize: 12}}>Sort by</span>
          <button className="btn btn-sm btn-ghost">Enrollment date <Icons.chevDown size={12}/></button>
        </div>
      </div>

      <div className="card" style={{padding: 0}}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{width: 30}}><input type="checkbox" /></th>
                <th>Patient</th>
                <th>Status</th>
                <th>Track</th>
                <th>Sequence</th>
                <th>Last service</th>
                <th>Last visit</th>
                <th>Last contact</th>
                <th style={{textAlign: 'right'}}>Revenue</th>
                <th style={{width: 30}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 24).map(p => (
                <tr key={p.id} onClick={() => openPatient(p.id)}>
                  <td onClick={e => e.stopPropagation()}><input type="checkbox" /></td>
                  <td>
                    <div className="row">
                      <div className="avatar">{p.first_name[0]}{p.last_name[0]}</div>
                      <div className="cell-stack">
                        <div className="primary">{p.first_name} {p.last_name}</div>
                        <div className="secondary mono" style={{fontSize: 11}}>{p.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td><StatusChip status={p.status}/></td>
                  <td><TrackChip track={p.sequence_track}/></td>
                  <td>
                    <div className="row" style={{gap: 10}}>
                      <SeqProgress current={p.last_message_number} />
                      <span className="mono muted" style={{fontSize: 11}}>{p.last_message_number}/7</span>
                    </div>
                  </td>
                  <td className="muted">{p.last_service}</td>
                  <td className="num muted">{p.lapse_days}d ago</td>
                  <td className="num muted">{p.enrolled_days === 0 ? 'today' : `${p.enrolled_days}d ago`}</td>
                  <td className="num" style={{textAlign: 'right', fontWeight: p.estimated_revenue ? 500 : 400, color: p.estimated_revenue ? 'var(--success)' : 'var(--muted-2)'}}>
                    {p.estimated_revenue ? `$${p.estimated_revenue}` : '—'}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-icon"><Icons.more size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--muted)'}}>
          <div>Showing 1–{Math.min(24, filtered.length)} of {filtered.length}</div>
          <div className="row">
            <button className="btn btn-sm">Previous</button>
            <button className="btn btn-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenDashboard, ScreenPatients });
