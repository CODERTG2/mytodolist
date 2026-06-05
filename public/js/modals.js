import { state } from './state.js';

// DOM references
const modalOverlay = document.getElementById('modal-overlay');

// Open a specific modal
export function openModal(modalEl) {
    modalOverlay.classList.add('active');
    modalEl.classList.add('active');

    // Repopulate category selects on task or event modal open
    const taskModal = document.getElementById('task-modal');
    const eventModal = document.getElementById('event-modal');

    if (modalEl === taskModal || modalEl === eventModal) {
        populateCategorySelect(modalEl === taskModal ? 'task-category' : 'event-category');
    }
}

// Close all modals and reset forms
export function closeAllModals() {
    modalOverlay.classList.remove('active');
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));

    // Reset task form
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';

    // Reset category form
    document.getElementById('category-form').reset();
    document.getElementById('category-id').value = '';
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('category-color').value = '';

    // Reset event form
    document.getElementById('event-form').reset();
    document.getElementById('event-id').value = '';

    // Hide recurrence end date
    const recurrenceEndGroup = document.getElementById('recurrence-end-group');
    if (recurrenceEndGroup) {
        recurrenceEndGroup.classList.remove('visible');
    }
}

// Populate a category <select> element with current categories
export function populateCategorySelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="" disabled selected>Select a category</option>';
    state.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}
