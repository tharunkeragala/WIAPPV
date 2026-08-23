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

function CountdownUnit({ label, value }) {
  const padded = String(value).padStart(2, '0');

  return (
    <div className="countdown-unit">
      <strong className="countdown-value" aria-label={`${value} ${label}`}>{padded}</strong>
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
    <div className="countdown" aria-label="Time until the wedding">
      <CountdownUnit label="Days" value={time.days} />
      <CountdownUnit label="Hours" value={time.hours} />
      <CountdownUnit label="Minutes" value={time.minutes} />
      <CountdownUnit label="Seconds" value={time.seconds} />
    </div>
  );
}
