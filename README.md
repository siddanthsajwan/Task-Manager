# Personal Task Manager

A full-stack personal task manager built as part of the Studio Graphene Full Stack Developer assessment. One user, no authentication — just clean, fast task management.

**Live Demo:** _Add your deployed URL here after deployment_

---

## Tech Stack

| Layer    | Technology                          | Why                                               |
|----------|-------------------------------------|---------------------------------------------------|
| Backend  | Node.js + Express                   | Minimal, fast, easy to read                       |
| Storage  | JSON file (`server/data/tasks.json`)| No DB setup needed; persists across server restarts |
| Frontend | React 18 + Vite                     | Fast dev experience, functional components + hooks |
| Styling  | Tailwind CSS                        | Utility-first, keeps components clean             |
| IDs      | uuid v4                             | Collision-free task identifiers                   |

---

## Features

### Must Have ✅
- Add a task with title (required), optional description, and optional due date
- View all tasks sorted by creation date (newest first)
- Toggle a task complete / incomplete
- Edit a task's title, description, or due date
- Delete a task with an inline confirmation prompt
- Filter tasks by: All · Active · Completed

### Should Have ✅
- Active vs completed count shown in the stats bar
- Overdue tasks visually highlighted in red
- Empty state UI when no tasks match

### Bonus ✅
- Search tasks by title
- Tasks persist across server restarts (JSON file storage)

### Advanced Features ✅ (Standout Additions)
- **Drag-and-Drop Reordering** — Reorder tasks by dragging, with animated drop indicators and persisted custom order
- **Productivity Analytics Dashboard** — Sparkline charts, activity heatmap, streaks, velocity, priority/category breakdowns (all SVG, zero dependencies)
- **Optimistic Updates + Undo Delete** — UI updates instantly; rolls back on API error. Deleted tasks can be restored via toast undo button
- **Sub-tasks / Checklists** — Add checklist items to any task with per-item toggle and progress bar
- **Focus Timer (Pomodoro)** — Floating timer widget with 25/15/5 min presets, circular SVG progress, and browser notifications on completion
- **Keyboard shortcuts** — `N` new task, `/` search, `A` analytics, `Esc` close panels

---

## How to Run Locally

You only need **Node.js** installed (v18+).

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/personal-task-manager.git
cd personal-task-manager

# 2. Install dependencies
npm install --prefix server
npm install --prefix client

# 3. Start the backend (runs on http://localhost:5000)
cd server
npm run dev


# 4. In a second terminal, start the frontend (runs on http://localhost:5173)
cd client
npm run dev


# 5. Open http://localhost:5173 in your browser
```

### Run tests
```bash
cd server
npm test
```

---

## API Documentation

Base URL: `http://localhost:5000/api`

### `GET /tasks`
Returns all tasks sorted by custom order, then newest first.

| Query param | Type   | Description                          |
|-------------|--------|--------------------------------------|
| `status`    | string | `all` (default) · `active` · `completed` |
| `search`    | string | Filter by title (case-insensitive)   |

**Response 200**
```json
[
  {
    "id": "uuid",
    "title": "Buy milk",
    "description": "Full fat",
    "dueDate": "2026-12-01",
    "completed": false,
    "completedAt": null,
    "order": 0,
    "createdAt": "2026-06-03T10:00:00.000Z"
  }
]
```

---

### `GET /tasks/analytics`
Returns computed productivity stats.

**Response 200** — `{ total, completed, active, overdue, completionRate, dailyCompleted, dailyCreated, streak, velocity, categories, priorities }`

---

### `POST /tasks`
Create a new task.

**Request body**
```json
{
  "title": "Buy milk",        // required
  "description": "Full fat",  // optional
  "dueDate": "2026-12-01"     // optional, ISO date string
}
```

**Response 201** — the created task object  
**Response 400** — `{ "error": "Title is required" }`

---

### `PUT /tasks/:id`
Update a task (any combination of fields).

**Request body** (all fields optional)
```json
{
  "title": "Buy oat milk",
  "description": "From the top shelf",
  "dueDate": "2026-12-05",
  "completed": true
}
```

**Response 200** — the updated task object  
**Response 404** — `{ "error": "Task not found" }`

---

### `DELETE /tasks/:id`
Delete a task.

**Response 200** — `{ "message": "Task deleted", "task": { ... } }` (returns deleted task for undo)  
**Response 404** — `{ "error": "Task not found" }`

---

### `PUT /tasks/reorder`
Reorder tasks by providing an ordered array of task IDs.

**Request body**
```json
{
  "orderedIds": ["uuid-1", "uuid-3", "uuid-2"]
}
```

**Response 200** — `{ "message": "Tasks reordered", "count": 3 }`

---

## Project Structure

```
personal-task-manager/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── FilterBar.jsx    # Status filter tabs + search input
│   │   │   ├── StatsBar.jsx     # Active / completed counts
│   │   │   ├── TaskForm.jsx     # Add new task form
│   │   │   ├── TaskItem.jsx     # Single task row (view + edit + delete)
│   │   │   └── TaskList.jsx     # Renders list or empty state
│   │   ├── api.js               # All fetch calls to the backend
│   │   ├── App.jsx              # Root component, state + data fetching
│   │   ├── index.css            # Tailwind imports
│   │   └── main.jsx             # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── tasks.js         # CRUD route handlers
│   │   │   └── tasks.test.js    # Unit tests (Node built-in test runner)
│   │   ├── db.js                # JSON file read/write helpers
│   │   └── index.js             # Express app entry point
│   ├── data/
│   │   └── tasks.json           # Auto-created on first run
│   └── package.json
│
├── package.json             # Root scripts (install:all, dev:server, dev:client)
├── .gitignore
└── README.md
```

---

## Deployment

### Frontend → Vercel (recommended)
1. Push repo to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set **Root Directory** to `client`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
5. Deploy

### Backend → Render
1. Create a new **Web Service** on [render.com](https://render.com)
2. Set **Root Directory** to `server`
3. Build command: `npm install`
4. Start command: `node src/index.js`
5. Deploy — note the public URL and use it in the Vercel env var above

---

## What Works Well

- All CRUD operations are solid — create, read, update, delete all handle edge cases (empty title, unknown ID, etc.)
- JSON file persistence survives server restarts and is straightforward to swap out for a real DB
- The filter + search combination works correctly together (they compose, not conflict)
- Tests cover the actual business logic — not just "does the route exist" but "does it behave correctly"
- The UI clearly distinguishes overdue tasks, completed tasks, and active tasks at a glance

## Known Limitations & What I'd Improve With More Time

- **JSON file storage has race conditions** — if two requests hit the server simultaneously, one write could overwrite the other. For a single-user app this is fine, but I'd migrate to SQLite (`better-sqlite3`) for any real usage — the `db.js` module is the only file that would change.
- **Edit mode resets on re-render** — if the parent refreshes tasks while a task is in edit mode, the edit form closes. Fixing this would require keeping edit state outside the task list, which adds complexity not warranted for this scope.
- **Tests test logic, not the HTTP layer** — I extracted the handler logic to make tests fast and dependency-free, but that means the Express wiring itself isn't integration-tested. Adding supertest for a couple of end-to-end route tests would close that gap.

## What I Would Build Next

- **SQLite migration** — swap `db.js` for `better-sqlite3`; zero changes elsewhere in the codebase
- **Due date reminders** — a cron job (`node-cron`) on the server + browser Notification API
- **Collaborative mode** — WebSocket-based real-time sync for multi-user scenarios
- **Mobile app** — React Native wrapper reusing the existing component architecture
