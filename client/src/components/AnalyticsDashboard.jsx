import { useState, useEffect, useCallback } from 'react';
import { getAnalytics } from '../api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Sparkline({ data, width = 220, height = 60, color = 'var(--aurora-violet)' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.count / max) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  // Area fill
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#sparkGrad)" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: `drop-shadow(0 0 6px ${color}55)`,
        }}
      />
      {/* Dots */}
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (d.count / max) * (height - 8) - 4;
        return (
          <circle key={i} cx={x} cy={y} r="3"
            fill="var(--surface-base)" stroke={color} strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium w-16 capitalize" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-raised)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            boxShadow: `0 0 8px ${color}44`,
          }}
        />
      </div>
      <span className="text-xs font-mono font-bold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

function ActivityHeatmap({ dailyCompleted, dailyCreated }) {
  if (!dailyCompleted) return null;
  const max = Math.max(...dailyCompleted.map(d => d.count), ...dailyCreated.map(d => d.count), 1);

  return (
    <div className="flex gap-1.5 justify-center">
      {dailyCompleted.map((d, i) => {
        const intensity = d.count / max;
        const dayIndex = new Date(d.date).getDay();
        return (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <div
              className="w-7 h-7 rounded-lg transition-all duration-300 hover:scale-110"
              style={{
                background: intensity > 0
                  ? `rgba(139, 92, 246, ${0.15 + intensity * 0.6})`
                  : 'var(--surface-raised)',
                border: `1px solid ${intensity > 0 ? `rgba(139, 92, 246, ${0.2 + intensity * 0.3})` : 'var(--border-subtle)'}`,
                boxShadow: intensity > 0 ? `0 0 ${intensity * 12}px rgba(139, 92, 246, ${intensity * 0.3})` : 'none',
              }}
              title={`${d.date}: ${d.count} completed`}
            >
              {d.count > 0 && (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold font-mono"
                  style={{ color: intensity > 0.5 ? 'var(--text-primary)' : 'var(--aurora-violet)' }}>
                  {d.count}
                </div>
              )}
            </div>
            <span className="text-[9px] font-mono uppercase" style={{ color: 'var(--text-dimmed)' }}>
              {DAY_LABELS[dayIndex]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsDashboard({ isOpen, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (_) {
      // Silently fail - analytics is non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchAnalytics();
  }, [isOpen, fetchAnalytics]);

  if (!isOpen) return null;

  const priorityColors = {
    high: 'var(--priority-high)',
    medium: 'var(--priority-medium)',
    low: 'var(--priority-low)',
    none: 'var(--text-dimmed)',
  };

  const categoryColors = {
    work: 'var(--cat-work)',
    personal: 'var(--cat-personal)',
    health: 'var(--cat-health)',
    learning: 'var(--cat-learning)',
    none: 'var(--text-dimmed)',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 overflow-y-auto"
        style={{
          width: 'min(420px, 90vw)',
          background: 'rgba(8, 8, 16, 0.95)',
          backdropFilter: 'blur(40px)',
          borderLeft: '1px solid var(--border-subtle)',
          animation: 'slideInRight 0.4s var(--ease-out-expo) forwards',
        }}
      >
        <div className="px-6 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Analytics
              </h2>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Your productivity insights
              </p>
            </div>
            <button onClick={onClose} className="btn-ghost">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 opacity-10" style={{ borderColor: 'var(--aurora-violet)' }} />
                <div className="absolute inset-0 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: 'var(--aurora-violet)', animation: 'spin 0.8s linear infinite' }} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-dimmed)' }}>
                Computing...
              </p>
            </div>
          ) : analytics ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="stat-card">
                  <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Completion</p>
                  <p className="text-2xl font-bold font-mono" style={{ color: 'var(--aurora-emerald)' }}>
                    {analytics.completionRate}%
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Streak</p>
                  <p className="text-2xl font-bold font-mono" style={{ color: 'var(--aurora-amber)' }}>
                    {analytics.streak}
                    <span className="text-xs ml-1" style={{ color: 'var(--text-dimmed)' }}>days</span>
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Velocity</p>
                  <p className="text-2xl font-bold font-mono" style={{ color: 'var(--aurora-teal)' }}>
                    {analytics.velocity}
                    <span className="text-xs ml-1" style={{ color: 'var(--text-dimmed)' }}>/day</span>
                  </p>
                </div>
                <div className="stat-card">
                  <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Overdue</p>
                  <p className="text-2xl font-bold font-mono"
                    style={{ color: analytics.overdue > 0 ? 'var(--aurora-rose)' : 'var(--text-dimmed)' }}>
                    {analytics.overdue}
                  </p>
                </div>
              </div>

              {/* Completion Trend */}
              <div className="glass-panel p-4">
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dimmed)' }}>
                  Completion Trend · Last 7 Days
                </p>
                <div className="flex justify-center">
                  <Sparkline data={analytics.dailyCompleted} color="var(--aurora-emerald)" />
                </div>
              </div>

              {/* Activity Heatmap */}
              <div className="glass-panel p-4">
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dimmed)' }}>
                  Daily Activity
                </p>
                <ActivityHeatmap
                  dailyCompleted={analytics.dailyCompleted}
                  dailyCreated={analytics.dailyCreated}
                />
              </div>

              {/* Creation Trend */}
              <div className="glass-panel p-4">
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dimmed)' }}>
                  Tasks Created · Last 7 Days
                </p>
                <div className="flex justify-center">
                  <Sparkline data={analytics.dailyCreated} color="var(--aurora-teal)" />
                </div>
              </div>

              {/* Priority Breakdown */}
              {analytics.priorities && Object.keys(analytics.priorities).length > 0 && (
                <div className="glass-panel p-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dimmed)' }}>
                    By Priority
                  </p>
                  <div className="space-y-2.5">
                    {Object.entries(analytics.priorities)
                      .filter(([k]) => k !== 'none')
                      .sort(([a], [b]) => {
                        const order = { high: 0, medium: 1, low: 2 };
                        return (order[a] ?? 9) - (order[b] ?? 9);
                      })
                      .map(([key, val]) => (
                        <MiniBar key={key} label={key} value={val.completed} max={val.total}
                          color={priorityColors[key] || 'var(--text-muted)'} />
                      ))}
                  </div>
                </div>
              )}

              {/* Category Breakdown */}
              {analytics.categories && Object.keys(analytics.categories).length > 0 && (
                <div className="glass-panel p-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-dimmed)' }}>
                    By Category
                  </p>
                  <div className="space-y-2.5">
                    {Object.entries(analytics.categories)
                      .filter(([k]) => k !== 'none')
                      .map(([key, val]) => (
                        <MiniBar key={key} label={key} value={val.completed} max={val.total}
                          color={categoryColors[key] || 'var(--text-muted)'} />
                      ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="glass-panel p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                    }}>
                    <span className="text-lg">📈</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {analytics.completed} of {analytics.total} tasks done
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {analytics.active} remaining · {analytics.velocity} avg/day
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                No analytics data available yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
