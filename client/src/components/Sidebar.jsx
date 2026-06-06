import { useState, useEffect } from 'react';

// SVG Progress Ring Component
function ProgressRing({ completed, total, size = 120 }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--border-subtle)" strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--aurora-violet)" />
            <stop offset="100%" stopColor="var(--aurora-teal)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
          {pct}%
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          complete
        </span>
      </div>
    </div>
  );
}

const CATEGORIES = [
  { key: 'all',      label: 'All Tasks', icon: '◆', color: 'var(--aurora-violet)' },
  { key: 'work',     label: 'Work',      icon: '💼', color: 'var(--cat-work)' },
  { key: 'personal', label: 'Personal',  icon: '🏠', color: 'var(--cat-personal)' },
  { key: 'health',   label: 'Health',    icon: '💪', color: 'var(--cat-health)' },
  { key: 'learning', label: 'Learning',  icon: '📚', color: 'var(--cat-learning)' },
];

const SHORTCUTS = [
  { keys: ['N'], desc: 'New task' },
  { keys: ['/'], desc: 'Search' },
  { keys: ['Esc'], desc: 'Close' },
];

export default function Sidebar({
  completed, total, allTasks,
  categoryFilter, onCategoryChange,
  isOpen, onClose, onOpenAnalytics,
}) {
  const active = total - completed;
  const overdue = allTasks.filter(t =>
    !t.completed && t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString())
  ).length;

  // Greeting based on time of day
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
    }));
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="h-full flex flex-col px-5 py-6 overflow-y-auto">

          {/* Logo area */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--aurora-violet), var(--aurora-teal))',
                  boxShadow: 'var(--shadow-glow-violet)',
                }}>
                <span className="text-white text-sm font-bold">✦</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Taskflow
              </h1>
            </div>
            <p className="text-xs mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
              {greeting} — {dateStr}
            </p>
          </div>

          {/* Progress Ring */}
          <div className="flex flex-col items-center mb-8">
            <ProgressRing completed={completed} total={total} />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mb-8">
            <div className="stat-card">
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Total</p>
              <p className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{total}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Active</p>
              <p className="text-xl font-bold font-mono" style={{ color: 'var(--aurora-teal)' }}>{active}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Done</p>
              <p className="text-xl font-bold font-mono" style={{ color: 'var(--aurora-emerald)' }}>{completed}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Overdue</p>
              <p className="text-xl font-bold font-mono" style={{ color: overdue > 0 ? 'var(--aurora-rose)' : 'var(--text-dimmed)' }}>{overdue}</p>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-dimmed)' }}>
              Categories
            </p>
            <div className="space-y-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => onCategoryChange(cat.key)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: categoryFilter === cat.key ? 'var(--surface-elevated)' : 'transparent',
                    color: categoryFilter === cat.key ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: categoryFilter === cat.key ? '1px solid var(--border-default)' : '1px solid transparent',
                  }}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.label}</span>
                  {categoryFilter === cat.key && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Analytics Button */}
          <div className="mb-8">
            <button
              onClick={onOpenAnalytics}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.08))',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.08))';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)';
                e.currentTarget.style.transform = '';
              }}
            >
              <span className="text-base">📊</span>
              <span>Analytics</span>
              <svg className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--text-dimmed)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="mt-auto">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text-dimmed)' }}>
              Shortcuts
            </p>
            <div className="space-y-2">
              {SHORTCUTS.map(s => (
                <div key={s.desc} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.desc}</span>
                  <div className="flex gap-1">
                    {s.keys.map(k => (
                      <span key={k} className="kbd">{k}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-dimmed)' }}>
              Personal Task Manager
            </p>
            <p className="text-xs" style={{ color: 'var(--text-dimmed)', opacity: 0.6 }}>
              Studio Graphene Assessment
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
