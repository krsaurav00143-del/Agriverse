import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const LOGO = '/agriverse-logo.png';

// Backend base URL. Override with VITE_API_URL in frontend/.env (see .env.example).
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const MAX_IMAGE_MB = 10;

// login / register / profile stay empty (demo mode) until you build those endpoints.
const API = {
  login: '',
  register: '',
  predict: `${API_BASE}/predict`,
  health: `${API_BASE}/health`,
  profile: ''
};

const weatherCode = (code) => {
  if (code === 0) return ['Clear sky', '☀️'];
  if ([1, 2, 3].includes(code)) return ['Partly cloudy', '⛅'];
  if ([45, 48].includes(code)) return ['Foggy', '🌫️'];
  if ([51, 53, 55, 56, 57].includes(code)) return ['Drizzle', '🌦️'];
  if ([61, 63, 65, 66, 67].includes(code)) return ['Rain', '🌧️'];
  if ([71, 73, 75, 77].includes(code)) return ['Snow', '❄️'];
  if ([80, 81, 82].includes(code)) return ['Rain showers', '🌦️'];
  if ([95, 96, 99].includes(code)) return ['Thunderstorm', '⛈️'];
  return ['Weather', '🌤️'];
};

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Weather service unavailable');
  const data = await response.json();
  return data;
}

