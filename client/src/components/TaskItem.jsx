import { useState } from 'react';
import { parseMeta, encodeMeta } from '../api';

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

const CATEGORY_STYLES = {
  work:     { cls: 'category-work',     label: 'Work',     icon: '💼' },
  personal: { cls: 'category-personal', label: 'Personal', icon: '🏠' },
  health:   { cls: 'category-health',   label: 'Health',   icon: '💪' },
  learning: { cls: 'category-learning', label: 'Learning', icon: '📚' },
};

const PRIORITY_COLORS = {
  high:   'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low:    'var(--priority-low)',
};

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCreatedAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getRelativeDate(d) {
  if (!d) return null;
  const today = new Date(new Date().toDateString());
  const due = new Date(d);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  if (diff <= 7) return `In ${diff} days`;
  return null;
}

/* ── Sub-task progress bar ── */
function SubtaskProgress({ subtasks }) {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter(s => s.done).length;
  const pct = Math.round((done / subtasks.length) * 100);
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-elevated)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? 'var(--aurora-emerald)'
              : 'linear-gradient(90deg, var(--aurora-violet), var(--aurora-teal))',
            boxShadow: pct === 100 ? '0 0 8px rgba(16,185,129,0.4)' : '0 0 8px rgba(139,92,246,0.3)',
          }}
        />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-dimmed)' }}>
        {done}/{subtasks.length}
      </span>
    </div>
  );
}

