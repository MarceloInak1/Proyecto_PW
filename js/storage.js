/* ===================================================
   Flowo — capa de almacenamiento
   Por ahora usa localStorage (funciona sin backend,
   ideal para GitHub Pages). Si en el futuro conectas
   el backend de /backend, este es el único archivo
   que tendrías que adaptar para hablar con la API.
   =================================================== */

const FlowoStorage = (() => {
  const KEYS = {
    notes: 'flowo:notes',
    tasks: 'flowo:tasks',
    habits: 'flowo:habits',
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.error('Flowo: error leyendo', key, err);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('Flowo: error guardando', key, err);
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---------- Notas (braindump) ----------

  function getNotes() {
    return read(KEYS.notes, []);
  }

  function addNote(text) {
    const notes = getNotes();
    const note = {
      id: uid(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    notes.unshift(note);
    write(KEYS.notes, notes);
    return note;
  }

  function removeNote(id) {
    const notes = getNotes().filter((n) => n.id !== id);
    write(KEYS.notes, notes);
  }

  // ---------- Pendientes (tareas) ----------

  function getTasks() {
    return read(KEYS.tasks, []);
  }

  function addTask(task) {
    const tasks = getTasks();
    const full = {
      id: uid(),
      name: task.name,
      description: task.description || '',
      tag: task.tag || 'personal',
      frequency: task.frequency || 'semanal',
      date: task.date || '',
      done: false,
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(full);
    write(KEYS.tasks, tasks);
    return full;
  }

  function updateTask(id, changes) {
    const tasks = getTasks().map((t) => (t.id === id ? { ...t, ...changes } : t));
    write(KEYS.tasks, tasks);
  }

  function removeTask(id) {
    const tasks = getTasks().filter((t) => t.id !== id);
    write(KEYS.tasks, tasks);
  }

  // ---------- Hábitos (progreso) ----------

  function getHabits() {
    return read(KEYS.habits, []);
  }

  function addHabit(name) {
    const habits = getHabits();
    const habit = {
      id: uid(),
      name: name.trim(),
      // log: { 'YYYY-MM-DD': true }
      log: {},
      createdAt: new Date().toISOString(),
    };
    habits.push(habit);
    write(KEYS.habits, habits);
    return habit;
  }

  function toggleHabitToday(id) {
    const habits = getHabits();
    const today = new Date().toISOString().slice(0, 10);
    const habit = habits.find((h) => h.id === id);
    if (!habit) return null;
    if (habit.log[today]) {
      delete habit.log[today];
    } else {
      habit.log[today] = true;
    }
    write(KEYS.habits, habits);
    return habit;
  }

  return {
    getNotes,
    addNote,
    removeNote,
    getTasks,
    addTask,
    updateTask,
    removeTask,
    getHabits,
    addHabit,
    toggleHabitToday,
  };
})();
