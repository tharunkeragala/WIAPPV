import { useEffect, useMemo, useState } from 'react';

function calculate(target) {
  const difference = Math.max(0, new Date(target).getTime() - Date.now());
  const totalSeconds = Math.floor(difference / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  };
}

function FlipUnit({ label, value }) {
  const padded = String(value).padStart(2, '0');
  return (
    <div className="flip-unit">
      <div className="flip-card" aria-label={`${value} ${label}`}>
        <span className="flip-top">{padded}</span>
        <span className="flip-bottom">{padded}</span>
        <span className="flip-divider" />
      </div>
      <span className="flip-label">{label}</span>
    </div>
  );
}

export default function FlipCountdown({ targetDate }) {
  const initial = useMemo(() => calculate(targetDate), [targetDate]);
  const [time, setTime] = useState(initial);

  useEffect(() => {
    setTime(calculate(targetDate));
    const timer = setInterval(() => setTime(calculate(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flip-countdown">
      <FlipUnit label="Days" value={time.days} />
      <FlipUnit label="Hours" value={time.hours} />
      <FlipUnit label="Minutes" value={time.minutes} />
      <FlipUnit label="Seconds" value={time.seconds} />
    </div>
  );
}
