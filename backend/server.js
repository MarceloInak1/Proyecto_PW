/**
 * Flowo — backend opcional
 *
 * API REST muy simple para notas (braindump), pendientes (tareas)
 * y hábitos. Usa un archivo JSON como base de datos (data/db.json),
 * suficiente para una sola persona o para probar antes de migrar
 * a una base de datos real (ej. Postgres/Supabase).
 *
 * Esto NO se ejecuta en GitHub Pages (que solo sirve archivos
 * estáticos). Para usarlo, despliega esta carpeta en un servicio
 * como Render, Railway o Fly.io, y luego apunta el frontend a esa URL
 * (ver README.md, sección "Conectar el frontend con el backend").
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

const app = express();
app.use(cors());
app.use(express.json());

/* ---------- Utilidades de "base de datos" ---------- */

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    return { notes: [], tasks: [], habits: [] };
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error('No se pudo leer db.json, iniciando vacío.', err);
    return { notes: [], tasks: [], habits: [] };
  }
}

function writeDB(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- Salud del servicio ---------- */

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* ---------- Notas (braindump) ---------- */

app.get('/api/notes', (req, res) => {
  const db = readDB();
  res.json(db.notes);
});

app.post('/api/notes', (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'El campo "text" es obligatorio.' });
  }
  const db = readDB();
  const note = { id: uid(), text: text.trim(), createdAt: new Date().toISOString() };
  db.notes.unshift(note);
  writeDB(db);
  res.status(201).json(note);
});

app.delete('/api/notes/:id', (req, res) => {
  const db = readDB();
  const before = db.notes.length;
  db.notes = db.notes.filter((n) => n.id !== req.params.id);
  if (db.notes.length === before) {
    return res.status(404).json({ error: 'Nota no encontrada.' });
  }
  writeDB(db);
  res.status(204).end();
});

/* ---------- Pendientes (tareas) ---------- */

app.get('/api/tasks', (req, res) => {
  const db = readDB();
  res.json(db.tasks);
});

app.post('/api/tasks', (req, res) => {
  const { name, description, tag, frequency, date } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El campo "name" es obligatorio.' });
  }
  const db = readDB();
  const task = {
    id: uid(),
    name: name.trim(),
    description: description || '',
    tag: tag || 'personal',
    frequency: frequency || 'semanal',
    date: date || '',
    done: false,
    createdAt: new Date().toISOString(),
  };
  db.tasks.unshift(task);
  writeDB(db);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const db = readDB();
  const task = db.tasks.find((t) => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Pendiente no encontrado.' });
  }
  Object.assign(task, req.body);
  writeDB(db);
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const db = readDB();
  const before = db.tasks.length;
  db.tasks = db.tasks.filter((t) => t.id !== req.params.id);
  if (db.tasks.length === before) {
    return res.status(404).json({ error: 'Pendiente no encontrado.' });
  }
  writeDB(db);
  res.status(204).end();
});

/* ---------- Hábitos (progreso) ---------- */

app.get('/api/habits', (req, res) => {
  const db = readDB();
  res.json(db.habits);
});

app.post('/api/habits', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El campo "name" es obligatorio.' });
  }
  const db = readDB();
  const habit = { id: uid(), name: name.trim(), log: {}, createdAt: new Date().toISOString() };
  db.habits.push(habit);
  writeDB(db);
  res.status(201).json(habit);
});

// Marca o desmarca el hábito para el día de hoy (YYYY-MM-DD)
app.post('/api/habits/:id/toggle', (req, res) => {
  const db = readDB();
  const habit = db.habits.find((h) => h.id === req.params.id);
  if (!habit) {
    return res.status(404).json({ error: 'Hábito no encontrado.' });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (habit.log[today]) {
    delete habit.log[today];
  } else {
    habit.log[today] = true;
  }
  writeDB(db);
  res.json(habit);
});

app.delete('/api/habits/:id', (req, res) => {
  const db = readDB();
  const before = db.habits.length;
  db.habits = db.habits.filter((h) => h.id !== req.params.id);
  if (db.habits.length === before) {
    return res.status(404).json({ error: 'Hábito no encontrado.' });
  }
  writeDB(db);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Flowo backend escuchando en http://localhost:${PORT}`);
});
