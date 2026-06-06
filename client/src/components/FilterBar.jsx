import { useState, useEffect, useRef, useCallback } from 'react';

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Done' },
];

const SORT_OPTIONS = [
  { key: 'custom',   label: 'Custom Order' },
  { key: 'newest',   label: 'Newest First' },
  { key: 'oldest',   label: 'Oldest First' },
  { key: 'dueDate',  label: 'Due Date' },
  { key: 'priority', label: 'Priority' },
];

export default function FilterBar({
  filter, onFilterChange,
  search, onSearchChange,
  sort, onSortChange,
  taskCounts,
}) {
  const [localSearch, setLocalSearch] = useState(search);
  const [sortOpen, setSortOpen] = useState(false);
  const debounceRef = useRef(null);
  const searchRef = useRef(null);

  // Debounced search
  const debouncedSearch = useCallback((value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  }, [onSearchChange]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    debouncedSearch(val);
  };

  const clearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
    searchRef.current?.focus();
  };

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.sort-dropdown')) setSortOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [sortOpen]);

  // Expose searchRef for keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Filter pills + Sort */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 p-1 rounded-xl flex-1"
          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)' }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => onFilterChange(f.key)}
              className={`btn-filter flex items-center justify-center gap-1.5 flex-1 ${filter === f.key ? 'active' : ''}`}>
              {f.label}
              {taskCounts && taskCounts[f.key] !== undefined && (
                <span className="text-xs font-mono opacity-70">
                  {taskCounts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="relative sort-dropdown">
          <button onClick={(e) => { e.stopPropagation(); setSortOpen(!sortOpen); }}
            className="btn-ghost flex items-center gap-1" title="Sort tasks">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full mt-1 py-1 rounded-xl z-20 min-w-[160px]"
              style={{
                background: 'var(--surface-overlay)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-default)',
                boxShadow: 'var(--shadow-lg)',
              }}>
              {SORT_OPTIONS.map(s => (
                <button key={s.key} onClick={() => { onSortChange(s.key); setSortOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2"
                  style={{
                    color: sort === s.key ? 'var(--text-primary)' : 'var(--text-muted)',
                    background: sort === s.key ? 'var(--surface-elevated)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (sort !== s.key) e.currentTarget.style.background = 'var(--surface-raised)'; }}
                  onMouseLeave={e => { if (sort !== s.key) e.currentTarget.style.background = 'transparent'; }}>
                  {sort === s.key && (
                    <svg className="w-3 h-3" style={{ color: 'var(--aurora-violet)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: 'var(--text-dimmed)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={localSearch}
          onChange={handleSearchInput}
          placeholder='Search tasks... (press "/")'
          className="input-base w-full pl-10 pr-10"
          id="search-tasks"
        />
        {localSearch ? (
          <button onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 btn-ghost p-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 kbd text-xs">/</span>
        )}
      </div>
    </div>
  );
}
