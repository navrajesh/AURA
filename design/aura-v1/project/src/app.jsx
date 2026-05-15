/* global React, ReactDOM, Icons, CLIENTS, SETTINGS, REPLIES,
          ScreenDashboard, ScreenPatients, ScreenPatientDetail, ScreenInbox,
          ScreenTemplates, ScreenSettings, ScreenConnection, ScreenActivity, ScreenReports,
          TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSelect, TweakToggle, useTweaks */
const { useState, useEffect, useRef } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "density": "default",
  "accent": "#C75D3C"
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ['#C75D3C', '#0F766E', '#3B5DAA', '#8B5CF6', '#18181B'];

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState({ name: 'dashboard' });
  const [client, setClient] = useState(CLIENTS[0]);
  const [clientOpen, setClientOpen] = useState(false);

  // Apply tweaks to document
  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.density = tweaks.density;
    if (tweaks.accent) {
      document.documentElement.style.setProperty('--accent', tweaks.accent);
      // derive a soft variant
      document.documentElement.style.setProperty('--accent-strong', shade(tweaks.accent, -15));
      document.documentElement.style.setProperty('--accent-soft', tweaks.theme === 'dark' ? shade(tweaks.accent, -55, true) : shade(tweaks.accent, 35, true));
    }
  }, [tweaks]);

  function shade(hex, pct, mix) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (mix) {
      // mix toward background
      const bg = pct > 0 ? 250 : 30;
      r = r + (bg - r) * Math.abs(pct) / 100;
      g = g + (bg - g) * Math.abs(pct) / 100;
      b = b + (bg - b) * Math.abs(pct) / 100;
    } else {
      r = Math.max(0, Math.min(255, r + r * pct / 100));
      g = Math.max(0, Math.min(255, g + g * pct / 100));
      b = Math.max(0, Math.min(255, b + b * pct / 100));
    }
    return `#${[r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  }

  const go = (name, params = {}) => setRoute({ name, ...params });
  const openPatient = (id) => setRoute({ name: 'patientDetail', patientId: id });

  const navItems = [
    { name: 'dashboard', label: 'Overview', icon: 'dashboard' },
    { name: 'patients', label: 'Patients', icon: 'users', count: 78 },
    { name: 'inbox', label: 'Inbox', icon: 'inbox', badge: REPLIES.filter(r => r.unread).length },
    { name: 'templates', label: 'Templates', icon: 'message' },
    { name: 'connection', label: 'Data sources', icon: 'database' },
  ];
  const navItems2 = [
    { name: 'activity', label: 'Activity log', icon: 'activity' },
    { name: 'reports', label: 'Reports', icon: 'report' },
    { name: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const breadcrumbs = {
    dashboard: ['Overview'],
    patients: ['Patients'],
    patientDetail: ['Patients', 'Detail'],
    inbox: ['Inbox'],
    templates: ['Templates'],
    connection: ['Data sources'],
    activity: ['Activity log'],
    reports: ['Reports'],
    settings: ['Settings'],
  };

  let screen;
  switch (route.name) {
    case 'dashboard': screen = <ScreenDashboard go={go} />; break;
    case 'patients': screen = <ScreenPatients go={go} openPatient={openPatient}/>; break;
    case 'patientDetail': screen = <ScreenPatientDetail patientId={route.patientId} go={go} />; break;
    case 'inbox': screen = <ScreenInbox/>; break;
    case 'templates': screen = <ScreenTemplates/>; break;
    case 'connection': screen = <ScreenConnection/>; break;
    case 'activity': screen = <ScreenActivity/>; break;
    case 'reports': screen = <ScreenReports/>; break;
    case 'settings': screen = <ScreenSettings/>; break;
    default: screen = <ScreenDashboard go={go}/>;
  }

  const crumbs = breadcrumbs[route.name] || ['Overview'];

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><span>A</span></div>
          <div>
            <div className="brand-name">AURA</div>
            <div className="brand-sub">Reactivation OS</div>
          </div>
        </div>

        <div className="client-switcher" onClick={() => setClientOpen(!clientOpen)} style={{position: 'relative'}}>
          <div className="client-avatar">{client.short}</div>
          <div className="client-info">
            <div className="client-name">{client.name}</div>
            <div className="client-tier">{client.tier}</div>
          </div>
          <Icons.chevDown size={14} className="client-chev"/>
          {clientOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)', left: 0, right: 0,
              background: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              padding: 6,
            }}>
              {CLIENTS.map(c => (
                <div key={c.id} onClick={(e) => {e.stopPropagation(); setClient(c); setClientOpen(false);}} style={{
                  padding: '8px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  background: c.id === client.id ? 'var(--panel-2)' : 'transparent',
                }}>
                  <div className="client-avatar" style={{width: 24, height: 24, fontSize: 11}}>{c.short}</div>
                  <div style={{minWidth: 0, flex: 1}}>
                    <div style={{fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{c.name}</div>
                    <div style={{fontSize: 11, color: 'var(--muted)'}}>{c.tier}</div>
                  </div>
                  {c.id === client.id && <Icons.check size={12}/>}
                </div>
              ))}
              <hr className="div" style={{margin: '6px 0'}}/>
              <div style={{padding: '8px 10px', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center'}}>
                <Icons.plus size={12}/> Add client
              </div>
            </div>
          )}
        </div>

        <div className="nav-section">
          {navItems.map(item => {
            const Ic = Icons[item.icon];
            const active = route.name === item.name || (item.name === 'patients' && route.name === 'patientDetail');
            return (
              <div key={item.name} className={`nav-item ${active ? 'active' : ''}`} onClick={() => go(item.name)}>
                <Ic className="icon"/>
                {item.label}
                {item.badge ? <span className="badge">{item.badge}</span> : null}
                {item.count ? <span className="count">{item.count}</span> : null}
              </div>
            );
          })}

          <div className="nav-label">System</div>
          {navItems2.map(item => {
            const Ic = Icons[item.icon];
            return (
              <div key={item.name} className={`nav-item ${route.name === item.name ? 'active' : ''}`} onClick={() => go(item.name)}>
                <Ic className="icon"/>
                {item.label}
              </div>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="user-avatar">MK</div>
          <div className="user-info">
            <div className="user-name">Mira Kelley</div>
            <div className="user-email">mira@northstar.agency</div>
          </div>
          <button className="icon-btn" style={{width: 26, height: 26}} onClick={() => setTweak('theme', tweaks.theme === 'light' ? 'dark' : 'light')}>
            {tweaks.theme === 'light' ? <Icons.moon size={14}/> : <Icons.sun size={14}/>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <div className="topbar">
          <div className="breadcrumb">
            <span>AURA</span>
            <span className="sep">/</span>
            <span>{client.short}</span>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                <span className="sep">/</span>
                <span className={i === crumbs.length - 1 ? 'crumb-current' : ''}>{c}</span>
              </React.Fragment>
            ))}
          </div>

          <div className="topbar-actions">
            <div className="search">
              <Icons.search size={14}/>
              <input placeholder="Search patients, replies, settings…"/>
              <span className="kbd">⌘K</span>
            </div>
            <button className="icon-btn"><Icons.zap size={14}/></button>
            <button className="icon-btn">
              <Icons.bell size={14}/>
              <span className="dot"></span>
            </button>
            <div style={{height: 24, width: 1, background: 'var(--border)'}}></div>
            <span className="chip success" style={{padding: '3px 8px'}}>
              <span className="chip-dot" style={{background: 'var(--success)', animation: 'pulse 2s infinite'}}></span>
              Live
            </span>
          </div>
        </div>

        {screen}
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Theme">
          <TweakRadio
            label="Mode"
            value={tweaks.theme}
            onChange={v => setTweak('theme', v)}
            options={['light', 'dark']}
          />
        </TweakSection>
        <TweakSection title="Layout">
          <TweakRadio
            label="Density"
            value={tweaks.density}
            onChange={v => setTweak('density', v)}
            options={['compact', 'default', 'spacious']}
          />
        </TweakSection>
        <TweakSection title="Accent">
          <TweakColor
            label="Brand color"
            value={tweaks.accent}
            onChange={v => setTweak('accent', v)}
            options={ACCENT_OPTIONS}
          />
        </TweakSection>
      </TweaksPanel>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
