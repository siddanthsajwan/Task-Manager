import { useState, useRef, useCallback } from 'react';
import TaskItem from './TaskItem';

export default function TaskList({ tasks, onToggle, onUpdate, onDelete, onReorder, onFocus }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const dragRef = useRef(null);

  const handleDragStart = useCallback((e, index) => {
    setDragIndex(index);
    dragRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Use transparent 1x1 pixel as drag image (we style the actual element)
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragRef.current !== null && overIndex !== null && dragRef.current !== overIndex && onReorder) {
      const reordered = [...tasks];
      const [moved] = reordered.splice(dragRef.current, 1);
      reordered.splice(overIndex, 0, moved);
      onReorder(reordered.map(t => t.id));
    }
    setDragIndex(null);
    setOverIndex(null);
    dragRef.current = null;
  }, [tasks, overIndex, onReorder]);

  const handleDragLeave = useCallback(() => {
    setOverIndex(null);
  }, []);

  if (tasks.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-5 text-center fade-in-scale">
        {/* Custom empty state illustration */}
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(6, 182, 212, 0.08))',
              border: '1px solid var(--border-subtle)',
            }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              {/* Clipboard body */}
              <rect x="10" y="8" width="28" height="34" rx="4" stroke="var(--text-dimmed)" strokeWidth="2" />
              {/* Clipboard clip */}
              <rect x="18" y="4" width="12" height="8" rx="2" stroke="var(--text-dimmed)" strokeWidth="2"
                fill="var(--surface-base)" />
              {/* Lines */}
              <line x1="16" y1="20" x2="32" y2="20" stroke="var(--border-default)" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="26" x2="28" y2="26" stroke="var(--border-default)" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="32" x2="24" y2="32" stroke="var(--border-default)" strokeWidth="2" strokeLinecap="round" />
              {/* Sparkle */}
              <circle cx="38" cy="10" r="2" fill="var(--aurora-violet)" opacity="0.6">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="42" cy="16" r="1.5" fill="var(--aurora-teal)" opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          {/* Glow behind */}
          <div className="absolute inset-0 -z-10 rounded-2xl"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
              filter: 'blur(20px)',
              animation: 'subtleBounce 3s ease-in-out infinite',
            }} />
        </div>

        <div>
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
            No tasks found
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Create your first task to get started
          </p>
          <p className="text-xs mt-2 flex items-center justify-center gap-1.5" style={{ color: 'var(--text-dimmed)' }}>
            Press <span className="kbd">N</span> to add a new task
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {tasks.map((task, idx) => (
        <div
          key={task.id}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDragEnd={handleDragEnd}
          onDragLeave={handleDragLeave}
          className="relative"
        >
          {/* Drop indicator line */}
          {overIndex === idx && dragIndex !== null && dragIndex !== idx && (
            <div className="absolute -top-1.5 left-0 right-0 h-0.5 rounded-full z-10"
              style={{
                background: 'linear-gradient(90deg, var(--aurora-violet), var(--aurora-teal))',
                boxShadow: '0 0 8px rgba(139, 92, 246, 0.5)',
              }}
            />
          )}
          <TaskItem
            task={task}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onFocus={onFocus}
            isDragging={dragIndex === idx}
            dragHandleProps={{
              onMouseDown: (e) => e.stopPropagation(),
            }}
            style={{ animationDelay: `${idx * 0.04}s` }}
          />
        </div>
      ))}
    </ul>
  );
}
