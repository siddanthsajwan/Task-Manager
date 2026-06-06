import { useState, useEffect, useCallback, useRef } from 'react';
import { getTasks, createTask, updateTask, deleteTask, reorderTasks, recreateTask, sortTasks, filterByCategory, parseMeta } from './api';
import ToastProvider, { useToast } from './components/ToastContext';
import Background from './components/Background';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import FilterBar from './components/FilterBar';
import TaskList from './components/TaskList';
import ConfettiCanvas from './components/ConfettiCanvas';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import FocusTimer from './components/FocusTimer';

function AppContent() {
  const [tasks, setTasks]               = useState([]);
  const [allTasks, setAllTasks]         = useState([]);
  const [filter, setFilter]             = useState('all');
  const [search, setSearch]             = useState('');
  const [sort, setSort]                 = useState('custom');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [confetti, setConfetti]         = useState(0);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [focusTask, setFocusTask]       = useState(null);
  const prevCompletedRef                = useRef(null);
  const formRef                         = useRef(null);
  const undoTimerRef                    = useRef(null);
  const { addToast }                    = useToast();

  // ── Fetch tasks ──
  const fetchTasks = useCallback(async () => {
    try {
      setError(null);
      setTasks(await getTasks(filter, search));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [filter, search]);

  const fetchAllTasks = useCallback(async () => {
    try { setAllTasks(await getTasks('all', '')); } catch (_) {}
  }, []);

  useEffect(() => { fetchTasks(); fetchAllTasks(); }, [fetchTasks, fetchAllTasks]);

  const refresh = () => { fetchTasks(); fetchAllTasks(); };

  // ── Optimistic CRUD handlers ──
  const handleCreate = async (data) => {
    try {
      const created = await createTask(data);
      // Optimistic: add to local state immediately
      setTasks(prev => [created, ...prev]);
      setAllTasks(prev => [created, ...prev]);
      addToast({ message: 'Task created', type: 'success', duration: 3000 });
    } catch (err) {
      addToast({ message: err.message, type: 'error', duration: 4000 });
      refresh(); // Rollback on error
    }
  };

  const handleToggle = async (t) => {
    const newCompleted = !t.completed;

    // Optimistic update
    const updateInList = (list) =>
      list.map(task => task.id === t.id ? { ...task, completed: newCompleted } : task);
    setTasks(updateInList);
    setAllTasks(updateInList);

    try {
      await updateTask(t.id, { completed: newCompleted });
      addToast({
        message: newCompleted ? 'Task completed ✓' : 'Task marked active',
        type: newCompleted ? 'success' : 'info',
        duration: 3000,
      });
      // Refresh to get completedAt timestamp from server
      fetchAllTasks();
    } catch (err) {
      // Rollback
      const rollback = (list) =>
        list.map(task => task.id === t.id ? { ...task, completed: t.completed } : task);
      setTasks(rollback);
      setAllTasks(rollback);
      addToast({ message: err.message, type: 'error', duration: 4000 });
    }
  };

  const handleUpdate = async (id, u) => {
    // Optimistic update
    const prev = tasks.find(t => t.id === id);
    const updateInList = (list) =>
      list.map(task => task.id === id ? { ...task, ...u } : task);
    setTasks(updateInList);
    setAllTasks(updateInList);

    try {
      await updateTask(id, u);
      addToast({ message: 'Task updated', type: 'success', duration: 3000 });
      // Refresh to get server-canonical data
      refresh();
    } catch (err) {
      // Rollback
      if (prev) {
        const rollback = (list) =>
          list.map(task => task.id === id ? prev : task);
        setTasks(rollback);
        setAllTasks(rollback);
      }
      addToast({ message: err.message, type: 'error', duration: 4000 });
    }
  };

  const handleDelete = async (id) => {
    // Optimistic: remove from UI immediately
    const taskToDelete = allTasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    setAllTasks(prev => prev.filter(t => t.id !== id));

    try {
      await deleteTask(id);

      // Show toast with undo
      addToast({
        message: 'Task deleted',
        type: 'warning',
        duration: 6000,
        undoAction: taskToDelete ? async () => {
          try {
            await recreateTask({
              title: taskToDelete.title,
              description: taskToDelete.description,
              dueDate: taskToDelete.dueDate,
            });
            refresh();
            addToast({ message: 'Task restored!', type: 'success', duration: 3000 });
          } catch (_) {
            addToast({ message: 'Failed to restore task', type: 'error', duration: 4000 });
          }
        } : undefined,
      });
    } catch (err) {
      // Rollback: re-add the task
      if (taskToDelete) {
        setTasks(prev => [...prev, taskToDelete]);
        setAllTasks(prev => [...prev, taskToDelete]);
      }
      addToast({ message: err.message, type: 'error', duration: 4000 });
    }
  };

  // ── Reorder handler ──
  const handleReorder = async (orderedIds) => {
    // Optimistic: reorder locally
    const ordered = orderedIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);
    setTasks(ordered);

    try {
      await reorderTasks(orderedIds);
    } catch (err) {
      // Rollback
      refresh();
      addToast({ message: 'Failed to reorder', type: 'error', duration: 3000 });
    }
  };

  // ── Focus timer ──
  const handleStartFocus = (task) => {
    setFocusTask(task);
    addToast({ message: `Focusing on: ${task.title}`, type: 'info', duration: 2000 });
  };

  const handleFocusComplete = () => {
    addToast({ message: '🎯 Focus session complete!', type: 'success', duration: 5000 });
  };

  // ── Derived data ──
  const completed = allTasks.filter(t => t.completed).length;
  const total = allTasks.length;
  const active = total - completed;

  // Apply client-side sorting and category filtering
  const displayTasks = sortTasks(filterByCategory(tasks, categoryFilter), sort);

  // Task counts for FilterBar badges
  const taskCounts = {
    all: allTasks.length,
    active: allTasks.filter(t => !t.completed).length,
    completed: allTasks.filter(t => t.completed).length,
  };

  // ── Confetti on 100% completion ──
  useEffect(() => {
    if (prevCompletedRef.current !== null && total > 0 && completed === total && prevCompletedRef.current < total) {
      setConfetti(c => c + 1);
      addToast({ message: '🎉 All tasks completed!', type: 'success', duration: 5000 });
    }
    prevCompletedRef.current = completed;
  }, [completed, total, addToast]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      // Don't fire in input fields
      if (e.target.matches('input, textarea, select')) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        formRef.current?.focus();
      }
      if (e.key === 'Escape') {
        formRef.current?.collapse();
        setSidebarOpen(false);
        setAnalyticsOpen(false);
      }
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setAnalyticsOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Background />
      <ConfettiCanvas fire={confetti} />

      {/* Sidebar */}
      <Sidebar
        completed={completed}
        total={total}
        allTasks={allTasks}
        categoryFilter={categoryFilter}
        onCategoryChange={(cat) => { setCategoryFilter(cat); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAnalytics={() => { setAnalyticsOpen(true); setSidebarOpen(false); }}
      />

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />

      {/* Focus Timer */}
      {focusTask && (
        <FocusTimer
          task={focusTask}
          onClose={() => setFocusTask(null)}
          onComplete={handleFocusComplete}
        />
      )}

      {/* Main Content */}
      <div className="main-content relative" style={{ zIndex: 10 }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-20">

          {/* Header */}
          <Header onToggleSidebar={() => setSidebarOpen(s => !s)} />

          {/* Task Panel */}
          <div className="glass-panel-elevated overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center gap-2 px-5 py-3.5"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: 'var(--aurora-rose)', boxShadow: '0 0 6px rgba(244, 63, 94, 0.5)' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: 'var(--aurora-amber)' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: 'var(--aurora-emerald)' }} />
              </div>
              <div className="flex-1" />
              <span className="text-xs font-mono font-medium uppercase tracking-widest" style={{ color: 'var(--text-dimmed)' }}>
                taskflow
              </span>
            </div>

            {/* Panel body */}
            <div className="px-5 py-5 space-y-1">
              <TaskForm onSubmit={handleCreate} formRef={formRef} />
              <FilterBar
                filter={filter} onFilterChange={setFilter}
                search={search} onSearchChange={setSearch}
                sort={sort} onSortChange={setSort}
                taskCounts={taskCounts}
              />

              {error && (
                <div className="p-3 rounded-xl text-xs font-medium flex items-center gap-2"
                  style={{
                    background: 'rgba(244, 63, 94, 0.07)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    color: 'var(--aurora-rose)',
                  }}>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error} — make sure the backend server is running
                </div>
              )}

              {loading ? (
                <div className="py-16 flex flex-col items-center gap-4">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 opacity-10"
                      style={{ borderColor: 'var(--aurora-violet)' }} />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent"
                      style={{ borderTopColor: 'var(--aurora-violet)', animation: 'spin 0.8s linear infinite' }} />
                    <div className="absolute inset-2 rounded-full border-2 border-transparent"
                      style={{ borderTopColor: 'var(--aurora-teal)', animation: 'spin 1.3s linear infinite reverse' }} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-dimmed)' }}>
                    Loading tasks...
                  </p>
                </div>
              ) : (
                <TaskList
                  tasks={displayTasks}
                  onToggle={handleToggle}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onReorder={handleReorder}
                  onFocus={handleStartFocus}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center mt-8 text-xs font-medium" style={{ color: 'var(--text-dimmed)', opacity: 0.5 }}>
            Taskflow &nbsp;·&nbsp; Personal Task Manager
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
