import { useEffect, useMemo, useState } from "react";
import "./FlipCountdown.css";

function calculate(target) {
  const difference = Math.max(
    0,
    new Date(target).getTime() - Date.now()
  );

  const totalSeconds = Math.floor(difference / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function FlipUnit({ label, value }) {
  const padded = String(value).padStart(2, "0");

  return (
    <div className="flip-unit">
      <div
        key={value}
        className="flip-card flip-animation"
        aria-label={`${value} ${label}`}
      >
        <div className="flip-top">{padded}</div>
        <div className="flip-bottom">{padded}</div>
        <div className="flip-divider" />
      </div>

      <span className="flip-label">{label}</span>
    </div>
  );
}

export default function FlipCountdown({ targetDate }) {
  const initial = useMemo(
    () => calculate(targetDate),
    [targetDate]
  );

  const [time, setTime] = useState(initial);

  useEffect(() => {
    setTime(calculate(targetDate));

    const timer = setInterval(() => {
      setTime(calculate(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <>
      <div className="flip-countdown">
        <FlipUnit label="Days" value={time.days} />
        <FlipUnit label="Hours" value={time.hours} />
        <FlipUnit label="Minutes" value={time.minutes} />
        <FlipUnit label="Seconds" value={time.seconds} />
      </div>

      <style>{`
        .flip-countdown {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: 30px;
          padding: 30px;
        }

        .flip-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .flip-card {
          position: relative;
          width: 140px;
          height: 150px;

          background: #181818;
          color: #ffffff;

          border-radius: 14px;

          font-family: Arial, Helvetica, sans-serif;
          font-size: 82px;
          font-weight: 800;

          line-height: 150px;
          text-align: center;

          overflow: hidden;
          perspective: 600px;

          box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.4),
            inset 0 1px 1px rgba(255, 255, 255, 0.08);
        }

        .flip-top,
        .flip-bottom {
          position: absolute;
          left: 0;

          width: 100%;
          height: 50%;

          overflow: hidden;

          background: linear-gradient(
            to bottom,
            #292929,
            #1d1d1d
          );
        }

        .flip-top {
          top: 0;
          line-height: 150px;

          transform-origin: bottom;
        }

        .flip-bottom {
          bottom: 0;
          line-height: 0;

          background: linear-gradient(
            to bottom,
            #171717,
            #202020
          );
        }

        .flip-divider {
          position: absolute;
          z-index: 10;

          left: 0;
          top: 50%;

          width: 100%;
          height: 4px;

          background: #080808;

          transform: translateY(-50%);

          box-shadow:
            0 1px 2px rgba(255, 255, 255, 0.08);
        }

        .flip-label {
          font-family: Arial, Helvetica, sans-serif;

          font-size: 17px;
          font-weight: 600;

          color: #777;

          text-transform: uppercase;
          letter-spacing: 2px;
        }

        /*
         * Flip animation
         */
        .flip-animation {
          animation: flipClock 0.6s ease-in-out;
          transform-style: preserve-3d;
        }

        @keyframes flipClock {
          0% {
            transform: rotateX(0deg);
          }

          40% {
            transform: rotateX(-15deg);
          }

          70% {
            transform: rotateX(15deg);
          }

          100% {
            transform: rotateX(0deg);
          }
        }

        /*
         * Mobile
         */
        @media (max-width: 800px) {
          .flip-countdown {
            gap: 12px;
            padding: 20px 10px;
          }

          .flip-card {
            width: 85px;
            height: 100px;

            font-size: 52px;
            line-height: 100px;

            border-radius: 9px;
          }

          .flip-top {
            line-height: 100px;
          }

          .flip-label {
            font-size: 10px;
            letter-spacing: 1px;
          }
        }

        @media (max-width: 450px) {
          .flip-countdown {
            gap: 7px;
            padding: 15px 5px;
          }

          .flip-card {
            width: 70px;
            height: 82px;

            font-size: 42px;
            line-height: 82px;
          }

          .flip-top {
            line-height: 82px;
          }

          .flip-label {
            font-size: 8px;
          }
        }
      `}</style>
    </>
  );
}
