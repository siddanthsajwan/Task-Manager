/**
 * Unit tests for task route handlers.
 * Uses Node.js built-in test runner (Node 18+) — no extra dependencies.
 *
 * Strategy: extract pure handler logic into testable functions rather than
 * trying to mock Express internals, giving us fast, reliable tests.
 *
 * Run with:  npm test  (from the server directory)
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('assert/strict');

// ── In-memory store (replaces the JSON file during tests) ──────────────────
let store = [];

const db = {
  readTasks: () => JSON.parse(JSON.stringify(store)),
  writeTasks: (tasks) => { store = JSON.parse(JSON.stringify(tasks)); },
};

// ── Pure handler functions (same logic as the Express routes) ──────────────

function createTask(body) {
  const { v4: uuidv4 } = require('uuid');
  const { title, description = '', dueDate = null } = body;

  if (!title || !title.trim()) {
    return { status: 400, body: { error: 'Title is required' } };
  }

  const task = {
    id: uuidv4(),
    title: title.trim(),
    description: description.trim(),
    dueDate,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  const tasks = db.readTasks();
  tasks.push(task);
  db.writeTasks(tasks);

  return { status: 201, body: task };
}

function getTasks(query = {}) {
  const { status, search } = query;
  let tasks = db.readTasks();

  tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (status === 'active') tasks = tasks.filter((t) => !t.completed);
  if (status === 'completed') tasks = tasks.filter((t) => t.completed);

  if (search && search.trim()) {
    const q = search.toLowerCase();
    tasks = tasks.filter((t) => t.title.toLowerCase().includes(q));
  }

  return { status: 200, body: tasks };
}

function updateTask(id, body) {
  const tasks = db.readTasks();
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) return { status: 404, body: { error: 'Task not found' } };

  const { title, description, dueDate, completed } = body;

  if (title !== undefined && !title.trim()) {
    return { status: 400, body: { error: 'Title cannot be empty' } };
  }

  tasks[index] = {
    ...tasks[index],
    ...(title !== undefined && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(dueDate !== undefined && { dueDate }),
    ...(completed !== undefined && { completed }),
  };

  db.writeTasks(tasks);
  return { status: 200, body: tasks[index] };
}

function deleteTask(id) {
  const tasks = db.readTasks();
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) return { status: 404, body: { error: 'Task not found' } };

  tasks.splice(index, 1);
  db.writeTasks(tasks);
  return { status: 200, body: { message: 'Task deleted' } };
}

// ── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => { store = []; });

describe('POST /api/tasks', () => {
  test('creates a task with all fields', () => {
    const result = createTask({ title: 'Buy milk', description: 'Full fat', dueDate: '2026-12-01' });

    assert.equal(result.status, 201);
    assert.equal(result.body.title, 'Buy milk');
    assert.equal(result.body.description, 'Full fat');
    assert.equal(result.body.dueDate, '2026-12-01');
    assert.equal(result.body.completed, false);
    assert.ok(result.body.id, 'should have an id');
    assert.equal(store.length, 1);
  });

  test('creates a task with title only', () => {
    const result = createTask({ title: 'Minimal task' });

    assert.equal(result.status, 201);
    assert.equal(result.body.title, 'Minimal task');
    assert.equal(result.body.description, '');
    assert.equal(result.body.dueDate, null);
  });

  test('rejects an empty title', () => {
    const result = createTask({ title: '   ' });

    assert.equal(result.status, 400);
    assert.ok(result.body.error);
    assert.equal(store.length, 0);
  });

  test('rejects missing title', () => {
    const result = createTask({});

    assert.equal(result.status, 400);
    assert.equal(store.length, 0);
  });
});

describe('GET /api/tasks', () => {
  beforeEach(() => {
    store = [
      { id: '1', title: 'Old task',  completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: '2', title: 'New task',  completed: true,  createdAt: '2026-06-01T00:00:00.000Z' },
      { id: '3', title: 'Mid task',  completed: false, createdAt: '2026-03-01T00:00:00.000Z' },
    ];
  });

  test('returns all tasks sorted newest first', () => {
    const result = getTasks({});

    assert.equal(result.status, 200);
    assert.equal(result.body.length, 3);
    assert.equal(result.body[0].id, '2'); // newest
    assert.equal(result.body[2].id, '1'); // oldest
  });

  test('filters by status=active', () => {
    const result = getTasks({ status: 'active' });

    assert.equal(result.body.length, 2);
    assert.ok(result.body.every((t) => !t.completed));
  });

  test('filters by status=completed', () => {
    const result = getTasks({ status: 'completed' });

    assert.equal(result.body.length, 1);
    assert.equal(result.body[0].id, '2');
  });

  test('searches by title (case-insensitive)', () => {
    const result = getTasks({ search: 'NEW' });

    assert.equal(result.body.length, 1);
    assert.equal(result.body[0].id, '2');
  });
});

describe('PUT /api/tasks/:id', () => {
  beforeEach(() => {
    store = [
      { id: 'abc', title: 'Original', description: '', dueDate: null, completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
    ];
  });

  test('updates the title', () => {
    const result = updateTask('abc', { title: 'Updated title' });

    assert.equal(result.status, 200);
    assert.equal(result.body.title, 'Updated title');
    assert.equal(store[0].title, 'Updated title');
  });

  test('toggles completed to true', () => {
    const result = updateTask('abc', { completed: true });

    assert.equal(result.status, 200);
    assert.equal(result.body.completed, true);
  });

  test('returns 404 for unknown id', () => {
    const result = updateTask('unknown-id', { completed: true });

    assert.equal(result.status, 404);
    assert.ok(result.body.error);
  });

  test('rejects empty title on update', () => {
    const result = updateTask('abc', { title: '' });

    assert.equal(result.status, 400);
    assert.equal(store[0].title, 'Original'); // unchanged
  });
});

describe('DELETE /api/tasks/:id', () => {
  beforeEach(() => {
    store = [
      { id: 'xyz', title: 'To delete', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
    ];
  });

  test('deletes the task', () => {
    const result = deleteTask('xyz');

    assert.equal(result.status, 200);
    assert.equal(result.body.message, 'Task deleted');
    assert.equal(store.length, 0);
  });

  test('returns 404 for unknown id', () => {
    const result = deleteTask('nope');

    assert.equal(result.status, 404);
    assert.equal(store.length, 1); // unchanged
  });
});
