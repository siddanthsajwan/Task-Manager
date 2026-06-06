const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/tasks.json');

// Ensure data directory and file exist
function ensureDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
  }
}

function readTasks() {
  ensureDB();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeTasks(tasks) {
  ensureDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(tasks, null, 2));
}

module.exports = { readTasks, writeTasks };
