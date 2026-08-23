import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock3, MapPin, Phone, UsersRound } from 'lucide-react';
import { api } from '../api';
import FlipCountdown from '../components/FlipCountdown';
import LoadingScreen from '../components/LoadingScreen';
import SectionTitle from '../components/SectionTitle';

export default function InvitationPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [attending, setAttending] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let active = true;

    const loadInvitation = () => {
      api(`/api/invitations/${token}`)
        .then((result) => {
          if (!active) return;
          setData(result);
          setError('');
          if (result.rsvpStatus === 'Attending') setAttending(true);
          else if (result.rsvpStatus === 'Declined') setAttending(false);
          else setAttending(null);
          setMessage(result.rsvpMessage || '');
        })
        .catch((err) => {
          if (active) setError(err.message);
        });
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadInvitation();
    };

    loadInvitation();
    window.addEventListener('focus', loadInvitation);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      active = false;
      window.removeEventListener('focus', loadInvitation);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [token]);

  const dateParts = useMemo(() => {
    if (!data) return null;
    const date = new Date(data.settings.weddingDate);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Colombo' }),
      full: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Colombo' })
    };
  }, [data]);

  async function submitRsvp(e) {
    e.preventDefault();
    if (attending === null) {
      setNotice('Please select your attendance response.');
      return;
    }
    setSubmitting(true);
    setNotice('');
    try {
      const result = await api(`/api/invitations/${token}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({ attending, message })
      });
      setNotice(result.message);
      setData((current) => ({ ...current, rsvpStatus: result.rsvpStatus, rsvpMessage: message }));
    } catch (err) {
      setNotice(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) return <div className="not-found"><h1>Invitation unavailable</h1><p>{error}</p></div>;
  if (!data) return <LoadingScreen />;

  const { settings } = data;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(settings.mapQuery || settings.venueAddress)}&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.mapQuery || settings.venueAddress)}`;

  return (
    <main className="invitation-page">
      <nav className="invite-nav">
        <a href="#home" className="brand-script">{settings.coupleNames}</a>
        <div>
          <a href="#story">Details</a>
          <a href="#gallery">Gallery</a>
          <a href="#location">Location</a>
          <a href="#rsvp">RSVP</a>
        </div>
      </nav>

      <section id="home" className="invite-hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-kicker">WITH THE BLESSINGS OF OUR FAMILIES</p>
          <h1>{settings.coupleNames}</h1>
          <p className="personal-greeting">{data.displayName}, we would be honoured by your presence.</p>
          <div className="hero-date-row">
            <span>{dateParts.day}</span><strong>{dateParts.full}</strong><span>{dateParts.time}</span>
          </div>
          <a className="outline-button" href="#rsvp">RSVP</a>
        </div>
      </section>

      <section className="countdown-section">
        <p className="script-line">Until we say “I do”</p>
        <FlipCountdown targetDate={settings.weddingDate} />
      </section>

      <section id="story" className="paper-section details-section">
        <SectionTitle eyebrow="OUR CELEBRATION" title="You are warmly invited" subtitle={settings.openingLine} />
        <div className="details-grid">
          <div className="detail-card"><CalendarDays /><h3>{dateParts.full}</h3><p>{dateParts.time}</p></div>
          <div className="detail-card"><MapPin /><h3>{settings.venueName}</h3><p>{settings.venueAddress}</p></div>
          <div className="detail-card highlight"><UsersRound /><h3>{data.guestCount} Reserved {data.guestCount === 1 ? 'Seat' : 'Seats'}</h3><p>{data.familyMembers ? data.familyMembers : 'Your invitation is reserved for the family count shown here.'}</p></div>
        </div>

        <div className="family-panel">
          <div><span>GROOM'S FAMILY</span><h3>{settings.groomName}</h3><p>Son of {settings.groomParents}</p></div>
          <div className="family-monogram">&</div>
          <div><span>BRIDE'S FAMILY</span><h3>{settings.brideName}</h3><p>Daughter of {settings.brideParents}</p></div>
        </div>

        <div className="schedule-wrap">
          <SectionTitle eyebrow="ON THE DAY" title="Wedding Programme" />
          <div className="schedule-list">
            {(settings.events || []).map((event, index) => (
              <div className="schedule-item" key={`${event.time}-${index}`}>
                <div className="schedule-time"><Clock3 size={18} />{event.time}</div>
                <div><h3>{event.title}</h3><p>{event.description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="gallery-section">
        <SectionTitle eyebrow="MEMORIES" title="Our Gallery" subtitle="A few moments from our journey. Replace these demo images with your own photographs." />
        <div className="gallery-grid">
          {(settings.gallery || []).map((src, index) => (
            <button className={`gallery-item gallery-item-${index + 1}`} key={src} onClick={() => setLightbox(src)}>
              <img src={src} alt={`Wedding gallery ${index + 1}`} />
            </button>
          ))}
        </div>
      </section>

      <section id="location" className="paper-section location-section">
        <SectionTitle eyebrow="THE VENUE" title={settings.venueName} subtitle={settings.venueAddress} />
        <div className="map-card">
          <iframe title="Wedding venue map" src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <div className="map-footer">
            <div><MapPin /><span>{settings.venueAddress}</span></div>
            <a href={mapLink} target="_blank" rel="noreferrer" className="primary-button small">Open in Maps</a>
          </div>
        </div>
      </section>

      <section id="rsvp" className="rsvp-section">
        <div className="rsvp-card">
          <SectionTitle eyebrow="KINDLY RESPOND" title="RSVP" subtitle={`This invitation is reserved for ${data.guestCount} ${data.guestCount === 1 ? 'guest' : 'guests'}. The guest count cannot be changed.`} />
          {data.familyMembers && <div className="family-members-box"><span>Invited family members</span><strong>{data.familyMembers}</strong></div>}
          <form onSubmit={submitRsvp}>
            <div className="attendance-options">
              <button type="button" className={attending === true ? 'selected' : ''} onClick={() => setAttending(true)}><CheckCircle2 /> Joyfully Accept</button>
              <button type="button" className={attending === false ? 'selected' : ''} onClick={() => setAttending(false)}>Regretfully Decline</button>
            </div>
            <label className="locked-count">
              <span>Reserved guest count</span>
              <input value={data.guestCount} readOnly aria-readonly="true" />
            </label>
            <label>
              <span>Message to the couple (optional)</span>
              <textarea rows="4" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} placeholder="Share your wishes..." />
            </label>
            <button className="primary-button" disabled={submitting}>{submitting ? 'Saving...' : 'Send RSVP'}</button>
            {notice && <p className="form-notice">{notice}</p>}
          </form>
          <div className="contact-line"><Phone size={16} /> {settings.contactOne} &nbsp; · &nbsp; {settings.contactTwo}</div>
        </div>
      </section>

      <footer className="invite-footer">
        <span className="brand-script">{settings.coupleNames}</span>
        <p>With love and gratitude · Sri Lanka</p>
      </footer>

      {lightbox && (
        <button className="lightbox" onClick={() => setLightbox(null)} aria-label="Close gallery image">
          <img src={lightbox} alt="Gallery enlarged" />
        </button>
      )}
    </main>
  );
}
