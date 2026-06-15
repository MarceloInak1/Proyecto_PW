/* ===================================================
   Flowo — lógica de la interfaz
   =================================================== */

(() => {
  'use strict';

  /* ---------- Tema claro/oscuro ---------- */

  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const THEME_KEY = 'flowo:theme';

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    const label = theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro';
    themeToggle.querySelector('.visually-hidden').textContent = label;
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      applyTheme(saved);
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  initTheme();

  /* ---------- Helpers ---------- */

  function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  }

  function formatTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  const TAG_LABELS = {
    personal: 'Personal',
    trabajo: 'Trabajo',
    escuela: 'Escuela',
    familia: 'Familia',
  };

  const FREQ_LABELS = {
    diario: 'Diario',
    semanal: 'Semanal',
    mensual: 'Mensual',
    anual: 'Anual',
  };

  /* ---------- Braindump: formulario rápido ---------- */

  const dumpForm = document.getElementById('dump-form');
  const dumpInput = document.getElementById('dump-input');
  const dumpStatus = document.getElementById('dump-status');
  const muralList = document.getElementById('mural-list');
  const muralEmpty = document.getElementById('mural-empty');

  function renderNote(note) {
    const li = document.createElement('li');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'note';
    btn.dataset.id = note.id;
    btn.setAttribute('aria-label', `Idea: ${note.text}. Presiona para convertir en pendiente.`);

    const text = document.createElement('span');
    text.className = 'note-text';
    text.textContent = note.text;

    const meta = document.createElement('span');
    meta.className = 'note-meta';
    meta.innerHTML = `<span>${formatTime(note.createdAt)}</span><span class="note-action">organizar →</span>`;

    btn.appendChild(text);
    btn.appendChild(meta);
    li.appendChild(btn);

    muralList.prepend(li);
  }

  function renderAllNotes() {
    muralList.innerHTML = '';
    const notes = FlowoStorage.getNotes();
    notes
      .slice()
      .reverse()
      .forEach(renderNote);
    updateMuralEmptyState();
  }

  function updateMuralEmptyState() {
    const hasNotes = muralList.children.length > 0;
    muralEmpty.hidden = hasNotes;
  }

  dumpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = dumpInput.value.trim();
    if (!text) return;

    const note = FlowoStorage.addNote(text);
    renderNote(note);
    updateMuralEmptyState();

    dumpInput.value = '';
    dumpStatus.textContent = 'Idea guardada en tu braindump.';
    window.setTimeout(() => {
      if (dumpStatus.textContent === 'Idea guardada en tu braindump.') {
        dumpStatus.textContent = '';
      }
    }, 4000);
  });

  // Enter envía, Shift+Enter hace salto de línea
  dumpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      dumpForm.requestSubmit();
    }
  });

  /* ---------- Diálogo: organizar idea -> pendiente ---------- */

  const overlay = document.getElementById('organize-overlay');
  const organizeForm = document.getElementById('organize-form');
  const dialogCancel = document.getElementById('dialog-cancel');
  const taskNameInput = document.getElementById('task-name');
  const taskTagSelect = document.getElementById('task-tag');
  const taskFrequencySelect = document.getElementById('task-frequency');
  const taskDateInput = document.getElementById('task-date');
  const taskDescInput = document.getElementById('task-desc');

  let activeNoteId = null;
  let lastFocusedElement = null;

  function openOrganizeDialog(noteId, noteText) {
    activeNoteId = noteId;
    lastFocusedElement = document.activeElement;

    taskNameInput.value = noteText.length > 60 ? noteText.slice(0, 60) : noteText;
    taskTagSelect.value = 'personal';
    taskFrequencySelect.value = 'semanal';
    taskDateInput.value = '';
    taskDescInput.value = '';

    overlay.hidden = false;
    taskNameInput.focus();
    document.addEventListener('keydown', onDialogKeydown);
  }

  function closeOrganizeDialog() {
    overlay.hidden = true;
    activeNoteId = null;
    document.removeEventListener('keydown', onDialogKeydown);
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function onDialogKeydown(e) {
    if (e.key === 'Escape') {
      closeOrganizeDialog();
      return;
    }
    if (e.key === 'Tab') {
      trapFocus(e);
    }
  }

  function trapFocus(e) {
    const focusable = overlay.querySelectorAll('input, select, textarea, button');
    const list = Array.prototype.slice.call(focusable);
    if (list.length === 0) return;
    const first = list[0];
    const last = list[list.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  muralList.addEventListener('click', (e) => {
    const noteBtn = e.target.closest('.note');
    if (!noteBtn) return;
    const note = FlowoStorage.getNotes().find((n) => n.id === noteBtn.dataset.id);
    if (!note) return;
    openOrganizeDialog(note.id, note.text);
  });

  dialogCancel.addEventListener('click', closeOrganizeDialog);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOrganizeDialog();
  });

  organizeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = taskNameInput.value.trim();
    if (!name) return;

    const task = FlowoStorage.addTask({
      name,
      tag: taskTagSelect.value,
      frequency: taskFrequencySelect.value,
      date: taskDateInput.value,
      description: taskDescInput.value.trim(),
    });

    if (activeNoteId) {
      FlowoStorage.removeNote(activeNoteId);
      const el = muralList.querySelector(`[data-id="${activeNoteId}"]`);
      if (el) el.closest('li').remove();
      updateMuralEmptyState();
    }

    renderTask(task);
    updateTasksEmptyState();
    applyTaskFilter(currentFilter);
    closeOrganizeDialog();

    // Llevar el foco a la sección de pendientes
    document.getElementById('pendientes').scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- Pendientes (tareas) ---------- */

  const tasksList = document.getElementById('tasks-list');
  const tasksEmpty = document.getElementById('tasks-empty');
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  let currentFilter = 'todos';

  function renderTask(task) {
    const li = document.createElement('li');
    li.className = 'task';
    li.dataset.id = task.id;
    li.dataset.frequency = task.frequency;

    const checkboxId = `task-check-${task.id}`;

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'task-check';
    check.id = checkboxId;
    check.checked = task.done;
    check.setAttribute('aria-label', `Marcar «${task.name}» como completado`);

    const body = document.createElement('div');
    body.className = 'task-body';

    const nameLabel = document.createElement('label');
    nameLabel.className = 'task-name' + (task.done ? ' is-done' : '');
    nameLabel.htmlFor = checkboxId;
    nameLabel.textContent = task.name;

    body.appendChild(nameLabel);

    if (task.description) {
      const desc = document.createElement('p');
      desc.className = 'task-desc';
      desc.textContent = task.description;
      body.appendChild(desc);
    }

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const tag = document.createElement('span');
    tag.className = `tag tag-${task.tag}`;
    tag.textContent = TAG_LABELS[task.tag] || task.tag;
    meta.appendChild(tag);

    const freq = document.createElement('span');
    freq.className = 'tag';
    freq.style.background = 'transparent';
    freq.style.border = '1px solid var(--border)';
    freq.style.color = 'var(--text-soft)';
    freq.textContent = FREQ_LABELS[task.frequency] || task.frequency;
    meta.appendChild(freq);

    if (task.date) {
      const date = document.createElement('span');
      date.className = 'task-date';
      date.textContent = formatDate(task.date);
      meta.appendChild(date);
    }

    body.appendChild(meta);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task-delete';
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.setAttribute('aria-label', `Eliminar pendiente «${task.name}»`);

    li.appendChild(check);
    li.appendChild(body);
    li.appendChild(deleteBtn);

    tasksList.prepend(li);
  }

  function renderAllTasks() {
    tasksList.innerHTML = '';
    const tasks = FlowoStorage.getTasks();
    tasks
      .slice()
      .reverse()
      .forEach(renderTask);
    updateTasksEmptyState();
    applyTaskFilter(currentFilter);
  }

  function updateTasksEmptyState() {
    const hasVisible = Array.from(tasksList.children).some((li) => li.style.display !== 'none');
    tasksEmpty.hidden = tasksList.children.length > 0;
    if (tasksList.children.length > 0) {
      tasksEmpty.hidden = hasVisible;
    }
  }

  function applyTaskFilter(filter) {
    currentFilter = filter;
    let visibleCount = 0;
    Array.from(tasksList.children).forEach((li) => {
      const show = filter === 'todos' || li.dataset.frequency === filter;
      li.style.display = show ? '' : 'none';
      if (show) visibleCount += 1;
    });
    tasksEmpty.hidden = visibleCount > 0;
    if (tasksList.children.length === 0) {
      tasksEmpty.hidden = false;
      tasksEmpty.textContent = 'No tienes pendientes todavía. Organiza una idea del braindump para crear el primero.';
    } else if (visibleCount === 0) {
      tasksEmpty.hidden = false;
      tasksEmpty.textContent = 'No hay pendientes con este filtro.';
    } else {
      tasksEmpty.hidden = true;
    }
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');
      applyTaskFilter(btn.dataset.filter);
    });
  });

  tasksList.addEventListener('change', (e) => {
    if (!e.target.classList.contains('task-check')) return;
    const li = e.target.closest('.task');
    const id = li.dataset.id;
    const done = e.target.checked;
    FlowoStorage.updateTask(id, { done });
    li.querySelector('.task-name').classList.toggle('is-done', done);
  });

  tasksList.addEventListener('click', (e) => {
    if (!e.target.classList.contains('task-delete')) return;
    const li = e.target.closest('.task');
    const id = li.dataset.id;
    FlowoStorage.removeTask(id);
    li.remove();
    applyTaskFilter(currentFilter);
  });

  /* ---------- Progreso (hábitos) ---------- */

  const habitsList = document.getElementById('habits-list');
  const habitForm = document.getElementById('habit-form');
  const habitInput = document.getElementById('habit-input');

  function last7Days() {
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }

  function computeStreak(habit) {
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (habit.log[key]) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function renderHabit(habit) {
    const li = document.createElement('li');
    li.className = 'habit-card';
    li.dataset.id = habit.id;

    const top = document.createElement('div');
    top.className = 'habit-top';

    const name = document.createElement('span');
    name.className = 'habit-name';
    name.textContent = habit.name;

    const streak = document.createElement('span');
    streak.className = 'habit-streak';
    const streakCount = computeStreak(habit);
    streak.textContent = streakCount === 1 ? '1 día' : `${streakCount} días`;

    top.appendChild(name);
    top.appendChild(streak);

    const days = document.createElement('div');
    days.className = 'habit-days';
    days.setAttribute('aria-hidden', 'true');
    last7Days().forEach((key) => {
      const dot = document.createElement('span');
      dot.className = 'habit-day' + (habit.log[key] ? ' is-done' : '');
      days.appendChild(dot);
    });

    const today = new Date().toISOString().slice(0, 10);
    const doneToday = !!habit.log[today];

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'habit-toggle' + (doneToday ? ' is-done' : '');
    toggle.textContent = doneToday ? 'Hecho hoy ✓' : 'Marcar hoy';
    toggle.setAttribute('aria-pressed', doneToday ? 'true' : 'false');

    li.appendChild(top);
    li.appendChild(days);
    li.appendChild(toggle);

    habitsList.appendChild(li);
  }

  function renderAllHabits() {
    habitsList.innerHTML = '';
    FlowoStorage.getHabits().forEach(renderHabit);
  }

  habitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = habitInput.value.trim();
    if (!name) return;
    FlowoStorage.addHabit(name);
    habitInput.value = '';
    renderAllHabits();
    habitInput.focus();
  });

  habitsList.addEventListener('click', (e) => {
    if (!e.target.classList.contains('habit-toggle')) return;
    const li = e.target.closest('.habit-card');
    const id = li.dataset.id;
    FlowoStorage.toggleHabitToday(id);
    renderAllHabits();
  });

  /* ---------- Inicialización ---------- */

  renderAllNotes();
  renderAllTasks();
  renderAllHabits();
})();
