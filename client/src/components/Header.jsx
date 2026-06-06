import { useState, useEffect } from 'react';

const words = [
  { text: 'Plan.',     color: 'var(--aurora-violet)', delay: 0 },
  { text: 'Focus.',    color: 'var(--aurora-teal)',    delay: 0.1 },
  { text: 'Achieve.',  color: 'var(--aurora-emerald)', delay: 0.2 },
];

function WordReveal({ text, color, delay }) {
  return (
    <span className="word-reveal" style={{ marginRight: text === 'Achieve.' ? 0 : '0.3em' }}>
      <span style={{
        color,
        animationDelay: `${delay}s`,
        textShadow: `0 0 40px ${color}33`,
      }}>
        {text}
      </span>
    </span>
  );
}

export default function Header({ onToggleSidebar }) {
  const [animKey, setAnimKey] = useState(0);
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setDateStr(now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setAnimKey(k => k + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mb-8">
      {/* Top bar with hamburger */}
      <div className="flex items-center justify-between mb-6">
        {/* Mobile hamburger */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden btn-ghost"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Date badge */}
        <div className="fade-up flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            animationDelay: '0.2s',
          }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: 'var(--aurora-emerald)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: 'var(--aurora-emerald)' }} />
          </span>
          <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            {dateStr}
          </span>
        </div>
      </div>

      {/* Greeting */}
      <p className="text-sm font-medium mb-2 fade-up" style={{ color: 'var(--text-muted)', animationDelay: '0.1s' }}>
        {greeting} 👋
      </p>

      {/* Headline */}
      <h1 key={animKey} className="font-bold tracking-tight mb-2"
        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.1 }}>
        {words.map(w => <WordReveal key={w.text} {...w} />)}
      </h1>

      {/* Subtitle */}
      <p className="text-sm fade-up" style={{ color: 'var(--text-muted)', animationDelay: '0.4s' }}>
        Organize your tasks with clarity and purpose
      </p>
    </div>
  );
}
