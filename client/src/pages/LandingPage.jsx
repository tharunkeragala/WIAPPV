import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Heart, MapPin, Users } from 'lucide-react';
import { api } from '../api';
import LoadingScreen from '../components/LoadingScreen';

export default function LandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadInvitation = () => {
      api(`/api/invitations/${token}`)
        .then((result) => {
          if (!active) return;
          setData(result);
          setError('');
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

  if (error) return <div className="not-found"><h1>Invitation unavailable</h1><p>{error}</p></div>;
  if (!data) return <LoadingScreen />;

  const { settings } = data;
  const weddingDate = new Date(settings.weddingDate);
  const formattedDate = weddingDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Colombo'
  });
  const formattedTime = weddingDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Colombo'
  });

  return (
    <main className="landing-page landing-mobile-hero">
      <div className="landing-background-image">
        <img src="/images/gallery-1.jpg" alt="Wedding couple" />
      </div>
      <div className="landing-tint" />
      <div className="landing-overlay" />
      <div className="landing-glow" />

      <svg className="landing-leaf landing-leaf-tl" viewBox="0 0 120 160" aria-hidden="true">
        <path d="M4 8C44 24 66 58 60 100C56 128 34 148 8 154" />
        <path d="M14 34C34 42 46 60 44 82" />
        <path d="M20 66C36 70 46 84 44 100" />
      </svg>
      <svg className="landing-leaf landing-leaf-br" viewBox="0 0 120 160" aria-hidden="true">
        <path d="M116 152C76 136 54 102 60 60C64 32 86 12 112 6" />
        <path d="M106 126C86 118 74 100 76 78" />
        <path d="M100 94C84 90 74 76 76 60" />
      </svg>

      <section className="landing-card landing-card-overlay">
        <div className="landing-copy landing-copy-overlay">
          <p className="landing-kicker">Wedding Day</p>
          <div className="mini-ornament light"><span /> <Heart size={14} fill="currentColor" /> <span /></div>

          <h1>{settings.coupleNames}</h1>
          <p className="landing-subtitle">Together with their families, warmly invite you to celebrate their wedding.</p>

          <div className="landing-date-panel">
            <span className="landing-panel-label">The Reception</span>
            <strong>{formattedDate}</strong>
            <small>{formattedTime} · {settings.venueName}</small>
          </div>

          <div className="landing-invitee-panel">
            <p className="dear-line">Dear</p>
            <h2>{data.displayName}</h2>
            <div className="landing-meta-list">
              <div>
                <Users size={15} />
                <span>{data.guestCount} Reserved {data.guestCount === 1 ? 'Seat' : 'Seats'}</span>
              </div>
              <div>
                <MapPin size={15} />
                <span>{settings.venueName}, Sri Lanka</span>
              </div>
            </div>
          </div>

          <p className="landing-message overlay-message">{settings.landingMessage}</p>

          <button onClick={() => navigate(`/i/${token}/invitation`)} className="primary-button landing-open-button">
            Open Invitation <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </main>
  );
}