export default function TaskItem({ task, onToggle, onUpdate, onDelete, onFocus, style, isDragging, dragHandleProps }) {
  const [editing,       setEditing]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [editError,     setEditError]     = useState('');
  const [showSubtasks,  setShowSubtasks]  = useState(false);

  const meta = parseMeta(task.description);
  const overdue = isOverdue(task);
  const priorityColor = PRIORITY_COLORS[meta.priority] || 'transparent';
  const catStyle = CATEGORY_STYLES[meta.category];
  const relDate = getRelativeDate(task.dueDate);
  const hasSubtasks = meta.subtasks && meta.subtasks.length > 0;

  // Edit form state
  const [editTitle,    setEditTitle]    = useState(task.title);
  const [editDesc,     setEditDesc]    = useState(meta.text);
  const [editDue,      setEditDue]      = useState(task.dueDate || '');
  const [editPriority, setEditPriority] = useState(meta.priority || 'none');
  const [editCategory, setEditCategory] = useState(meta.category || 'none');
  const [editSubtasks, setEditSubtasks] = useState(meta.subtasks || []);
  const [newSubtask,   setNewSubtask]   = useState('');

  const handleSave = async () => {
    if (!editTitle.trim()) { setEditError('Title cannot be empty'); return; }
    setSaving(true); setEditError('');
    try {
      const encodedDesc = encodeMeta(editPriority, editCategory, editDesc, editSubtasks);
      await onUpdate(task.id, {
        title: editTitle,
        description: encodedDesc,
        dueDate: editDue || null,
      });
      setEditing(false);
    } catch (err) { setEditError(err.message); }
    finally { setSaving(false); }
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDesc(meta.text);
    setEditDue(task.dueDate || '');
    setEditPriority(meta.priority || 'none');
    setEditCategory(meta.category || 'none');
    setEditSubtasks(meta.subtasks || []);
    setNewSubtask('');
    setEditError('');
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleCancel();
    if (e.key === 'Enter' && e.ctrlKey) handleSave();
  };

  // Sub-task toggle (inline, no edit mode needed)
  const toggleSubtask = async (index) => {
    const updated = [...meta.subtasks];
    updated[index] = { ...updated[index], done: !updated[index].done };
    const encodedDesc = encodeMeta(meta.priority, meta.category, meta.text, updated);
    await onUpdate(task.id, { description: encodedDesc });
  };

  // Edit mode: add/remove sub-tasks
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setEditSubtasks([...editSubtasks, { text: newSubtask.trim(), done: false }]);
    setNewSubtask('');
  };

  const removeSubtask = (index) => {
    setEditSubtasks(editSubtasks.filter((_, i) => i !== index));
  };

  const leftBorderColor = task.completed
    ? 'var(--border-subtle)'
    : overdue
      ? 'var(--aurora-rose)'
      : meta.priority !== 'none'
        ? priorityColor
        : 'var(--aurora-violet)';

  return (
    <li
      className={`task-slide-in group rounded-2xl overflow-hidden transition-all duration-250 ${isDragging ? 'dragging-task' : ''}`}
      style={{
        background: isDragging ? 'var(--surface-elevated)' : 'var(--surface-raised)',
        border: `1px solid ${isDragging ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
        borderLeft: `3px solid ${leftBorderColor}`,
        opacity: isDragging ? 0.9 : task.completed ? 0.5 : 1,
        transform: isDragging ? 'scale(1.02)' : undefined,
        boxShadow: isDragging ? 'var(--shadow-lg), 0 0 20px rgba(139,92,246,0.15)' : undefined,
        ...style,
      }}
      onMouseEnter={e => {
        if (!task.completed && !isDragging) {
          e.currentTarget.style.background = 'var(--surface-elevated)';
          e.currentTarget.style.borderColor = 'var(--border-default)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={e => {
        if (!isDragging) {
          e.currentTarget.style.background = 'var(--surface-raised)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
        }
      }}
    >
      {editing ? (
        /* ── EDIT MODE ── */
        <div className="p-4 space-y-3" onKeyDown={handleKeyDown}>
          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
            className="input-base w-full font-medium" autoFocus />
          <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
            placeholder="Description (optional)" rows={2} className="input-base w-full resize-none" />

          {/* Priority */}
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map(p => (
              <button key={p.key} type="button" onClick={() => setEditPriority(p.key)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: editPriority === p.key ? `${p.color}18` : 'var(--surface-raised)',
                  border: `1px solid ${editPriority === p.key ? `${p.color}40` : 'var(--border-subtle)'}`,
                  color: editPriority === p.key ? p.color : 'var(--text-muted)',
                }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Category */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button key={c.key} type="button" onClick={() => setEditCategory(c.key)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                style={{
                  background: editCategory === c.key ? 'var(--surface-elevated)' : 'var(--surface-raised)',
                  border: `1px solid ${editCategory === c.key ? 'var(--border-default)' : 'var(--border-subtle)'}`,
                  color: editCategory === c.key ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>
                <span className="text-xs">{c.icon}</span> {c.label}
              </button>
            ))}
          </div>

          {/* Sub-tasks editor */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-dimmed)' }}>
              Sub-tasks
            </label>
            {editSubtasks.length > 0 && (
              <div className="space-y-1 mb-2">
                {editSubtasks.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg"
                    style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}>
                    <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{st.text}</span>
                    <button type="button" onClick={() => removeSubtask(i)} className="btn-danger p-0.5">
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
                placeholder="Add a sub-task..."
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

          {/* Due date */}
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-dimmed)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input type="date" value={editDue} onChange={e => setEditDue(e.target.value)} className="input-base" />
          </div>

          {editError && <p className="text-xs font-medium" style={{ color: 'var(--aurora-rose)' }}>{editError}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={handleCancel} className="btn-secondary">Cancel</button>
            <span className="text-xs self-center ml-auto" style={{ color: 'var(--text-dimmed)' }}>
              Ctrl+Enter to save
            </span>
          </div>
        </div>
      ) : (
        /* ── VIEW MODE ── */
        <div className="px-4 py-3.5 flex items-start gap-3">
          {/* Drag Handle */}
          <div
            {...(dragHandleProps || {})}
            className="drag-handle mt-1 cursor-grab active:cursor-grabbing flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="Drag to reorder"
          >
            <svg className="w-4 h-4" style={{ color: 'var(--text-dimmed)' }} fill="currentColor" viewBox="0 0 24 24">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </div>

          {/* Checkbox */}
          <button onClick={() => onToggle(task)}
            aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
            className={`task-checkbox mt-0.5 ${task.completed ? 'checked' : ''}`}
          >
            {task.completed && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"
                  style={{ strokeDasharray: 20, strokeDashoffset: 0 }} />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className="text-sm font-medium leading-snug"
                style={{
                  color: task.completed ? 'var(--text-dimmed)' : 'var(--text-primary)',
                  textDecoration: task.completed ? 'line-through' : 'none',
                }}>
                {task.title}
              </p>

              {/* Priority badge */}
              {meta.priority && meta.priority !== 'none' && !task.completed && (
                <span className={`priority-badge priority-${meta.priority} flex-shrink-0`}>
                  {meta.priority}
                </span>
              )}
            </div>

            {/* Description */}
            {meta.text && (
              <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {meta.text}
              </p>
            )}

            {/* Sub-task progress */}
            {hasSubtasks && <SubtaskProgress subtasks={meta.subtasks} />}

            {/* Inline sub-tasks list */}
            {hasSubtasks && showSubtasks && (
              <div className="mt-2 space-y-1 slide-in-up">
                {meta.subtasks.map((st, i) => (
                  <button key={i}
                    onClick={() => toggleSubtask(i)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-all hover:bg-[rgba(255,255,255,0.03)]"
                  >
                    <div className={`w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center transition-all ${st.done ? 'checked' : ''}`}
                      style={{
                        background: st.done
                          ? 'linear-gradient(135deg, var(--aurora-violet), var(--aurora-teal))'
                          : 'transparent',
                        border: st.done ? 'none' : '1.5px solid var(--border-default)',
                      }}>
                      {st.done && (
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs" style={{
                      color: st.done ? 'var(--text-dimmed)' : 'var(--text-secondary)',
                      textDecoration: st.done ? 'line-through' : 'none',
                    }}>
                      {st.text}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Toggle sub-tasks visibility */}
            {hasSubtasks && (
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="text-[10px] font-bold uppercase tracking-wider mt-1 transition-colors"
                style={{ color: 'var(--text-dimmed)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--aurora-violet)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dimmed)'}
              >
                {showSubtasks ? '▾ Hide' : '▸ Show'} sub-tasks
              </button>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Category tag */}
              {catStyle && (
                <span className={`tag-pill ${catStyle.cls}`}>
                  <span className="text-xs">{catStyle.icon}</span>
                  {catStyle.label}
                </span>
              )}

              {/* Due date */}
              {task.dueDate && (
                <span className={`tag-pill ${overdue ? 'priority-high' : ''}`}
                  style={!overdue ? {
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                  } : {}}>
                  {overdue && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {relDate ? `${relDate} · ` : ''}{formatDate(task.dueDate)}
                </span>
              )}

              {/* Created at */}
              {task.createdAt && (
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-dimmed)' }}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatCreatedAt(task.createdAt)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="task-actions flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Focus button */}
            {!task.completed && !confirmDelete && onFocus && (
              <button onClick={() => onFocus(task)} className="btn-ghost" aria-label="Start focus timer" title="Focus on this task">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            {!task.completed && !confirmDelete && (
              <button onClick={() => setEditing(true)} className="btn-ghost" aria-label="Edit task">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="btn-danger" aria-label="Delete task">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--aurora-rose)' }}>
                  Delete?
                </span>
                <button onClick={() => onDelete(task.id)}
                  className="text-xs font-bold uppercase tracking-wider transition-all hover:scale-110 active:scale-90"
                  style={{ color: 'var(--aurora-rose)' }}>
                  Yes
                </button>
                <span style={{ color: 'var(--text-dimmed)' }}>·</span>
                <button onClick={() => setConfirmDelete(false)}
                  className="text-xs font-bold uppercase tracking-wider transition-all hover:scale-110 active:scale-90"
                  style={{ color: 'var(--text-muted)' }}>
                  No
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
