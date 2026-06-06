const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const getTasks = (status, search) => {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (search) params.set('search', search);
  const query = params.toString();
  return request(`/tasks${query ? `?${query}` : ''}`);
};

export const createTask = (task) =>
  request('/tasks', { method: 'POST', body: JSON.stringify(task) });

export const updateTask = (id, updates) =>
  request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

export const deleteTask = (id) =>
  request(`/tasks/${id}`, { method: 'DELETE' });

export const reorderTasks = (orderedIds) =>
  request('/tasks/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) });

export const getAnalytics = () =>
  request('/tasks/analytics');

// Re-create a task (for undo delete)
export const recreateTask = (task) =>
  request('/tasks', { method: 'POST', body: JSON.stringify(task) });

/* ── Meta encoding / decoding ── */
// Encodes priority, category, and subtasks into the description field as a prefix:
//   [priority:high][category:work][subtasks:JSON] Actual description text
// This keeps metadata round-trippable without backend changes.

const META_REGEX = /^\[priority:(\w+)\]\[category:(\w+)\](?:\[subtasks:(.*?)\])?\s*/;

export function parseMeta(description) {
  if (!description) return { priority: 'none', category: 'none', subtasks: [], text: '' };
  const match = description.match(META_REGEX);
  if (!match) return { priority: 'none', category: 'none', subtasks: [], text: description };

  let subtasks = [];
  if (match[3]) {
    try {
      subtasks = JSON.parse(match[3]);
    } catch (_) {
      subtasks = [];
    }
  }

  return {
    priority: match[1] || 'none',
    category: match[2] || 'none',
    subtasks,
    text: description.slice(match[0].length),
  };
}

export function encodeMeta(priority, category, text, subtasks = []) {
  if (
    (!priority || priority === 'none') &&
    (!category || category === 'none') &&
    (!subtasks || subtasks.length === 0)
  ) {
    return text || '';
  }
  let prefix = `[priority:${priority || 'none'}][category:${category || 'none'}]`;
  if (subtasks && subtasks.length > 0) {
    prefix += `[subtasks:${JSON.stringify(subtasks)}]`;
  }
  return prefix + (text ? ' ' + text : '');
}

/* ── Priority sort helper ── */
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2, none: 3 };

export function sortTasks(tasks, sortKey) {
  const sorted = [...tasks];
  switch (sortKey) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    case 'priority':
      return sorted.sort((a, b) => {
        const pa = parseMeta(a.description).priority;
        const pb = parseMeta(b.description).priority;
        return (PRIORITY_ORDER[pa] ?? 3) - (PRIORITY_ORDER[pb] ?? 3);
      });
    case 'custom':
      // Custom order: sort by order field (already set by server)
      return sorted.sort((a, b) => {
        const oa = typeof a.order === 'number' ? a.order : Infinity;
        const ob = typeof b.order === 'number' ? b.order : Infinity;
        return oa - ob;
      });
    default:
      return sorted;
  }
}

/* ── Category filter helper ── */
export function filterByCategory(tasks, category) {
  if (!category || category === 'all') return tasks;
  return tasks.filter(t => {
    const meta = parseMeta(t.description);
    return meta.category === category;
  });
}