async function getLocationName(lat, lon) {
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`);
    if (!response.ok) return 'Current location';
    const data = await response.json();
    const result = data?.results?.[0];
    return result ? [result.name, result.admin1].filter(Boolean).join(', ') : 'Current location';
  } catch {
    return 'Current location';
  }
}

function Icon({ name, size = 20 }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    leaf: <><path d="M20 4C10 4 4 10 4 20c8 0 14-4 16-16Z"/><path d="M4 20c4-4 7-7 12-10"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.06.06-1.42 1.42-.06-.06a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.09 1.65V20h-2v-.31a1.8 1.8 0 0 0-1.09-1.65 1.8 1.8 0 0 0-1.98.36l-.06.06-1.42-1.42.06-.06A1.8 1.8 0 0 0 9.16 15a1.8 1.8 0 0 0-1.65-1.09H7v-2h.51A1.8 1.8 0 0 0 9.16 10a1.8 1.8 0 0 0-.36-1.98l-.06-.06 1.42-1.42.06.06a1.8 1.8 0 0 0 1.98.36A1.8 1.8 0 0 0 13.29 5.3V5h2v.3A1.8 1.8 0 0 0 16.38 6.95a1.8 1.8 0 0 0 1.98-.36l.06-.06 1.42 1.42-.06.06A1.8 1.8 0 0 0 19.42 10a1.8 1.8 0 0 0 1.65 1.09h.51v2h-.51A1.8 1.8 0 0 0 19.4 15Z"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3.9 1.65c-1 .9-1.7 1.25-1.7 2.35"/><path d="M12 16h.01"/></>,
    upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    camera: <><path d="M4 7h3l1.5-2h7L17 7h3v12H4Z"/><circle cx="12" cy="13" r="4"/></>,
    cloud: <><path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18Z"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', contact: '', email: '', password: '', login: '' });
  const [showPass, setShowPass] = useState(false);
  const [message, setMessage] = useState('');

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    const endpoint = mode === 'login' ? API.login : API.register;
    const payload = mode === 'login'
      ? { login: form.login, password: form.password }
      : { name: form.name, contact: form.contact, email: form.email || undefined, password: form.password };

    if (endpoint) {
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        onLogin(data.user || data);
        return;
      } catch {
        setMessage('Unable to connect to the backend. Please check the API endpoint.');
        return;
      }
    }

    // Frontend-only demo mode until backend endpoints are supplied.
    const demoUser = {
      farmerId: 'AGV-' + (form.contact || '1001').replace(/\D/g, '').slice(-6).padStart(6, '0'),
      name: mode === 'login' ? 'Demo Farmer' : form.name,
      contact: mode === 'login' ? form.login : form.contact,
      email: form.email || '',
      field: 'Not added yet',
      photo: ''
    };
    localStorage.setItem('agriverse_user', JSON.stringify(demoUser));
    onLogin(demoUser);
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-overlay" />
      <div className="auth-brand"><img src={LOGO} alt="AgriVerse" /></div>
      <div className="auth-card">
        <div className="auth-heading">
          <span className="eyebrow">SMART FARMING PLATFORM</span>
          <h1>{mode === 'login' ? 'Welcome back, Farmer' : 'Create your farmer account'}</h1>
          <p>{mode === 'login' ? 'Sign in to access your AgriVerse dashboard.' : 'Join AgriVerse and bring AI-powered farming to your field.'}</p>
        </div>
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage(''); }}>Login</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setMessage(''); }}>Registration</button>
        </div>
        <form onSubmit={submit} className="form-grid">
          {mode === 'register' && <>
            <label>Full Name<input name="name" value={form.name} onChange={update} placeholder="Enter your name" required /></label>
            <label>Contact Number<input name="contact" value={form.contact} onChange={update} placeholder="10-digit mobile number" inputMode="tel" required /></label>
            <label className="full">Gmail <span>(optional)</span><input name="email" value={form.email} onChange={update} placeholder="you@gmail.com" type="email" /></label>
          </>}
          {mode === 'login' && <label className="full">Contact Number or Username<input name="login" value={form.login} onChange={update} placeholder="Enter contact number or username" required /></label>}
          <label className="full">Create Password<input name="password" value={form.password} onChange={update} placeholder="Enter password" type={showPass ? 'text' : 'password'} required minLength="6" /></label>
          <label className="check"><input type="checkbox" checked={showPass} onChange={(e) => setShowPass(e.target.checked)} /> Show password</label>
          {message && <div className="error full">{message}</div>}
          <button className="primary-btn full" type="submit">{mode === 'login' ? 'Login to AgriVerse' : 'Create Account'} <span>→</span></button>
        </form>
        <div className="demo-note">Backend endpoints are ready to be added in <code>src/main.jsx</code>.</div>
      </div>
    </div>
  );
}

function Header({ user, active, setActive, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const nav = [
    ['home', 'Home'],
    ['predict', 'Predict'],
    ['profile', 'Profile']
  ];

  return <header className="topbar">
    <button className="brand" onClick={() => setActive('home')}><img src={LOGO} alt="AgriVerse logo" /><span>AgriVerse</span></button>
    <nav className="desktop-nav">{nav.map(([id, label]) => <button key={id} className={active === id ? 'nav-active' : ''} onClick={() => setActive(id)}>{id === 'home' && <Icon name="home" size={17} />}{id === 'predict' && <Icon name="leaf" size={17} />}{id === 'profile' && <Icon name="user" size={17} />}{label}</button>)}</nav>
    <div className="top-actions">
      <div className="search"><Icon name="search" size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search AgriVerse..." /></div>
      <button className="avatar-btn" onClick={() => setProfileOpen(!profileOpen)}><span className="avatar">{user?.name?.[0]?.toUpperCase() || 'F'}</span><span className="avatar-name">{user?.name || 'Farmer'}</span></button>
      {profileOpen && <div className="profile-menu">
        <div className="menu-user"><div className="avatar large">{user?.name?.[0]?.toUpperCase() || 'F'}</div><div><strong>{user?.name || 'Farmer'}</strong><small>{user?.farmerId || 'Farmer ID'}</small></div></div>
        <button onClick={() => { setActive('profile'); setProfileOpen(false); }}><Icon name="user" /> Profile</button>
        <button onClick={() => { setActive('settings'); setProfileOpen(false); }}><Icon name="settings" /> Settings</button>
        <button onClick={() => { setActive('help'); setProfileOpen(false); }}><Icon name="help" /> Help</button>
        <button className="logout" onClick={onLogout}><Icon name="logout" /> Logout</button>
      </div>}
    </div>
  </header>;
}

function LocationWeather() {
  const [status, setStatus] = useState('Detecting your location...');
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState('Current location');

  const load = () => {
    if (!navigator.geolocation) { setStatus('Location is not supported by this browser.'); return; }
    setStatus('Detecting your location...');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const [w, place] = await Promise.all([getWeather(coords.latitude, coords.longitude), getLocationName(coords.latitude, coords.longitude)]);
        setWeather(w.current);
        setLocation(place);
        setStatus('Live weather');
      } catch { setStatus('Could not load weather.'); }
    }, () => setStatus('Location permission is required for live weather.'), { enableHighAccuracy: true, timeout: 10000 });
  };

  useEffect(load, []);

  if (!weather) return <section className="weather-card loading-weather"><div><span className="eyebrow">LIVE WEATHER</span><h2>{status}</h2><p>AgriVerse uses your browser location to show local conditions.</p></div><button className="outline-btn" onClick={load}><Icon name="pin" /> Retry</button></section>;
  const [desc, emoji] = weatherCode(weather.weather_code);
  return <section className="weather-card">
    <div className="weather-main"><span className="eyebrow">{status.toUpperCase()}</span><div className="place"><Icon name="pin" size={17} /> {location}</div><div className="temperature">{Math.round(weather.temperature_2m)}°<span>C</span></div><div className="condition">{emoji} {desc}</div></div>
    <div className="weather-stats"><div><b>{Math.round(weather.apparent_temperature)}°C</b><span>Feels like</span></div><div><b>{weather.relative_humidity_2m}%</b><span>Humidity</span></div><div><b>{weather.wind_speed_10m} km/h</b><span>Wind</span></div><div><b>{weather.precipitation} mm</b><span>Precipitation</span></div></div>
    <button className="refresh-weather" onClick={load}>↻</button>
  </section>;
}

function Home({ user, setActive }) {
  return <main className="page home-page">
    <div className="hero-copy"><div><span className="eyebrow">WELCOME TO AGRIVERSE</span><h1>Grow smarter.<br/><em>Farm better.</em></h1><p>Your AI-powered farming companion for crop health, weather insights and better decisions.</p><div className="hero-buttons"><button className="primary-btn" onClick={() => setActive('predict')}>Predict Plant Disease <span>→</span></button><button className="soft-btn" onClick={() => setActive('profile')}><Icon name="user" /> View Profile</button></div></div><div className="hero-orbit"><img src={LOGO} alt="AgriVerse" /></div></div>
    <LocationWeather />
    <div className="quick-grid">
      <button onClick={() => setActive('predict')} className="quick-card"><div className="quick-icon"><Icon name="leaf" /></div><div><strong>Plant Disease Prediction</strong><p>Upload a plant photo and get an AI prediction.</p></div><span>→</span></button>
      <div className="quick-card"><div className="quick-icon"><Icon name="pin" /></div><div><strong>Location-aware farming</strong><p>Use live local conditions to plan your next field action.</p></div></div>
      <div className="quick-card"><div className="quick-icon">🌱</div><div><strong>Smart Agriculture</strong><p>Keep crop, field and farmer information in one place.</p></div></div>
    </div>
  </main>;
}

function useBackendStatus() {
  const [status, setStatus] = useState('checking'); // checking | ready | offline
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch(API.health);
        const data = res.ok ? await res.json() : null;
        if (alive) setStatus(data?.model_loaded ? 'ready' : 'offline');
      } catch { if (alive) setStatus('offline'); }
    };
    check();
    const id = setInterval(check, 15000);
    return () => { alive = false; clearInterval(id); };
  }, []);
  return status;
}

function Predict() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const backend = useBackendStatus();

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const selectFile = (f) => {
    if (!f) return;
    setResult(null); setError('');
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { setError('Please choose a JPG, JPEG or PNG image.'); return; }
    if (f.size > MAX_IMAGE_MB * 1024 * 1024) { setError(`Image is too large. Maximum size is ${MAX_IMAGE_MB} MB.`); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
  };
  const reset = () => { setFile(null); setPreview(''); setResult(null); setError(''); };

  const submit = async () => {
    if (!file || loading) return;
    setLoading(true); setError(''); setResult(null);
    const body = new FormData(); body.append('image', file);
    try {
      const res = await fetch(API.predict, { method: 'POST', body });
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json()).detail; } catch { /* non-JSON error body */ }
        throw new Error(typeof detail === 'string' && detail ? detail : `Server error (${res.status}).`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof TypeError
        ? 'Cannot reach the AI server. Make sure the backend is running on ' + API_BASE + '.'
        : err.message);
    } finally { setLoading(false); }
  };

  const pct = (v) => `${(v * 100).toFixed(1)}%`;
  const badge = backend === 'ready' ? ['AI', 'READY'] : backend === 'checking' ? ['AI', 'CONNECTING'] : ['AI', 'OFFLINE'];

  return <main className="page predict-page">
    <div className="section-heading"><div><span className="eyebrow">AI CROP HEALTH</span><h1>Plant Disease Prediction</h1><p>Take a clear plant photo or upload one to send it to your AI model.</p></div><div className={`predict-badge ${backend}`}>{badge[0]} <span>●</span> {badge[1]}</div></div>
    <div className="predict-layout">
      <section className="upload-card">
        <div className="dropzone" onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); selectFile(e.dataTransfer.files?.[0]); }}>
          {preview ? <img src={preview} className="preview" alt="Plant preview" /> : <><div className="upload-icon"><Icon name="leaf" size={34} /></div><h2>Upload plant photo</h2><p>Drag & drop an image here or click to browse</p><small>JPG, JPEG or PNG</small></>}
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { selectFile(e.target.files?.[0]); e.target.value = ''; }} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { selectFile(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        <div className="capture-row"><button className="outline-btn" onClick={() => inputRef.current?.click()}><Icon name="upload" /> Upload Photo</button><button className="outline-btn" onClick={() => cameraRef.current?.click()}><Icon name="camera" /> Take Photo</button></div>
        {error && <div className="error predict-error" role="alert">{error}</div>}
        <button className="primary-btn full-width" disabled={!file || loading} onClick={submit}>{loading ? 'Analysing…' : 'Predict Disease'} <span>{loading ? '' : '→'}</span></button>
        {file && !loading && <button className="link-btn" onClick={reset}>Clear photo</button>}
      </section>
      <section className="result-card"><span className="eyebrow">PREDICTION RESULT</span>
        {loading ? <div className="empty-result"><div className="spinner" /><h2>Analysing your plant…</h2><p>The AI model is checking the leaf for diseases.</p></div>
        : result ? <div className={`result-content ${result.is_healthy ? 'healthy' : 'diseased'}`}>
            <div className="result-ring">{Math.round(result.confidence * 100)}%</div>
            <span className="crop-chip">{result.crop || 'Plant'}</span>
            <h2>{result.is_healthy ? 'Healthy' : result.disease}</h2>
            <p>{result.message}</p>
            {result.low_confidence && <div className="warn-box">Low confidence — retake the photo closer to a single leaf in good light.</div>}
            <div className="conf-block">
              <small>Top predictions</small>
              {result.top_predictions?.map((p) => <div className="conf-row" key={p.label}><span>{p.crop ? `${p.crop} – ` : ''}{p.disease}</span><div className="bar"><i style={{ width: pct(p.confidence) }} /></div><b>{pct(p.confidence)}</b></div>)}
            </div>
            {result.description && <p className="desc">{result.description}</p>}
            {result.treatment?.length > 0 && <div className="treatment"><small>{result.is_healthy ? 'Care tips' : 'Recommended actions'}</small><ul>{result.treatment.map((t) => <li key={t}>{t}</li>)}</ul></div>}
          </div>
        : <div className="empty-result"><div className="result-leaf"><Icon name="leaf" size={38} /></div><h2>Your result will appear here</h2><p>Upload a healthy, well-lit plant image for the best model input.</p></div>}
      </section>
    </div>
  </main>;
}

function Profile({ user, setUser }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user || {});
  const save = () => { setUser(draft); localStorage.setItem('agriverse_user', JSON.stringify(draft)); setEditing(false); };
  return <main className="page profile-page">
    <div className="section-heading"><div><span className="eyebrow">FARMER ACCOUNT</span><h1>My Profile</h1><p>Manage your farmer information and field details.</p></div><button className="outline-btn" onClick={() => setEditing(!editing)}><Icon name="edit" /> {editing ? 'Cancel' : 'Edit Profile'}</button></div>
    <section className="profile-card">
      <div className="profile-banner"><div className="profile-photo">{draft.photo ? <img src={draft.photo} alt="Profile" /> : (draft.name?.[0] || 'F')}</div><div><span className="eyebrow">FARMER ID</span><h2>{draft.farmerId || 'AGV-000000'}</h2><p>AgriVerse Farmer</p></div></div>
      <div className="profile-fields">
        <Field label="Name" value={draft.name} edit={editing} onChange={(v) => setDraft({ ...draft, name: v })} />
        <Field label="Contact Number" value={draft.contact} edit={editing} onChange={(v) => setDraft({ ...draft, contact: v })} />
        <Field label="Gmail" value={draft.email || ''} edit={editing} onChange={(v) => setDraft({ ...draft, email: v })} />
        <Field label="Field / Farm" value={draft.field || ''} edit={editing} onChange={(v) => setDraft({ ...draft, field: v })} placeholder="Add field details" />
      </div>
      {editing && <button className="primary-btn save-profile" onClick={save}>Save Changes <span>✓</span></button>}
    </section>
    <div className="settings-grid"><button><Icon name="settings" /><span><b>Settings</b><small>App and account preferences</small></span><strong>→</strong></button><button><Icon name="help" /><span><b>Help & Support</b><small>Get help using AgriVerse</small></span><strong>→</strong></button></div>
  </main>;
}
function Field({ label, value, edit, onChange, placeholder }) { return <label className="profile-field"><span>{label}</span>{edit ? <input value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /> : <strong>{value || 'Not added'}</strong>}</label>; }

function SimplePage({ type }) { return <main className="page"><div className="section-heading"><div><span className="eyebrow">AGRIVERSE</span><h1>{type === 'settings' ? 'Settings' : 'Help & Support'}</h1><p>{type === 'settings' ? 'Account and application preferences will be available here.' : 'Help articles and support options will be available here.'}</p></div></div><section className="placeholder-card">This section is ready for your next backend/API integration.</section></main>; }

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('agriverse_user') || 'null'));
  const [active, setActive] = useState('home');
  const logout = () => { localStorage.removeItem('agriverse_user'); setUser(null); setActive('home'); };
  if (!user) return <Auth onLogin={setUser} />;
  const content = active === 'home' ? <Home user={user} setActive={setActive} /> : active === 'predict' ? <Predict /> : active === 'profile' ? <Profile user={user} setUser={setUser} /> : <SimplePage type={active} />;
  return <div className="app-shell"><Header user={user} active={active} setActive={setActive} onLogout={logout} /><div className="mobile-nav">{[['home','Home'],['predict','Predict'],['profile','Profile']].map(([id,l]) => <button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}>{id==='home'?<Icon name="home"/>:id==='predict'?<Icon name="leaf"/>:<Icon name="user"/>}<span>{l}</span></button>)}</div>{content}</div>;
}

createRoot(document.getElementById('root')).render(<App />);
