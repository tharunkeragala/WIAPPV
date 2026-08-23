import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Heart, MapPin, Users } from "lucide-react";
import { api } from "../api";
import LoadingScreen from "../components/LoadingScreen";

export default function LandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadInvitation = () => {
      api(`/api/invitations/${token}`)
        .then((result) => {
          if (!active) return;

          setData(result);
          setError("");
        })
        .catch((err) => {
          if (active) {
            setError(err.message);
          }
        });
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        loadInvitation();
      }
    };

    loadInvitation();

    window.addEventListener("focus", loadInvitation);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;

      window.removeEventListener("focus", loadInvitation);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [token]);

  if (error) {
    return (
      <>
        <div className="not-found">
          <div className="not-found-card">
            <div className="not-found-heart">
              <Heart size={22} />
            </div>

            <h1>Invitation unavailable</h1>
            <p>{error}</p>
          </div>
        </div>

        <style>{`
          .not-found {
            min-height: 100svh;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;

            background:
              radial-gradient(
                circle at top right,
                rgba(86, 127, 94, 0.25),
                transparent 35%
              ),
              #183d2b;

            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .not-found-card {
            width: min(100%, 420px);
            padding: 40px 25px;
            text-align: center;

            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-radius: 8px;

            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25);
          }

          .not-found-heart {
            width: 48px;
            height: 48px;
            margin: 0 auto 18px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 50%;
            color: #3d704f;
            background: #edf3ed;
          }

          .not-found-card h1 {
            margin: 0 0 10px;

            font-family:
              Georgia,
              "Times New Roman",
              serif;

            font-size: 28px;
            font-weight: 400;
            color: #183d2b;
          }

          .not-found-card p {
            margin: 0;
            color: #68766c;
            font-size: 13px;
            line-height: 1.6;
          }
        `}</style>
      </>
    );
  }

  if (!data) {
    return <LoadingScreen />;
  }

  const { settings } = data;

  const weddingDate = new Date(settings.weddingDate);

  const formattedDate = weddingDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Colombo",
  });

  const formattedTime = weddingDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Colombo",
  });

  return (
    <>
      <main className="landing-page landing-mobile-hero">
        {/* Background Image */}
        <div className="landing-background-image">
          <img src="/images/gallery-1.jpg" alt="Wedding couple" />
        </div>

        {/* Dark Green Overlay */}
        <div className="landing-overlay" />

        {/* Decorative Glow */}
        <div className="landing-glow landing-glow-one" />
        <div className="landing-glow landing-glow-two" />

        {/* Main Invitation Card */}
        <section className="landing-card landing-card-overlay">
          <div className="landing-copy landing-copy-overlay">
            {/* Kicker */}
            <p className="landing-kicker">Wedding Day</p>

            {/* Ornament */}
            <div className="mini-ornament light">
              <span />
              <Heart size={14} fill="currentColor" />
              <span />
            </div>

            {/* Couple Names */}
            <h1>{settings.coupleNames}</h1>

            {/* Introduction */}
            <p className="landing-subtitle">
              Together with their families, warmly invite you to celebrate their
              wedding.
            </p>

            {/* Date / Reception */}
            <div className="landing-date-panel">
              <span className="landing-panel-label">The Reception</span>

              <strong>{formattedDate}</strong>

              <small>
                {formattedTime}
                <span className="date-separator"> · </span>
                {settings.venueName}
              </small>
            </div>

            {/* Guest Information */}
            <div className="landing-invitee-panel">
              <p className="dear-line">Dear</p>

              <h2>{data.displayName}</h2>

              <div className="landing-meta-list">
                <div>
                  <Users size={15} />

                  <span>
                    {data.guestCount} Reserved{" "}
                    {data.guestCount === 1 ? "Seat" : "Seats"}
                  </span>
                </div>

                <div>
                  <MapPin size={15} />

                  <span>{settings.venueName}, Sri Lanka</span>
                </div>
              </div>
            </div>

            {/* Personal Message */}
            <p className="landing-message overlay-message">
              {settings.landingMessage}
            </p>

            {/* Open Invitation */}
            <button
              type="button"
              onClick={() => navigate(`/i/${token}/invitation`)}
              className="primary-button landing-open-button"
            >
              <span>Open Invitation</span>

              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      {/* =====================================================
          RESPONSIVE LANDING PAGE STYLES
          ===================================================== */}

      <style>{`

        /* =====================================================
           VARIABLES
           ===================================================== */

        :root {
          --landing-green-dark: #143b28;
          --landing-green-deep: #183d2b;
          --landing-green: #2f6747;
          --landing-green-light: #6f9878;

          --landing-sage: #a9bca9;
          --landing-cream: #f8f6ef;

          --landing-gold: #c9aa6a;

          --landing-white: #ffffff;
        }


        /* =====================================================
           RESET
           ===================================================== */

        .landing-page,
        .landing-page * {
          box-sizing: border-box;
        }


        /* =====================================================
           MAIN PAGE
           ===================================================== */

        .landing-page {
          position: relative;

          width: 100%;
          min-height: 100svh;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 16px 12px;

          overflow: hidden;

          background: var(--landing-green-deep);

          isolation: isolate;
        }


        /* =====================================================
           BACKGROUND IMAGE
           ===================================================== */

        .landing-background-image {
          position: absolute;
          inset: 0;

          z-index: -4;

          overflow: hidden;
        }

        .landing-background-image img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;

          object-position: center center;

          transform: scale(1.04);

          filter:
            saturate(0.72)
            contrast(1.04)
            brightness(0.90);
        }


        /* =====================================================
           GREEN OVERLAY
           ===================================================== */

        .landing-overlay {
          position: absolute;
          inset: 0;

          z-index: -3;

          background:
            linear-gradient(
              180deg,
              rgba(12, 42, 27, 0.48) 0%,
              rgba(18, 55, 35, 0.35) 35%,
              rgba(10, 34, 23, 0.78) 100%
            );
        }


        /* =====================================================
           DECORATIVE GLOW
           ===================================================== */

        .landing-glow {
          position: absolute;

          width: 300px;
          height: 300px;

          border-radius: 50%;

          pointer-events: none;

          z-index: -2;

          filter: blur(70px);
        }

        .landing-glow-one {
          top: -150px;
          right: -120px;

          background:
            rgba(117, 161, 126, 0.28);
        }

        .landing-glow-two {
          bottom: -180px;
          left: -150px;

          background:
            rgba(65, 111, 78, 0.24);
        }


        /* =====================================================
           MAIN CARD
           ===================================================== */

        .landing-card {
          position: relative;

          width: min(100%, 520px);

          margin: auto;
        }

        .landing-card-overlay {
          padding: 27px 17px;

          border-radius: 7px;

          border:
            1px solid
            rgba(255, 255, 255, 0.27);

          background:
            rgba(19, 51, 34, 0.72);

          backdrop-filter: blur(17px);
          -webkit-backdrop-filter: blur(17px);

          box-shadow:
            0 25px 70px
            rgba(0, 0, 0, 0.28),

            inset 0 1px 0
            rgba(255, 255, 255, 0.15);

          overflow: hidden;
        }


        /* Inner border */

        .landing-card-overlay::before {
          content: "";

          position: absolute;

          inset: 8px;

          border:
            1px solid
            rgba(255, 255, 255, 0.12);

          border-radius: 4px;

          pointer-events: none;
        }


        /* =====================================================
           CONTENT
           ===================================================== */

        .landing-copy {
          position: relative;

          z-index: 2;

          width: 100%;

          text-align: center;

          color: var(--landing-white);
        }


        /* =====================================================
           KICKER
           ===================================================== */

        .landing-kicker {
          margin: 0;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size: 10px;

          line-height: 1.4;

          letter-spacing: 0.30em;

          text-transform: uppercase;

          color:
            rgba(230, 238, 228, 0.88);
        }


        /* =====================================================
           ORNAMENT
           ===================================================== */

        .mini-ornament {
          display: flex;

          align-items: center;
          justify-content: center;

          gap: 9px;

          margin:
            12px
            0
            14px;

          color:
            var(--landing-gold);
        }

        .mini-ornament span {
          width: 34px;
          height: 1px;

          display: block;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(201, 170, 106, 0.85)
            );
        }

        .mini-ornament span:last-child {
          background:
            linear-gradient(
              90deg,
              rgba(201, 170, 106, 0.85),
              transparent
            );
        }


        /* =====================================================
           COUPLE NAMES
           ===================================================== */

        .landing-copy h1 {
          margin: 0 auto;

          max-width: 100%;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            clamp(
              32px,
              10vw,
              56px
            );

          font-weight: 400;

          line-height: 1.05;

          letter-spacing: -0.025em;

          color:
            #fffdf6;

          text-wrap: balance;

          text-shadow:
            0 3px 20px
            rgba(0, 0, 0, 0.28);
        }


        /* =====================================================
           SUBTITLE
           ===================================================== */

        .landing-subtitle {
          width: min(100%, 370px);

          margin:
            12px
            auto
            19px;

          font-size: 12px;

          line-height: 1.7;

          font-weight: 400;

          color:
            rgba(255, 255, 255, 0.82);
        }


        /* =====================================================
           DATE PANEL
           ===================================================== */

        .landing-date-panel {
          width: 100%;

          padding:
            14px
            12px;

          margin:
            0
            auto
            11px;

          border-radius: 5px;

          border:
            1px solid
            rgba(255, 255, 255, 0.17);

          background:
            rgba(255, 255, 255, 0.07);

          box-shadow:
            inset 0 1px 0
            rgba(255, 255, 255, 0.06);
        }

        .landing-panel-label {
          display: block;

          margin-bottom: 6px;

          font-size: 8px;

          line-height: 1.4;

          letter-spacing: 0.25em;

          text-transform: uppercase;

          color:
            #cfddcf;
        }

        .landing-date-panel strong {
          display: block;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size: 19px;

          line-height: 1.25;

          font-weight: 400;

          color: #ffffff;
        }

        .landing-date-panel small {
          display: block;

          margin-top: 5px;

          font-size: 10px;

          line-height: 1.5;

          color:
            rgba(255, 255, 255, 0.70);
        }

        .date-separator {
          opacity: 0.5;
        }


        /* =====================================================
           INVITEE CARD
           ===================================================== */

        .landing-invitee-panel {
          width: 100%;

          padding:
            17px
            13px;

          margin-bottom: 13px;

          border-radius: 5px;

          border:
            1px solid
            rgba(255, 255, 255, 0.40);

          background:
            rgba(249, 248, 241, 0.97);

          color:
            var(--landing-green-deep);

          box-shadow:
            0 12px 35px
            rgba(0, 0, 0, 0.13);
        }

        .dear-line {
          margin:
            0
            0
            3px;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size: 11px;

          font-style: italic;

          color:
            #718075;
        }

        .landing-invitee-panel h2 {
          margin:
            0
            0
            11px;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size:
            clamp(
              22px,
              6vw,
              30px
            );

          font-weight: 500;

          line-height: 1.15;

          color:
            var(--landing-green-deep);

          overflow-wrap: anywhere;
        }


        /* =====================================================
           GUEST META
           ===================================================== */

        .landing-meta-list {
          display: flex;

          flex-direction: column;

          gap: 7px;

          padding-top: 10px;

          border-top:
            1px solid
            rgba(24, 61, 43, 0.12);
        }

        .landing-meta-list > div {
          display: flex;

          align-items: center;
          justify-content: center;

          gap: 7px;

          font-size: 9px;

          line-height: 1.4;

          color:
            #637067;
        }

        .landing-meta-list svg {
          flex:
            0 0 auto;

          color:
            var(--landing-green);
        }


        /* =====================================================
           PERSONAL MESSAGE
           ===================================================== */

        .landing-message {
          width: min(100%, 390px);

          margin:
            0
            auto
            17px;

          font-family:
            Georgia,
            "Times New Roman",
            serif;

          font-size: 11px;

          line-height: 1.65;

          font-style: italic;

          color:
            rgba(255, 255, 255, 0.77);
        }


        /* =====================================================
           OPEN INVITATION BUTTON
           ===================================================== */

        .landing-open-button {
          width: 100%;

          min-height: 51px;

          display: flex;

          align-items: center;
          justify-content: center;

          gap: 10px;

          padding:
            12px
            18px;

          border: 1px solid
            rgba(220, 238, 222, 0.30);

          border-radius: 5px;

          background:
            linear-gradient(
              135deg,
              #417957 0%,
              #326947 50%,
              #27593c 100%
            );

          color: #ffffff;

          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          font-size: 11px;

          font-weight: 600;

          letter-spacing: 0.10em;

          text-transform: uppercase;

          cursor: pointer;

          box-shadow:
            0 10px 25px
            rgba(10, 43, 25, 0.40),

            inset 0 1px 0
            rgba(255, 255, 255, 0.18);

          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .landing-open-button:hover {
          background:
            linear-gradient(
              135deg,
              #4c895f 0%,
              #39764f 50%,
              #2b6241 100%
            );

          transform:
            translateY(-2px);

          box-shadow:
            0 14px 32px
            rgba(10, 43, 25, 0.46),

            inset 0 1px 0
            rgba(255, 255, 255, 0.20);
        }

        .landing-open-button:active {
          transform:
            translateY(0);

          box-shadow:
            0 6px 15px
            rgba(10, 43, 25, 0.35);
        }

        .landing-open-button svg {
          transition:
            transform 180ms ease;
        }

        .landing-open-button:hover svg {
          transform:
            translateX(3px);
        }


        /* =====================================================
           EXTRA SMALL PHONES
           ===================================================== */

        @media (max-width: 380px) {

          .landing-page {
            padding:
              10px
              8px;
          }

          .landing-card-overlay {
            padding:
              23px
              13px;
          }

          .landing-card-overlay::before {
            inset: 6px;
          }

          .landing-copy h1 {
            font-size: 30px;
          }

          .landing-subtitle {
            margin-top: 9px;
            margin-bottom: 15px;

            font-size: 11px;
          }

          .landing-date-panel {
            padding:
              12px
              10px;
          }

          .landing-date-panel strong {
            font-size: 17px;
          }

          .landing-invitee-panel {
            padding:
              14px
              10px;
          }

          .landing-invitee-panel h2 {
            font-size: 21px;
          }

          .landing-message {
            font-size: 10px;

            margin-bottom: 15px;
          }

          .landing-open-button {
            min-height: 48px;

            font-size: 10px;

            letter-spacing: 0.08em;
          }
        }


        /* =====================================================
           PHONES WITH LIMITED HEIGHT
           ===================================================== */

        @media (
          max-height: 700px
        ) and (
          max-width: 600px
        ) {

          .landing-page {
            align-items: flex-start;

            padding-top: 10px;
            padding-bottom: 10px;

            overflow-y: auto;
          }

          .landing-card-overlay {
            margin:
              0
              auto;
          }

          .landing-kicker {
            font-size: 9px;
          }

          .mini-ornament {
            margin-top: 9px;
            margin-bottom: 10px;
          }

          .landing-subtitle {
            margin-top: 9px;
            margin-bottom: 13px;
          }

          .landing-date-panel {
            padding: 11px;
          }

          .landing-invitee-panel {
            padding: 13px;
            margin-bottom: 10px;
          }

          .landing-message {
            margin-bottom: 12px;
          }
        }


        /* =====================================================
           TABLET
           ===================================================== */

        @media (min-width: 600px) {

          .landing-page {
            padding:
              30px
              22px;
          }

          .landing-card-overlay {
            padding:
              40px
              36px;

            border-radius: 9px;
          }

          .landing-copy h1 {
            font-size: 50px;
          }

          .landing-subtitle {
            font-size: 13px;
          }

          .landing-date-panel {
            padding:
              17px;
          }

          .landing-invitee-panel {
            padding:
              20px;
          }

          .landing-open-button {
            min-height: 54px;
          }
        }


        /* =====================================================
           DESKTOP
           ===================================================== */

        @media (min-width: 900px) {

          .landing-page {
            padding:
              50px
              30px;
          }

          .landing-background-image img {
            object-position:
              center center;
          }

          .landing-overlay {
            background:
              linear-gradient(
                90deg,
                rgba(10, 35, 22, 0.42),
                rgba(10, 35, 22, 0.18),
                rgba(10, 35, 22, 0.52)
              );
          }

          .landing-card {
            width: 520px;
          }

          .landing-card-overlay {
            padding:
              45px
              42px;
          }

          .landing-copy h1 {
            font-size: 54px;
          }

          .landing-subtitle {
            font-size: 14px;
          }
        }


        /* =====================================================
           LARGE DESKTOP
           ===================================================== */

        @media (min-width: 1200px) {

          .landing-card {
            width: 550px;
          }

          .landing-card-overlay {
            padding:
              48px
              45px;
          }

          .landing-copy h1 {
            font-size: 58px;
          }
        }


        /* =====================================================
           ACCESSIBILITY
           ===================================================== */

        .landing-open-button:focus-visible {
          outline:
            3px solid
            rgba(213, 236, 216, 0.95);

          outline-offset: 3px;
        }


        /* =====================================================
           REDUCED MOTION
           ===================================================== */

        @media (
          prefers-reduced-motion: reduce
        ) {

          .landing-open-button,
          .landing-open-button svg {
            transition: none;
          }
        }

      `}</style>
    </>
  );
}
