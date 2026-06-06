import { useState, useEffect, useRef, useCallback } from 'react';

const PRESETS = [
  { label: '25m', seconds: 25 * 60, name: 'Focus' },
  { label: '15m', seconds: 15 * 60, name: 'Short Break' },
  { label: '5m',  seconds: 5 * 60,  name: 'Quick' },
];

export default function FocusTimer({ task, onClose, onComplete }) {
  const [totalSeconds, setTotalSeconds] = useState(PRESETS[0].seconds);
  const [remaining, setRemaining] = useState(PRESETS[0].seconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedAtRef = useRef(null);

  // Accurate timer using timestamps
  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const left = Math.max(0, totalSeconds - elapsed);
    setRemaining(Math.ceil(left));

    if (left <= 0) {
      clearInterval(intervalRef.current);
      setRunning(false);
      setFinished(true);

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('⏱️ Focus session complete!', {
          body: task ? `Finished focusing on: ${task.title}` : 'Great work! Take a break.',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">✦</text></svg>',
        });
      }

      if (onComplete) onComplete();
    }
  }, [totalSeconds, task, onComplete]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const start = () => {
    if (pausedAtRef.current) {
      // Resume: adjust startTime to account for paused duration
      const pauseDuration = Date.now() - pausedAtRef.current;
      startTimeRef.current += pauseDuration;
      pausedAtRef.current = null;
    } else {
      startTimeRef.current = Date.now();
    }
    setRunning(true);
    setFinished(false);
    intervalRef.current = setInterval(tick, 100);
  };

  const pause = () => {
    clearInterval(intervalRef.current);
    pausedAtRef.current = Date.now();
    setRunning(false);
  };

  const reset = (seconds) => {
    clearInterval(intervalRef.current);
    const s = seconds || totalSeconds;
    setTotalSeconds(s);
    setRemaining(s);
    setRunning(false);
    setFinished(false);
    startTimeRef.current = null;
    pausedAtRef.current = null;
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  // Update tick callback when totalSeconds changes
  useEffect(() => {
    if (running) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, 100);
    }
  }, [tick, running]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  // SVG circular progress
  const size = 120;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed bottom-6 right-6 z-50 fade-in-scale"
      style={{ animation: 'fadeInScale 0.4s var(--ease-out-expo) forwards' }}
    >
      <div className="glass-panel-elevated p-5" style={{ width: '260px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: finished
                  ? 'rgba(16, 185, 129, 0.2)'
                  : running
                    ? 'rgba(244, 63, 94, 0.2)'
                    : 'rgba(139, 92, 246, 0.2)',
                border: `1px solid ${
                  finished ? 'rgba(16, 185, 129, 0.3)' : running ? 'rgba(244, 63, 94, 0.3)' : 'rgba(139, 92, 246, 0.3)'
                }`,
              }}>
              <span className="text-xs">
                {finished ? '✅' : running ? '🔥' : '⏱️'}
              </span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider"
              style={{ color: finished ? 'var(--aurora-emerald)' : running ? 'var(--aurora-rose)' : 'var(--text-muted)' }}>
              {finished ? 'Done!' : running ? 'Focusing' : 'Focus Timer'}
            </span>
          </div>
          <button onClick={onClose} className="btn-ghost p-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Task name */}
        {task && (
          <p className="text-xs font-medium mb-4 truncate px-1"
            style={{ color: 'var(--text-secondary)' }}>
            {task.title}
          </p>
        )}

        {/* Timer Ring */}
        <div className="flex justify-center mb-4">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="var(--border-subtle)" strokeWidth={strokeWidth} />
              <circle cx={size / 2} cy={size / 2} r={radius}
                fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{
                  stroke: finished ? 'var(--aurora-emerald)' : running ? 'var(--aurora-rose)' : 'var(--aurora-violet)',
                  transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease',
                  filter: `drop-shadow(0 0 8px ${
                    finished ? 'rgba(16,185,129,0.4)' : running ? 'rgba(244,63,94,0.4)' : 'rgba(139,92,246,0.4)'
                  })`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold font-mono tracking-tight"
                style={{ color: 'var(--text-primary)' }}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Presets */}
        {!running && !finished && (
          <div className="flex gap-1.5 mb-4 justify-center">
            {PRESETS.map(p => (
              <button key={p.label}
                onClick={() => reset(p.seconds)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: totalSeconds === p.seconds ? 'rgba(139, 92, 246, 0.15)' : 'var(--surface-raised)',
                  border: `1px solid ${totalSeconds === p.seconds ? 'rgba(139, 92, 246, 0.3)' : 'var(--border-subtle)'}`,
                  color: totalSeconds === p.seconds ? 'var(--aurora-violet)' : 'var(--text-muted)',
                }}>
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          {finished ? (
            <button onClick={() => reset()} className="btn-primary flex-1">
              Restart
            </button>
          ) : running ? (
            <button onClick={pause} className="btn-secondary flex-1">
              Pause
            </button>
          ) : (
            <button onClick={start} className="btn-primary flex-1">
              {pausedAtRef.current ? 'Resume' : 'Start'}
            </button>
          )}
          {(running || pausedAtRef.current) && !finished && (
            <button onClick={() => reset()} className="btn-secondary">
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
