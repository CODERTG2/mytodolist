import { state, filters, getCategory } from './state.js';

// Calendar state
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

export function initCalendar() {
    renderCalendar();
}

export function changeMonth(dir) {
    currentMonth += dir;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

/**
 * Generate all occurrence dates for a recurring event within a date range.
 * Returns an array of date strings (YYYY-MM-DD).
 */
function getRecurrenceOccurrences(event, rangeStart, rangeEnd) {
    const recurrence = event.recurrence || 'none';
    if (recurrence === 'none') return [];

    const occurrences = [];
    const eventStart = new Date(event.date + 'T00:00:00');
    const recEnd = event.recurrenceEndDate ? new Date(event.recurrenceEndDate + 'T23:59:59') : null;

    // Determine the effective end of the range
    const effectiveEnd = recEnd && recEnd < rangeEnd ? recEnd : rangeEnd;

    // Start iterating from the event's original date
    let current = new Date(eventStart);

    // Safety limit to prevent infinite loops
    const MAX_ITERATIONS = 500;
    let iterations = 0;

    while (current <= effectiveEnd && iterations < MAX_ITERATIONS) {
        iterations++;

        if (current >= rangeStart && current <= effectiveEnd) {
            const dateStr = formatDateStr(current);
            // Don't include the original date (that's handled separately)
            if (dateStr !== event.date) {
                occurrences.push(dateStr);
            }
        }

        // Advance to next occurrence
        switch (recurrence) {
            case 'daily':
                current.setDate(current.getDate() + 1);
                break;
            case 'weekly':
                current.setDate(current.getDate() + 7);
                break;
            case 'biweekly':
                current.setDate(current.getDate() + 14);
                break;
            case 'monthly':
                current.setMonth(current.getMonth() + 1);
                break;
            case 'yearly':
                current.setFullYear(current.getFullYear() + 1);
                break;
            default:
                return occurrences;
        }
    }

    return occurrences;
}

function formatDateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Build a map of dateStr -> [event objects] for the current month,
 * including recurring event occurrences.
 */
function buildEventDateMap() {
    // Range: first visible day to last visible day of the month
    const rangeStart = new Date(currentYear, currentMonth, 1);
    const rangeEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const map = {};

    state.events.forEach(ev => {
        // Original date
        if (ev.date) {
            if (!map[ev.date]) map[ev.date] = [];
            map[ev.date].push(ev);
        }

        // Recurring occurrences
        const occurrences = getRecurrenceOccurrences(ev, rangeStart, rangeEnd);
        occurrences.forEach(dateStr => {
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(ev);
        });
    });

    return map;
}

export function renderCalendar() {
    const container = document.getElementById('calendar-days');
    const monthYearH2 = document.getElementById('calendar-month-year');

    container.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearH2.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Empty boxes for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day empty';
        container.appendChild(div);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const calCatFilter = filters.calendarCategory;

    // Build the event date map (includes recurring occurrences)
    const eventDateMap = buildEventDateMap();

    for (let i = 1; i <= daysInMonth; i++) {
        const div = document.createElement('div');

        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

        div.className = `calendar-day ${dateStr === todayStr ? 'today' : ''}`;

        div.innerHTML = `<span class="day-number">${i}</span>`;

        const eventsCont = document.createElement('div');
        eventsCont.className = 'day-events';

        // Find tasks for this date (with calendar category filter)
        let dayTasks = state.tasks.filter(t => t.date === dateStr);
        if (calCatFilter !== 'all') {
            dayTasks = dayTasks.filter(t => t.categoryId === calCatFilter);
        }
        dayTasks.forEach(task => {
            const cat = getCategory(task.categoryId);
            const color = cat ? cat.color : '#fff';
            const completedStyle = task.completed ? 'text-decoration: line-through; opacity: 0.6;' : '';
            const html = `<div class="event-chip type-task" title="${task.title}" style="${completedStyle}">
                <span class="dot" style="width:6px;height:6px;border-radius:50%;background:${color};"></span>
                ${task.title}
            </div>`;
            eventsCont.insertAdjacentHTML('beforeend', html);
        });

        // Find events for this date (from the pre-built map, includes recurrences)
        let dayEvents = eventDateMap[dateStr] || [];
        if (calCatFilter !== 'all') {
            dayEvents = dayEvents.filter(e => e.categoryId === calCatFilter);
        }

        // Deduplicate (same event could appear via original + recurrence if map has overlap)
        const seen = new Set();
        dayEvents.forEach(ev => {
            if (seen.has(ev.id)) return;
            seen.add(ev.id);

            const cat = getCategory(ev.categoryId);
            const color = cat ? cat.color : '#fff';

            // Build time display string
            let timeStr = '';
            if (ev.time && ev.endTime) {
                timeStr = ` <span style="font-size: 0.8em; opacity: 0.8;">(${ev.time}–${ev.endTime})</span>`;
            } else if (ev.time) {
                timeStr = ` <span style="font-size: 0.8em; opacity: 0.8;">(${ev.time})</span>`;
            }

            // Recurrence indicator
            const recurrenceIcon = (ev.recurrence && ev.recurrence !== 'none')
                ? `<i class="fa-solid fa-repeat recurrence-icon" title="Recurring: ${ev.recurrence}"></i>`
                : '';

            // Description indicator
            const descIcon = ev.description
                ? `<i class="fa-solid fa-align-left desc-icon" title="${ev.description}"></i>`
                : '';

            const html = `<div class="event-chip type-event" title="${ev.title}${ev.description ? '\n' + ev.description : ''}" onclick="editEvent('${ev.id}')" style="cursor: pointer;">
                <i class="fa-solid fa-star" style="font-size:8px; color: ${color};"></i> ${ev.title}${timeStr}${recurrenceIcon}${descIcon}
            </div>`;
            eventsCont.insertAdjacentHTML('beforeend', html);
        });

        div.appendChild(eventsCont);
        container.appendChild(div);
    }
}
