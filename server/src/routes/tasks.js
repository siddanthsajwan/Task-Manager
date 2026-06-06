const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readTasks, writeTasks } = require('../db');

const router = express.Router();

// GET /api/tasks - Get all tasks, sorted by order then createdAt desc
// Query: ?status=all|active|completed&search=<string>
router.get('/', (req, res) => {
  const { status, search } = req.query;
  let tasks = readTasks();

  // Sort by order (if present), then newest first as fallback
  tasks.sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : Infinity;
    const ob = typeof b.order === 'number' ? b.order : Infinity;
    if (oa !== ob) return oa - ob;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Filter by status
  if (status === 'active') {
    tasks = tasks.filter((t) => !t.completed);
  } else if (status === 'completed') {
    tasks = tasks.filter((t) => t.completed);
  }

  // Search by title
  if (search && search.trim()) {
    const q = search.toLowerCase();
    tasks = tasks.filter((t) => t.title.toLowerCase().includes(q));
  }

  res.json(tasks);
});

// GET /api/tasks/analytics - Computed productivity stats
router.get('/analytics', (req, res) => {
  const tasks = readTasks();
  const now = new Date();
  const today = new Date(now.toDateString());

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;
  const overdue = tasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < today
  ).length;

  // Completion rate
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Tasks completed per day (last 7 days)
  const dailyCompleted = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    const count = tasks.filter((t) => {
      if (!t.completedAt) return false;
      return t.completedAt.startsWith(dayStr);
    }).length;
    dailyCompleted.push({ date: dayStr, count });
  }

  // Tasks created per day (last 7 days)
  const dailyCreated = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    const count = tasks.filter((t) => t.createdAt && t.createdAt.startsWith(dayStr)).length;
    dailyCreated.push({ date: dayStr, count });
  }

  // Current streak (consecutive days with at least 1 completion)
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    const hasCompletion = tasks.some((t) => t.completedAt && t.completedAt.startsWith(dayStr));
    if (hasCompletion) {
      streak++;
    } else if (i > 0) {
      // Skip today if nothing completed yet
      break;
    }
  }

  // Average tasks completed per day (last 30 days)
  let last30 = 0;
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    last30 += tasks.filter((t) => t.completedAt && t.completedAt.startsWith(dayStr)).length;
  }
  const velocity = Math.round((last30 / 30) * 10) / 10;

  // Category breakdown
  const META_REGEX = /^\[priority:(\w+)\]\[category:(\w+)\]\s*/;
  const categoryMap = {};
  for (const t of tasks) {
    const match = t.description ? t.description.match(META_REGEX) : null;
    const cat = match ? match[2] : 'none';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, completed: 0 };
    categoryMap[cat].total++;
    if (t.completed) categoryMap[cat].completed++;
  }

  // Priority breakdown
  const priorityMap = {};
  for (const t of tasks) {
    const match = t.description ? t.description.match(META_REGEX) : null;
    const pri = match ? match[1] : 'none';
    if (!priorityMap[pri]) priorityMap[pri] = { total: 0, completed: 0 };
    priorityMap[pri].total++;
    if (t.completed) priorityMap[pri].completed++;
  }

  res.json({
    total,
    completed,
    active,
    overdue,
    completionRate,
    dailyCompleted,
    dailyCreated,
    streak,
    velocity,
    categories: categoryMap,
    priorities: priorityMap,
  });
});

// POST /api/tasks - Create a new task
router.post('/', (req, res) => {
  const { title, description, dueDate } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Assign order: place at end of existing tasks
  const tasks = readTasks();
  const maxOrder = tasks.reduce((max, t) => Math.max(max, typeof t.order === 'number' ? t.order : -1), -1);

  const task = {
    id: uuidv4(),
    title: title.trim(),
    description: description ? description.trim() : '',
    dueDate: dueDate || null,
    completed: false,
    completedAt: null,
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  writeTasks(tasks);

  res.status(201).json(task);
});

// PUT /api/tasks/reorder - Reorder tasks by providing an array of { id, order }
router.put('/reorder', (req, res) => {
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds must be an array of task IDs' });
  }

  const tasks = readTasks();

  // Update order based on position in the array
  for (let i = 0; i < orderedIds.length; i++) {
    const task = tasks.find((t) => t.id === orderedIds[i]);
    if (task) {
      task.order = i;
    }
  }

  writeTasks(tasks);
  res.json({ message: 'Tasks reordered', count: orderedIds.length });
});

// PUT /api/tasks/:id - Update a task (title, description, dueDate, completed)
router.put('/:id', (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, dueDate, completed } = req.body;

  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  // Track completedAt timestamp for analytics
  let completedAt = tasks[index].completedAt;
  if (completed !== undefined) {
    if (completed && !tasks[index].completed) {
      // Just being marked complete
      completedAt = new Date().toISOString();
    } else if (!completed && tasks[index].completed) {
      // Being marked incomplete
      completedAt = null;
    }
  }

  tasks[index] = {
    ...tasks[index],
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(dueDate !== undefined && { dueDate }),
    ...(completed !== undefined && { completed }),
    completedAt,
  };

  writeTasks(tasks);
  res.json(tasks[index]);
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', (req, res) => {
  const tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const deleted = tasks.splice(index, 1)[0];
  writeTasks(tasks);

  // Return the deleted task so client can undo
  res.json({ message: 'Task deleted', task: deleted });
});

module.exports = router;
