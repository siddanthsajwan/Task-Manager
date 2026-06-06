const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

// ── In-memory store (Vercel serverless has no persistent filesystem) ──
let tasks = [];

function readTasks() {
  return tasks;
}

function writeTasks(newTasks) {
  tasks = newTasks;
}

// ── Routes ──

// GET /api/tasks
app.get('/api/tasks', (req, res) => {
  const { status, search } = req.query;
  let result = readTasks();

  result.sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : Infinity;
    const ob = typeof b.order === 'number' ? b.order : Infinity;
    if (oa !== ob) return oa - ob;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (status === 'active') {
    result = result.filter((t) => !t.completed);
  } else if (status === 'completed') {
    result = result.filter((t) => t.completed);
  }

  if (search && search.trim()) {
    const q = search.toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(q));
  }

  res.json(result);
});

// GET /api/tasks/analytics
app.get('/api/tasks/analytics', (req, res) => {
  const allTasks = readTasks();
  const now = new Date();
  const today = new Date(now.toDateString());

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.completed).length;
  const active = total - completed;
  const overdue = allTasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < today
  ).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const dailyCompleted = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    const count = allTasks.filter((t) => {
      if (!t.completedAt) return false;
      return t.completedAt.startsWith(dayStr);
    }).length;
    dailyCompleted.push({ date: dayStr, count });
  }

  const dailyCreated = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    const count = allTasks.filter((t) => t.createdAt && t.createdAt.startsWith(dayStr)).length;
    dailyCreated.push({ date: dayStr, count });
  }

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    const hasCompletion = allTasks.some((t) => t.completedAt && t.completedAt.startsWith(dayStr));
    if (hasCompletion) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  let last30 = 0;
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayStr = day.toISOString().split('T')[0];
    last30 += allTasks.filter((t) => t.completedAt && t.completedAt.startsWith(dayStr)).length;
  }
  const velocity = Math.round((last30 / 30) * 10) / 10;

  const META_REGEX = /^\[priority:(\w+)\]\[category:(\w+)\]\s*/;
  const categoryMap = {};
  for (const t of allTasks) {
    const match = t.description ? t.description.match(META_REGEX) : null;
    const cat = match ? match[2] : 'none';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, completed: 0 };
    categoryMap[cat].total++;
    if (t.completed) categoryMap[cat].completed++;
  }

  const priorityMap = {};
  for (const t of allTasks) {
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

// POST /api/tasks
app.post('/api/tasks', (req, res) => {
  const { title, description, dueDate } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const allTasks = readTasks();
  const maxOrder = allTasks.reduce((max, t) => Math.max(max, typeof t.order === 'number' ? t.order : -1), -1);

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

  allTasks.push(task);
  writeTasks(allTasks);

  res.status(201).json(task);
});

// PUT /api/tasks/reorder
app.put('/api/tasks/reorder', (req, res) => {
  const { orderedIds } = req.body;

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds must be an array of task IDs' });
  }

  const allTasks = readTasks();

  for (let i = 0; i < orderedIds.length; i++) {
    const task = allTasks.find((t) => t.id === orderedIds[i]);
    if (task) {
      task.order = i;
    }
  }

  writeTasks(allTasks);
  res.json({ message: 'Tasks reordered', count: orderedIds.length });
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', (req, res) => {
  const allTasks = readTasks();
  const index = allTasks.findIndex((t) => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, dueDate, completed } = req.body;

  if (title !== undefined && !title.trim()) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  let completedAt = allTasks[index].completedAt;
  if (completed !== undefined) {
    if (completed && !allTasks[index].completed) {
      completedAt = new Date().toISOString();
    } else if (!completed && allTasks[index].completed) {
      completedAt = null;
    }
  }

  allTasks[index] = {
    ...allTasks[index],
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(dueDate !== undefined && { dueDate }),
    ...(completed !== undefined && { completed }),
    completedAt,
  };

  writeTasks(allTasks);
  res.json(allTasks[index]);
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
  const allTasks = readTasks();
  const index = allTasks.findIndex((t) => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const deleted = allTasks.splice(index, 1)[0];
  writeTasks(allTasks);

  res.json({ message: 'Task deleted', task: deleted });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
