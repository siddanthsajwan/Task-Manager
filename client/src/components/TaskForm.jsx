import { useState, useRef, useEffect } from 'react';

const PRIORITIES = [
  { key: 'none',   label: 'None',   color: 'var(--text-dimmed)' },
  { key: 'low',    label: 'Low',    color: 'var(--priority-low)' },
  { key: 'medium', label: 'Medium', color: 'var(--priority-medium)' },
  { key: 'high',   label: 'High',   color: 'var(--priority-high)' },
];

const CATEGORIES = [
  { key: 'none',     label: 'None',     icon: '—' },
  { key: 'work',     label: 'Work',     icon: '💼' },
  { key: 'personal', label: 'Personal', icon: '🏠' },
  { key: 'health',   label: 'Health',   icon: '💪' },
  { key: 'learning', label: 'Learning', icon: '📚' },
];

export default function TaskForm({ onSubmit, formRef }) {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate]         = useState('');
  const [priority, setPriority]       = useState('none');
  const [category, setCategory]       = useState('none');
  const [subtasks, setSubtasks]       = useState([]);
  const [newSubtask, setNewSubtask]   = useState('');
  const [expanded, setExpanded]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const titleRef = useRef(null);

  // Expose focus method via ref
  useEffect(() => {
    if (formRef) {
      formRef.current = {
        focus: () => {
          setExpanded(true);
          setTimeout(() => titleRef.current?.focus(), 100);
        },
        collapse: () => setExpanded(false),
      };
    }
  }, [formRef]);

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { text: newSubtask.trim(), done: false }]);
    setNewSubtask('');
  };

  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setError('');
    setSubmitting(true);
    try {
      // Encode priority, category, and subtasks into description
      let encodedDesc = description;
      if (priority !== 'none' || category !== 'none' || subtasks.length > 0) {
        let metaPrefix = `[priority:${priority}][category:${category}]`;
        if (subtasks.length > 0) {
          metaPrefix += `[subtasks:${JSON.stringify(subtasks)}]`;
        }
        encodedDesc = metaPrefix + (description ? ' ' + description : '');
      }
      await onSubmit({ title, description: encodedDesc, dueDate: dueDate || null });
      setTitle(''); setDescription(''); setDueDate('');
      setPriority('none'); setCategory('none');
      setSubtasks([]); setNewSubtask('');
      setExpanded(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const setQuickDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  return (
    <form onSubmit={handleSubmit}
      className="mb-5 glass-panel overflow-hidden transition-all duration-300"
      style={{ borderColor: expanded ? 'var(--border-default)' : 'var(--border-subtle)' }}>

      {/* Main input row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}>
          <svg className="w-3.5 h-3.5" style={{ color: 'var(--aurora-violet)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>

        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder='Add a new task... (press "N")'
          className="flex-1 bg-transparent outline-none text-sm font-medium"
          style={{ color: 'var(--text-primary)' }}
        />

        <button type="submit" disabled={submitting} className="btn-primary flex-shrink-0 flex items-center gap-2">
          {submitting ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full"
                style={{ animation: 'spin 0.6s linear infinite' }} />
              Adding
            </>
          ) : 'Add Task'}
        </button>
      </div>

      {/* Expanded section */}
      <div style={{
        maxHeight: expanded ? '600px' : '0',
        opacity: expanded ? 1 : 0,
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.23, 1, 0.32, 1)',
      }}>
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>

          {/* Description */}
          <div className="pt-3">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="input-base w-full resize-none"
            />
          </div>

          {/* Priority selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-dimmed)' }}>
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPriority(p.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                  style={{
                    background: priority === p.key ? `${p.color}18` : 'var(--surface-raised)',
                    border: `1px solid ${priority === p.key ? `${p.color}40` : 'var(--border-subtle)'}`,
                    color: priority === p.key ? p.color : 'var(--text-muted)',
                  }}
                >
                  {p.key !== 'none' && (
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: p.color }} />
                  )}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-dimmed)' }}>
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5"
                  style={{
                    background: category === c.key ? 'var(--surface-elevated)' : 'var(--surface-raised)',
                    border: `1px solid ${category === c.key ? 'var(--border-default)' : 'var(--border-subtle)'}`,
                    color: category === c.key ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  <span>{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-tasks */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-dimmed)' }}>
              Sub-tasks
            </label>
            {subtasks.length > 0 && (
              <div className="space-y-1 mb-2">
                {subtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}>
                    <div className="w-3 h-3 rounded border border-[var(--border-default)] flex-shrink-0" />
                    <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{st.text}</span>
                    <button type="button" onClick={() => removeSubtask(i)}
                      className="text-xs transition-colors p-0.5"
                      style={{ color: 'var(--text-dimmed)' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--aurora-rose)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dimmed)'}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                placeholder="Add a checklist item..."
                className="input-base flex-1 text-xs"
              />
              <button type="button" onClick={addSubtask}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  color: 'var(--aurora-violet)',
                }}>
                Add
              </button>
            </div>
          </div>

          {/* Due date with presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-dimmed)' }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Due Date
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-base" />
              <button type="button" onClick={() => setQuickDate(0)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                Today
              </button>
              <button type="button" onClick={() => setQuickDate(1)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                Tomorrow
              </button>
              <button type="button" onClick={() => setQuickDate(7)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                Next Week
              </button>
              {dueDate && (
                <button type="button" onClick={() => setDueDate('')}
                  className="text-xs font-bold uppercase tracking-wider transition-colors"
                  style={{ color: 'var(--text-dimmed)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--aurora-rose)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dimmed)'}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 pb-3 flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--aurora-rose)' }}>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </form>
  );
}
