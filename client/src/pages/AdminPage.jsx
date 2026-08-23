import { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  Clock3,
  Download,
  ExternalLink,
  Link2,
  LogOut,
  ArrowDown,
  ArrowUp,
  Plus,
  RefreshCw,
  Save,
  Share2,
  Trash2,
  Upload,
  UsersRound
} from 'lucide-react';
import { adminHeaders, api } from '../api';

const emptyGuest = {
  displayName: '',
  familyName: '',
  familyMembers: '',
  guestCount: 2,
  phone: '',
  email: '',
  notes: ''
};

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('wedding_admin_token') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [invitees, setInvitees] = useState([]);
  const [dirty, setDirty] = useState({});
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(emptyGuest);
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('invitees');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState('');

  async function login(e) {
    e.preventDefault();
    setLoginError('');
    try {
      const result = await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      localStorage.setItem('wedding_admin_token', result.token);
      setToken(result.token);
      setPassword('');
    } catch (err) {
      setLoginError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem('wedding_admin_token');
    setToken('');
    setInvitees([]);
    setStats(null);
    setSettings(null);
    setDirty({});
  }

  async function loadStats() {
    const statData = await api('/api/admin/stats', { headers: adminHeaders() });
    setStats(statData);
  }

  async function loadAdmin() {
    try {
      const headers = adminHeaders();
      const [guestData, statData, settingData] = await Promise.all([
        api('/api/admin/invitees', { headers }),
        api('/api/admin/stats', { headers }),
        api('/api/admin/settings', { headers })
      ]);
      setInvitees(guestData);
      setStats(statData);
      setSettings(settingData);
      setDirty({});
    } catch (err) {
      if (err.message === 'Unauthorized') logout();
      else setNotice(err.message);
    }
  }

  useEffect(() => {
    if (token) loadAdmin();
  }, [token]);

  async function addInvitee(e) {
    e.preventDefault();
    try {
      const result = await api('/api/admin/invitees', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ ...form, guestCount: Number(form.guestCount) })
      });
      setInvitees((current) => [result, ...current]);
      setForm(emptyGuest);
      setNotice(`Invitation created for ${result.displayName}.`);
      await loadStats();
    } catch (err) {
      setNotice(err.message);
    }
  }

  function editInvitee(id, patch) {
    setInvitees((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
    setDirty((current) => ({ ...current, [id]: true }));
  }

  async function saveInvitee(guest) {
    setBusyId(guest.id);
    try {
      const result = await api(`/api/admin/invitees/${guest.id}`, {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({
          displayName: guest.displayName,
          familyName: guest.familyName || '',
          familyMembers: guest.familyMembers || '',
          guestCount: Number(guest.guestCount),
          phone: guest.phone || '',
          email: guest.email || '',
          notes: guest.notes || ''
        })
      });
      setInvitees((items) => items.map((item) => item.id === guest.id ? result : item));
      setDirty((current) => ({ ...current, [guest.id]: false }));
      setNotice(`Changes saved for ${result.displayName}. The invitation will use the updated CSV values.`);
      await loadStats();
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusyId('');
    }
  }

  async function removeInvitee(id) {
    if (!window.confirm('Delete this invitation and its RSVP record?')) return;
    try {
      await api(`/api/admin/invitees/${id}`, {
        method: 'DELETE',
        headers: adminHeaders()
      });
      setInvitees((current) => current.filter((item) => item.id !== id));
      setDirty((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setNotice('Invitation deleted.');
      await loadStats();
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function regenerate(id) {
    if (!window.confirm('Regenerate the private invitation link? The old link will stop working.')) return;
    try {
      const result = await api(`/api/admin/invitees/${id}/regenerate-link`, {
        method: 'POST',
        headers: adminHeaders()
      });
      setInvitees((current) => current.map((item) => item.id === id ? result : item));
      setNotice('Private link regenerated.');
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      setNotice('Invitation link copied to clipboard.');
    } catch (_) {
      setNotice('Could not access the clipboard. Please copy the link manually.');
    }
  }

  async function shareLink(guest) {
    const text = `Wedding invitation for ${guest.displayName}: ${guest.inviteLink}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Wedding Invitation', text, url: guest.inviteLink });
        return;
      } catch (_) {
        // Fall back to WhatsApp when native sharing is cancelled or unavailable.
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  async function saveSettings(e) {
    e.preventDefault();
    try {
      const result = await api('/api/admin/settings', {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify(settings)
      });
      setSettings(result);
      setNotice('Wedding details saved. New invitation loads will show these changes immediately.');
    } catch (err) {
      setNotice(err.message);
    }
  }

  function prepareImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const scale = Math.min(1, 1400 / image.width, 1400 / image.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        image.onerror = () => reject(new Error(`Could not read ${file.name}.`));
        image.src = reader.result;
      };
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }

  async function uploadGalleryImages(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    try {
      let nextSettings = settings;
      for (const file of files) {
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
        const image = await prepareImage(file);
        nextSettings = await api('/api/admin/gallery', {
          method: 'POST',
          headers: adminHeaders(),
          body: JSON.stringify({ image })
        });
      }
      setSettings(nextSettings);
      setNotice(`${files.length} gallery image${files.length === 1 ? '' : 's'} uploaded.`);
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function removeGalleryImage(index) {
    try {
      const gallery = (settings.gallery || []).filter((_, itemIndex) => itemIndex !== index);
      const result = await api('/api/admin/settings', {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ gallery })
      });
      setSettings(result);
      setNotice('Gallery image removed.');
    } catch (err) {
      setNotice(err.message);
    }
  }

  function updateProgramItem(index, patch) {
    const events = [...(settings.events || [])];
    events[index] = { ...events[index], ...patch };
    setSettings({ ...settings, events });
  }

  function addProgramItem() {
    setSettings({
      ...settings,
      events: [...(settings.events || []), { time: '', title: '', description: '' }]
    });
  }

  function removeProgramItem(index) {
    setSettings({
      ...settings,
      events: (settings.events || []).filter((_, itemIndex) => itemIndex !== index)
    });
  }

  function moveProgramItem(index, direction) {
    const events = [...(settings.events || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= events.length) return;
    [events[index], events[targetIndex]] = [events[targetIndex], events[index]];
    setSettings({ ...settings, events });
  }

  async function downloadCsv(type) {
    try {
      const response = await fetch(`/api/admin/export/${type}.csv`, {
        cache: 'no-store',
        headers: adminHeaders()
      });
      if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error(`Unable to download ${type}.csv`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${type}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setNotice(err.message);
    }
  }

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return invitees.filter((item) => (
      `${item.displayName} ${item.familyName} ${item.familyMembers} ${item.phone} ${item.email}`
        .toLowerCase()
        .includes(normalized)
    ));
  }, [invitees, query]);

  if (!token) {
    return (
      <main className="admin-login-page">
        <form className="admin-login-card" onSubmit={login}>
          <div className="admin-logo">T <span>&</span> S</div>
          <h1>Wedding Admin</h1>
          <p>Manage invitees, reserved family counts, private links and wedding details.</p>
          <label>
            <span>Admin password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button className="primary-button">Sign In</button>
          {loginError && <p className="form-notice error">{loginError}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div><div className="admin-logo">T <span>&</span> S</div><small>Wedding Console</small></div>
        <nav>
          <button type="button" className={tab === 'invitees' ? 'active' : ''} onClick={() => setTab('invitees')}><UsersRound size={18} /> Invitees</button>
          <button type="button" className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}><Save size={18} /> Wedding Details</button>
        </nav>
        <button type="button" className="logout-button" onClick={logout}><LogOut size={18} /> Sign out</button>
      </aside>

      <section className="admin-content">
        <header className="admin-header">
          <div>
            <p>ADMINISTRATION</p>
            <h1>{tab === 'invitees' ? 'Invitee Management' : 'Wedding Details'}</h1>
          </div>
          <button type="button" className="icon-button" onClick={loadAdmin} title="Reload data from CSV"><RefreshCw size={18} /></button>
        </header>

        {notice && <div className="admin-notice">{notice}<button type="button" onClick={() => setNotice('')}>×</button></div>}

        {tab === 'invitees' && (
          <>
            {stats && <div className="stat-grid">
              <div><span>Invitations</span><strong>{stats.totalInvitations}</strong></div>
              <div><span>Total seats</span><strong>{stats.totalSeats}</strong></div>
              <div><span>Attending</span><strong>{stats.attendingSeats}</strong></div>
              <div><span>Pending</span><strong>{stats.pendingSeats}</strong></div>
            </div>}

            <div className="admin-panel csv-storage-panel">
              <div>
                <strong>CSV Storage</strong>
                <p>Invitee details and RSVP responses are stored separately. Admin changes write directly to the CSV files.</p>
              </div>
              <div className="csv-actions">
                <button type="button" className="outline-admin-button" onClick={() => downloadCsv('invitees')}><Download size={16} /> Invitees CSV</button>
                <button type="button" className="outline-admin-button" onClick={() => downloadCsv('rsvp-details')}><Download size={16} /> RSVP Details CSV</button>
              </div>
            </div>

            <form className="admin-panel invitee-form" onSubmit={addInvitee}>
              <div className="panel-title">
                <div><Plus size={18} /><h2>Add Invitee / Family</h2></div>
                <p>The reserved guest count is controlled by admin and is read-only on the public invitation.</p>
              </div>
              <div className="form-grid">
                <label><span>Invitee display name *</span><input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Mr. & Mrs. Silva and Family" required /></label>
                <label><span>Family / group name</span><input value={form.familyName} onChange={(e) => setForm({ ...form, familyName: e.target.value })} placeholder="Silva Family" /></label>
                <label><span>Family members</span><input value={form.familyMembers} onChange={(e) => setForm({ ...form, familyMembers: e.target.value })} placeholder="Nimal, Kumari, Dineth..." /></label>
                <label><span>Reserved guest count *</span><input type="number" min="1" max="20" value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} required /></label>
                <label><span>Phone</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+94 77 ..." /></label>
                <label><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
                <label className="full"><span>Admin notes</span><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
              </div>
              <button className="primary-button"><Plus size={17} /> Create Invitation</button>
            </form>

            <div className="admin-panel">
              <div className="guest-toolbar">
                <div><h2>Invitation List</h2><p>{invitees.length} private invitation links</p></div>
                <input className="search-input" placeholder="Search invitees..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="guest-table-wrap">
                <table className="guest-table">
                  <thead><tr><th>Invitee / family</th><th>Seats</th><th>RSVP</th><th>Contact / notes</th><th>Private link</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.map((guest) => (
                      <tr key={guest.id} className={dirty[guest.id] ? 'dirty-row' : ''}>
                        <td>
                          <input className="table-input name" value={guest.displayName} onChange={(e) => editInvitee(guest.id, { displayName: e.target.value })} />
                          <input className="table-input sub" value={guest.familyName || ''} placeholder="Family/group" onChange={(e) => editInvitee(guest.id, { familyName: e.target.value })} />
                          <input className="table-input sub members" value={guest.familyMembers || ''} placeholder="Family members" onChange={(e) => editInvitee(guest.id, { familyMembers: e.target.value })} />
                          {dirty[guest.id] && <small className="unsaved-label">Unsaved changes</small>}
                        </td>
                        <td>
                          <input className="table-input seats" type="number" min="1" max="20" value={guest.guestCount} onChange={(e) => editInvitee(guest.id, { guestCount: e.target.value })} />
                        </td>
                        <td>
                          <span className={`status-pill ${(guest.rsvpStatus || 'Pending').toLowerCase()}`}>{guest.rsvpStatus || 'Pending'}</span>
                          {guest.rsvpMessage && <small className="rsvp-note">“{guest.rsvpMessage}”</small>}
                        </td>
                        <td>
                          <input className="table-input contact" value={guest.phone || ''} placeholder="Phone" onChange={(e) => editInvitee(guest.id, { phone: e.target.value })} />
                          <input className="table-input contact" value={guest.email || ''} placeholder="Email" onChange={(e) => editInvitee(guest.id, { email: e.target.value })} />
                          <input className="table-input contact notes" value={guest.notes || ''} placeholder="Admin notes" onChange={(e) => editInvitee(guest.id, { notes: e.target.value })} />
                        </td>
                        <td>
                          <div className="link-actions">
                            <button type="button" title="Copy link" onClick={() => copyLink(guest.inviteLink)}><Copy size={16} /></button>
                            <button type="button" title="Share invitation" onClick={() => shareLink(guest)}><Share2 size={16} /></button>
                            <a title="Open invitation" href={guest.inviteLink} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a>
                            <button type="button" title="Regenerate link" onClick={() => regenerate(guest.id)}><Link2 size={16} /></button>
                          </div>
                          <small className="token-preview">…{guest.token.slice(-10)}</small>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="save-row-button"
                              title="Save changes"
                              disabled={!dirty[guest.id] || busyId === guest.id}
                              onClick={() => saveInvitee(guest)}
                            >
                              <Save size={16} /> {busyId === guest.id ? 'Saving' : 'Save'}
                            </button>
                            <button type="button" className="danger-icon" title="Delete" onClick={() => removeInvitee(guest.id)}><Trash2 size={17} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'settings' && settings && (
          <>
            <div className="admin-panel programme-panel">
              <div className="panel-title">
                <div><Clock3 size={18} /><h2>Wedding Programme</h2></div>
                <p>Add the ceremony and reception schedule shown on the invitation.</p>
              </div>
              <div className="programme-list">
                {(settings.events || []).map((event, index) => (
                  <div className="programme-row" key={`programme-${index}`}>
                    <div className="programme-order">
                      <button type="button" title="Move up" disabled={index === 0} onClick={() => moveProgramItem(index, -1)}><ArrowUp size={15} /></button>
                      <span>{index + 1}</span>
                      <button type="button" title="Move down" disabled={index === (settings.events || []).length - 1} onClick={() => moveProgramItem(index, 1)}><ArrowDown size={15} /></button>
                    </div>
                    <label><span>Time</span><input value={event.time || ''} placeholder="10:00 AM" onChange={(e) => updateProgramItem(index, { time: e.target.value })} /></label>
                    <label><span>Programme item</span><input value={event.title || ''} placeholder="Poruwa Ceremony" onChange={(e) => updateProgramItem(index, { title: e.target.value })} /></label>
                    <label className="programme-description"><span>Description</span><input value={event.description || ''} placeholder="Traditional wedding ceremony" onChange={(e) => updateProgramItem(index, { description: e.target.value })} /></label>
                    <button type="button" className="danger-icon" title="Remove programme item" onClick={() => removeProgramItem(index)}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <button type="button" className="outline-admin-button" onClick={addProgramItem}><Plus size={16} /> Add Programme Item</button>
              <p className="programme-save-note">Save Wedding Details below to publish programme changes.</p>
            </div>

            <div className="admin-panel gallery-upload-panel">
              <div className="panel-title">
                <div><Upload size={18} /><h2>Invitation Gallery</h2></div>
                <p>Upload JPG, PNG or WebP images. They appear on the invitation after upload.</p>
              </div>
              <label className="upload-control">
                <span>Select images</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadGalleryImages} />
              </label>
              {!!settings.gallery?.length && <div className="gallery-upload-list">
                {settings.gallery.map((src, index) => (
                  <div className="gallery-upload-item" key={`${src.slice(0, 30)}-${index}`}>
                    <img src={src} alt={`Gallery preview ${index + 1}`} />
                    <button type="button" className="danger-icon" title="Remove image" onClick={() => removeGalleryImage(index)}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>}
            </div>

            <form className="admin-panel settings-form" onSubmit={saveSettings}>
              <div className="panel-title">
                <div><Save size={18} /><h2>Wedding & Venue Configuration</h2></div>
                <p>These values are stored in settings and are loaded by every invitation.</p>
              </div>
              <div className="form-grid two">
                {[
                ['coupleNames', 'Couple display names'],
                ['groomName', 'Groom full name'],
                ['brideName', 'Bride full name'],
                ['weddingDate', 'Wedding date/time'],
                ['venueName', 'Venue name'],
                ['venueAddress', 'Venue address'],
                ['mapQuery', 'Google Maps search query'],
                ['dressCode', 'Dress code'],
                ['groomParents', "Groom's parents"],
                ['brideParents', "Bride's parents"],
                ['contactOne', 'Contact number 1'],
                ['contactTwo', 'Contact number 2']
                ].map(([key, label]) => (
                  <label key={key}>
                    <span>{label}</span>
                    <input value={settings[key] || ''} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} />
                  </label>
                ))}
                <label className="full"><span>Landing message</span><textarea rows="3" value={settings.landingMessage || ''} onChange={(e) => setSettings({ ...settings, landingMessage: e.target.value })} /></label>
                <label className="full"><span>Opening line</span><textarea rows="3" value={settings.openingLine || ''} onChange={(e) => setSettings({ ...settings, openingLine: e.target.value })} /></label>
              </div>
              <button className="primary-button"><Save size={17} /> Save Wedding Details</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
