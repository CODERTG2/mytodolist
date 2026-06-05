// ===== ZenTask Entry Point =====
// Imports from all modules and wires up event listeners + initialization.

import { state, filters, loadData, saveData } from './state.js';
import { openModal, closeAllModals } from './modals.js';
import { renderCategories, saveCategory, registerCategoryGlobals } from './categories.js';
import { renderTasks, saveTask, registerTaskGlobals } from './tasks.js';
import { populateFilterCategorySelect, renderActiveFilters, clearAllFilters } from './filters.js';
import { saveEvent, registerEventGlobals, setupRecurrenceToggle } from './events.js';
import { renderCalendar, initCalendar, changeMonth } from './calendar.js';

// ===== Render All =====
function renderAll() {
    populateFilterCategorySelect();
    renderCategories(renderAll);
    renderTasks(renderAll);
    renderCalendar();
    renderActiveFilters(() => renderTasks(renderAll));
}

// ===== Date Display =====
function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date-display').textContent = new Date().toLocaleDateString('en-US', options);
}

// ===== Event Listeners Setup =====
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));

            item.classList.add('active');
            const targetView = item.getAttribute('data-view');
            document.getElementById(`${targetView}-view`).classList.add('active');
        });
    });

    // Modals — open
    document.getElementById('new-task-btn').addEventListener('click', () => openModal(document.getElementById('task-modal')));
    document.getElementById('add-category-btn').addEventListener('click', () => openModal(document.getElementById('category-modal')));
    document.getElementById('new-event-btn').addEventListener('click', () => openModal(document.getElementById('event-modal')));

    // Modals — close
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => closeAllModals());
    });

    // Color picker
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', (e) => {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');
            document.getElementById('category-color').value = e.target.getAttribute('data-color');
        });
    });

    // Save Handlers
    document.getElementById('save-task-btn').addEventListener('click', () => saveTask(renderAll));
    document.getElementById('save-category-btn').addEventListener('click', () => saveCategory(renderAll));
    document.getElementById('save-event-btn').addEventListener('click', () => saveEvent(renderAll));

    // Calendar Navigation
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));

    // ===== Filter & Sort Listeners =====
    document.getElementById('filter-category').addEventListener('change', (e) => {
        filters.category = e.target.value;
        renderTasks(renderAll);
        renderActiveFilters(() => renderTasks(renderAll));
    });

    document.getElementById('filter-date-from').addEventListener('change', (e) => {
        filters.dateFrom = e.target.value;
        renderTasks(renderAll);
        renderActiveFilters(() => renderTasks(renderAll));
    });

    document.getElementById('filter-date-to').addEventListener('change', (e) => {
        filters.dateTo = e.target.value;
        renderTasks(renderAll);
        renderActiveFilters(() => renderTasks(renderAll));
    });

    document.getElementById('sort-tasks').addEventListener('change', (e) => {
        filters.sort = e.target.value;
        renderTasks(renderAll);
        renderActiveFilters(() => renderTasks(renderAll));
    });

    // Day-of-week pills
    document.querySelectorAll('.day-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.day-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            filters.dayOfWeek = pill.getAttribute('data-day');
            renderTasks(renderAll);
            renderActiveFilters(() => renderTasks(renderAll));
        });
    });

    // Clear filters
    document.getElementById('clear-filters-btn').addEventListener('click', () => {
        clearAllFilters(() => renderTasks(renderAll), () => renderActiveFilters(() => renderTasks(renderAll)));
    });

    // Calendar category filter
    document.getElementById('calendar-filter-category').addEventListener('change', (e) => {
        filters.calendarCategory = e.target.value;
        renderCalendar();
    });

    // Recurrence dropdown toggle
    setupRecurrenceToggle();
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    // Register window globals for inline onclick handlers
    registerCategoryGlobals(renderAll);
    registerTaskGlobals(renderAll);
    registerEventGlobals(renderAll);

    setupEventListeners();
    updateDateDisplay();
    loadData(renderAll);
    initCalendar();
});
