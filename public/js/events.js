import { state, saveData, generateId } from './state.js';
import { openModal, closeAllModals } from './modals.js';

// Save or update an event (with new fields: endTime, description, recurrence, recurrenceEndDate)
export function saveEvent(renderAllFn) {
    const id = document.getElementById('event-id').value;
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const endTime = document.getElementById('event-end-time').value;
    const categoryId = document.getElementById('event-category').value;
    const description = document.getElementById('event-description').value.trim();
    const recurrence = document.getElementById('event-recurrence').value;
    const recurrenceEndDate = document.getElementById('event-recurrence-end').value;

    if (!title || !date) {
        alert("Title and Date are required.");
        return;
    }

    // Validate end time is after start time if both provided
    if (time && endTime && endTime <= time) {
        alert("End time must be after start time.");
        return;
    }

    const eventData = {
        title,
        date,
        time,
        endTime: endTime || '',
        categoryId,
        description: description || '',
        recurrence: recurrence || 'none',
        recurrenceEndDate: recurrenceEndDate || ''
    };

    if (id) {
        const ev = state.events.find(e => e.id === id);
        if (ev) {
            Object.assign(ev, eventData);
        }
    } else {
        state.events.push({
            id: generateId(),
            ...eventData
        });
    }

    saveData(renderAllFn);
    closeAllModals();
}

// Register global functions for inline onclick handlers
export function registerEventGlobals(renderAllFn) {
    window.editEvent = function (id) {
        const ev = state.events.find(e => e.id === id);
        if (!ev) return;

        document.getElementById('event-modal-title').textContent = "Edit Event";
        openModal(document.getElementById('event-modal'));

        document.getElementById('event-id').value = ev.id;
        document.getElementById('event-title').value = ev.title;
        document.getElementById('event-date').value = ev.date;
        document.getElementById('event-time').value = ev.time || '';
        document.getElementById('event-end-time').value = ev.endTime || '';
        document.getElementById('event-category').value = ev.categoryId || '';
        document.getElementById('event-description').value = ev.description || '';
        document.getElementById('event-recurrence').value = ev.recurrence || 'none';
        document.getElementById('event-recurrence-end').value = ev.recurrenceEndDate || '';

        // Toggle recurrence end date visibility
        const recurrenceEndGroup = document.getElementById('recurrence-end-group');
        if (ev.recurrence && ev.recurrence !== 'none') {
            recurrenceEndGroup.classList.add('visible');
        } else {
            recurrenceEndGroup.classList.remove('visible');
        }
    };

    window.deleteEvent = function (id) {
        if (!confirm('Delete this event?')) return;
        state.events = state.events.filter(e => e.id !== id);
        saveData(renderAllFn);
    };
}

// Setup recurrence dropdown toggle for end date field
export function setupRecurrenceToggle() {
    const recurrenceSelect = document.getElementById('event-recurrence');
    const recurrenceEndGroup = document.getElementById('recurrence-end-group');

    recurrenceSelect.addEventListener('change', () => {
        if (recurrenceSelect.value !== 'none') {
            recurrenceEndGroup.classList.add('visible');
        } else {
            recurrenceEndGroup.classList.remove('visible');
        }
    });
}
