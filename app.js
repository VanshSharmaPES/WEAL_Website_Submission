/* ===============================================
   WEAL Wellness Tracker — CRUD Logic
   Uses localStorage for persistence.
   =============================================== */

(function () {
  'use strict';

  // -------- DOM refs --------
  const form         = document.getElementById('health-form');
  const editIdField  = document.getElementById('edit-id');
  const dateInput    = document.getElementById('entry-date');
  const weightInput  = document.getElementById('entry-weight');
  const sleepInput   = document.getElementById('entry-sleep');
  const waterInput   = document.getElementById('entry-water');
  const stepsInput   = document.getElementById('entry-steps');
  const moodInput    = document.getElementById('entry-mood');
  const notesInput   = document.getElementById('entry-notes');

  const formCard     = document.getElementById('form-section');
  const formHeading  = document.getElementById('form-heading');
  const submitBtn    = document.getElementById('submit-btn');
  const cancelBtn    = document.getElementById('cancel-btn');

  const entriesBody  = document.getElementById('entries-body');
  const emptyState   = document.getElementById('empty-state');
  const searchInput  = document.getElementById('search-input');

  const statEntries  = document.querySelector('#stat-entries .stat__value');
  const statSleep    = document.querySelector('#stat-avg-sleep .stat__value');
  const statSteps    = document.querySelector('#stat-avg-steps .stat__value');
  const statWater    = document.querySelector('#stat-avg-water .stat__value');

  const deleteModal  = document.getElementById('delete-modal');
  const confirmDelBtn= document.getElementById('confirm-delete-btn');
  const cancelDelBtn = document.getElementById('cancel-delete-btn');
  const toastCont    = document.getElementById('toast-container');

  const STORAGE_KEY  = 'weal_wellness_entries';

  // -------- Helpers --------
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function todayISO() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  }

  // -------- Storage (CRUD core) --------
  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveAll(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  // CREATE
  function createEntry(data) {
    const entries = readAll();
    const entry = { id: uid(), ...data, createdAt: new Date().toISOString() };
    entries.unshift(entry);
    saveAll(entries);
    return entry;
  }

  // READ single
  function readEntry(id) {
    return readAll().find(e => e.id === id) || null;
  }

  // UPDATE
  function updateEntry(id, data) {
    const entries = readAll();
    const idx = entries.findIndex(e => e.id === id);
    if (idx === -1) return null;
    entries[idx] = { ...entries[idx], ...data, updatedAt: new Date().toISOString() };
    saveAll(entries);
    return entries[idx];
  }

  // DELETE
  function deleteEntry(id) {
    const entries = readAll().filter(e => e.id !== id);
    saveAll(entries);
  }

  // -------- Stats --------
  function refreshStats() {
    const entries = readAll();
    const n = entries.length;
    statEntries.textContent = n;

    if (n === 0) {
      statSleep.textContent = '—';
      statSteps.textContent = '—';
      statWater.textContent = '—';
      return;
    }
    const avgSleep = (entries.reduce((s, e) => s + Number(e.sleep), 0) / n).toFixed(1);
    const avgSteps = Math.round(entries.reduce((s, e) => s + Number(e.steps), 0) / n);
    const avgWater = (entries.reduce((s, e) => s + Number(e.water), 0) / n).toFixed(1);

    statSleep.textContent = avgSleep + ' h';
    statSteps.textContent = avgSteps.toLocaleString();
    statWater.textContent = avgWater;
  }

  // -------- Render Table --------
  function renderTable(filter = '') {
    let entries = readAll();
    if (filter) {
      const q = filter.toLowerCase();
      entries = entries.filter(e =>
        e.date.includes(q) ||
        e.mood.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    entriesBody.innerHTML = '';
    emptyState.style.display = entries.length ? 'none' : 'block';

    entries.forEach(e => {
      const tr = document.createElement('tr');
      tr.dataset.id = e.id;
      tr.innerHTML = `
        <td>${formatDate(e.date)}</td>
        <td>${e.weight} kg</td>
        <td>${e.sleep} h</td>
        <td>${e.water}</td>
        <td>${Number(e.steps).toLocaleString()}</td>
        <td><span class="mood mood--${e.mood}">${moodEmoji(e.mood)} ${e.mood}</span></td>
        <td class="note-cell" title="${escapeHtml(e.notes || '')}">${escapeHtml(e.notes || '—')}</td>
        <td class="actions-col">
          <div class="action-btns">
            <button class="btn--icon" data-action="edit" data-id="${e.id}" title="Edit">✏️</button>
            <button class="btn--icon danger" data-action="delete" data-id="${e.id}" title="Delete">🗑️</button>
          </div>
        </td>
      `;
      entriesBody.appendChild(tr);
    });
  }

  function moodEmoji(mood) {
    const map = { Great:'😄', Good:'🙂', Okay:'😐', Low:'😔', Bad:'😞' };
    return map[mood] || '';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // -------- Toast --------
  function toast(message, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.textContent = message;
    toastCont.appendChild(el);
    setTimeout(() => {
      el.classList.add('fade-out');
      el.addEventListener('animationend', () => el.remove());
    }, 2400);
  }

  // -------- Form Handling --------
  function getFormData() {
    return {
      date:   dateInput.value,
      weight: weightInput.value,
      sleep:  sleepInput.value,
      water:  waterInput.value,
      steps:  stepsInput.value,
      mood:   moodInput.value,
      notes:  notesInput.value.trim(),
    };
  }

  function fillForm(entry) {
    dateInput.value   = entry.date;
    weightInput.value = entry.weight;
    sleepInput.value  = entry.sleep;
    waterInput.value  = entry.water;
    stepsInput.value  = entry.steps;
    moodInput.value   = entry.mood;
    notesInput.value  = entry.notes || '';
  }

  function resetForm() {
    form.reset();
    editIdField.value = '';
    dateInput.value   = todayISO();
    formHeading.innerHTML = '<span class="card__icon">＋</span> Log New Entry';
    submitBtn.innerHTML   = '<span class="btn__icon">＋</span> Add Entry';
    cancelBtn.style.display = 'none';
    formCard.classList.remove('editing');
  }

  function enterEditMode(id) {
    const entry = readEntry(id);
    if (!entry) return;
    editIdField.value = id;
    fillForm(entry);
    formHeading.innerHTML = '<span class="card__icon">✏️</span> Edit Entry';
    submitBtn.innerHTML   = '<span class="btn__icon">💾</span> Save Changes';
    cancelBtn.style.display = 'inline-flex';
    formCard.classList.add('editing');
    formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    dateInput.focus();
  }

  // -------- Events --------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const data = getFormData();
    const editId = editIdField.value;

    if (editId) {
      updateEntry(editId, data);
      toast('Entry updated ✅', 'success');
    } else {
      createEntry(data);
      toast('Entry added 🎉', 'success');
    }

    resetForm();
    renderTable(searchInput.value);
    refreshStats();
  });

  cancelBtn.addEventListener('click', resetForm);

  // Delegate click on table rows (edit / delete)
  entriesBody.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'edit') enterEditMode(id);
    if (action === 'delete') openDeleteModal(id);
  });

  // Search
  searchInput.addEventListener('input', function () {
    renderTable(this.value);
  });

  // -------- Delete Modal --------
  let pendingDeleteId = null;

  function openDeleteModal(id) {
    pendingDeleteId = id;
    deleteModal.classList.add('active');
  }

  confirmDelBtn.addEventListener('click', function () {
    if (pendingDeleteId) {
      deleteEntry(pendingDeleteId);
      toast('Entry deleted', 'danger');
      pendingDeleteId = null;
      deleteModal.classList.remove('active');
      renderTable(searchInput.value);
      refreshStats();
      resetForm();
    }
  });

  cancelDelBtn.addEventListener('click', function () {
    pendingDeleteId = null;
    deleteModal.classList.remove('active');
  });

  deleteModal.addEventListener('click', function (e) {
    if (e.target === deleteModal) {
      pendingDeleteId = null;
      deleteModal.classList.remove('active');
    }
  });

  // -------- Init --------
  dateInput.value = todayISO();
  renderTable();
  refreshStats();
})();
