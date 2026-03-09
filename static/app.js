const API = '';  // same origin

// --- State ---
let token = localStorage.getItem('token') || null;
let currentFilter = 'all';

// --- DOM refs ---
const loginScreen   = document.getElementById('login-screen');
const appScreen     = document.getElementById('app-screen');
const loginForm     = document.getElementById('login-form');
const loginError    = document.getElementById('login-error');
const logoutBtn     = document.getElementById('logout-btn');
const createForm    = document.getElementById('create-form');
const createError   = document.getElementById('create-error');
const newTitle      = document.getElementById('new-title');
const newDesc       = document.getElementById('new-desc');
const taskList      = document.getElementById('task-list');
const emptyState    = document.getElementById('empty-state');
const filterBtns    = document.querySelectorAll('.filter-btn');
const modalOverlay  = document.getElementById('modal-overlay');
const modalClose    = document.getElementById('modal-close');
const modalCancel   = document.getElementById('modal-cancel');
const editForm      = document.getElementById('edit-form');
const editError     = document.getElementById('edit-error');
const editId        = document.getElementById('edit-id');
const editTitle     = document.getElementById('edit-title');
const editDesc      = document.getElementById('edit-desc');
const editCompleted = document.getElementById('edit-completed');

// --- Auth ---
function showLogin() {
  loginScreen.classList.remove('hidden');
  appScreen.classList.add('hidden');
}

function showApp() {
  loginScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  loadTasks();
}

function logout() {
  token = null;
  localStorage.removeItem('token');
  showLogin();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    });
    if (!res.ok) {
      const data = await res.json();
      loginError.textContent = data.detail || 'Credenziali non valide';
      loginError.classList.remove('hidden');
      return;
    }
    const data = await res.json();
    token = data.access_token;
    localStorage.setItem('token', token);
    showApp();
  } catch {
    loginError.textContent = 'Errore di connessione al server';
    loginError.classList.remove('hidden');
  }
});

logoutBtn.addEventListener('click', logout);

// --- API helper ---
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    logout();
    return null;
  }

  if (res.status === 204) return null;
  return res.json();
}

// --- Tasks ---
async function loadTasks() {
  const query = currentFilter === 'all' ? '' : `?completed=${currentFilter}`;
  const tasks = await apiFetch(`/tasks${query}`);
  if (!tasks) return;
  renderTasks(tasks);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderTasks(tasks) {
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  tasks.forEach(task => {
    const item = document.createElement('div');
    item.className = 'task-item';
    item.dataset.id = task.id;

    const badge = task.completed
      ? '<span class="badge badge-done">Completato</span>'
      : '<span class="badge badge-pending">Da fare</span>';

    item.innerHTML = `
      <div class="task-check ${task.completed ? 'done' : ''}" title="${task.completed ? 'Segna come da fare' : 'Segna come completato'}" data-action="complete"></div>
      <div class="task-body">
        <div class="task-title ${task.completed ? 'done' : ''}">${escHtml(task.title)}${badge}</div>
        ${task.description ? `<div class="task-desc">${escHtml(task.description)}</div>` : ''}
        <div class="task-meta">Creato: ${formatDate(task.created_at)}</div>
      </div>
      <div class="task-actions">
        <button class="btn btn-ghost" data-action="edit" title="Modifica"><span>Modifica</span></button>
        <button class="btn btn-danger" data-action="delete" title="Elimina"><span>Elimina</span></button>
      </div>
    `;

    taskList.appendChild(item);
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// --- Task list event delegation ---
taskList.addEventListener('click', async (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (!actionEl) return;

  const item = actionEl.closest('.task-item');
  const id = item.dataset.id;
  const action = actionEl.dataset.action;

  if (action === 'complete') {
    const isDone = actionEl.classList.contains('done');
    await apiFetch(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: !isDone }),
    });
    loadTasks();
  }

  if (action === 'edit') {
    const title = item.querySelector('.task-title').firstChild.textContent.trim();
    const descEl = item.querySelector('.task-desc');
    const desc = descEl ? descEl.textContent : '';
    const completed = item.querySelector('.task-check').classList.contains('done');
    openEditModal(id, title, desc, completed);
  }

  if (action === 'delete') {
    if (!confirm('Eliminare questo task?')) return;
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  }
});

// --- Create task ---
createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  createError.classList.add('hidden');

  const title = newTitle.value.trim();
  if (!title) {
    createError.textContent = 'Il titolo è obbligatorio';
    createError.classList.remove('hidden');
    return;
  }

  const body = { title };
  const desc = newDesc.value.trim();
  if (desc) body.description = desc;

  const res = await apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (res && res.id) {
    newTitle.value = '';
    newDesc.value = '';
    loadTasks();
  } else if (res && res.detail) {
    createError.textContent = Array.isArray(res.detail) ? res.detail[0].msg : res.detail;
    createError.classList.remove('hidden');
  }
});

// --- Filters ---
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadTasks();
  });
});

// --- Edit modal ---
function openEditModal(id, title, desc, completed) {
  editId.value = id;
  editTitle.value = title;
  editDesc.value = desc;
  editCompleted.checked = completed;
  editError.classList.add('hidden');
  modalOverlay.classList.remove('hidden');
  editTitle.focus();
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  editError.classList.add('hidden');

  const id = editId.value;
  const title = editTitle.value.trim();
  if (!title) {
    editError.textContent = 'Il titolo è obbligatorio';
    editError.classList.remove('hidden');
    return;
  }

  const body = {
    title,
    description: editDesc.value.trim() || null,
    completed: editCompleted.checked,
  };

  const res = await apiFetch(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  if (res && res.id) {
    closeModal();
    loadTasks();
  } else if (res && res.detail) {
    editError.textContent = Array.isArray(res.detail) ? res.detail[0].msg : res.detail;
    editError.classList.remove('hidden');
  }
});

// --- Init ---
if (token) {
  showApp();
} else {
  showLogin();
}
