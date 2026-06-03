// State
let state = {
    categories: [],
    tasks: [],
    events: []
};

// Filter/Sort State
let filters = {
    category: 'all',
    dateFrom: '',
    dateTo: '',
    dayOfWeek: 'all',
    sort: 'default',
    calendarCategory: 'all'
};

// Elements
const modalOverlay = document.getElementById('modal-overlay');
const taskModal = document.getElementById('task-modal');
const categoryModal = document.getElementById('category-modal');
const eventModal = document.getElementById('event-modal');

// API Functions
const loadData = async () => {
    try {
        const response = await fetch('/api/data');
        if (response.ok) {
            state = await response.json();
            renderAll();
        }
    } catch (err) {
        console.error('Error loading data:', err);
    }
};

const saveData = async () => {
    try {
        await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        });
        renderAll();
    } catch (err) {
        console.error('Error saving data:', err);
    }
};

// Utilities
const generateId = () => Math.random().toString(36).substr(2, 9);
const getCategory = (id) => state.categories.find(c => c.id === id);

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateDateDisplay();
    loadData();
    initCalendar();
});

// Event Listeners Setup
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

    // Modals
    document.getElementById('new-task-btn').addEventListener('click', () => openModal(taskModal));
    document.getElementById('add-category-btn').addEventListener('click', () => openModal(categoryModal));
    document.getElementById('new-event-btn').addEventListener('click', () => openModal(eventModal));

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
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
    document.getElementById('save-task-btn').addEventListener('click', saveTask);
    document.getElementById('save-category-btn').addEventListener('click', saveCategory);
    document.getElementById('save-event-btn').addEventListener('click', saveEvent);

    // Calendar Navigation
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));

    // ===== Filter & Sort Listeners =====
    document.getElementById('filter-category').addEventListener('change', (e) => {
        filters.category = e.target.value;
        renderTasks();
        renderActiveFilters();
    });

    document.getElementById('filter-date-from').addEventListener('change', (e) => {
        filters.dateFrom = e.target.value;
        renderTasks();
        renderActiveFilters();
    });

    document.getElementById('filter-date-to').addEventListener('change', (e) => {
        filters.dateTo = e.target.value;
        renderTasks();
        renderActiveFilters();
    });

    document.getElementById('sort-tasks').addEventListener('change', (e) => {
        filters.sort = e.target.value;
        renderTasks();
        renderActiveFilters();
    });

    // Day-of-week pills
    document.querySelectorAll('.day-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.day-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            filters.dayOfWeek = pill.getAttribute('data-day');
            renderTasks();
            renderActiveFilters();
        });
    });

    // Clear filters
    document.getElementById('clear-filters-btn').addEventListener('click', clearAllFilters);

    // Calendar category filter
    document.getElementById('calendar-filter-category').addEventListener('change', (e) => {
        filters.calendarCategory = e.target.value;
        renderCalendar();
    });
}

// ===== Filter & Sort Logic =====

function getFilteredAndSortedTasks(tasks) {
    let filtered = [...tasks];

    // Category filter
    if (filters.category !== 'all') {
        filtered = filtered.filter(t => t.categoryId === filters.category);
    }

    // Date range filter
    if (filters.dateFrom) {
        filtered = filtered.filter(t => {
            if (!t.date) return false;
            return t.date >= filters.dateFrom;
        });
    }

    if (filters.dateTo) {
        filtered = filtered.filter(t => {
            if (!t.date) return false;
            return t.date <= filters.dateTo;
        });
    }

    // Day-of-week filter
    if (filters.dayOfWeek !== 'all') {
        const targetDay = parseInt(filters.dayOfWeek);
        filtered = filtered.filter(t => {
            if (!t.date) return false;
            const d = new Date(t.date + 'T00:00:00');
            return d.getDay() === targetDay;
        });
    }

    // Sorting
    switch (filters.sort) {
        case 'alpha-asc':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'alpha-desc':
            filtered.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'date-asc':
            filtered.sort((a, b) => {
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                return a.date.localeCompare(b.date);
            });
            break;
        case 'date-desc':
            filtered.sort((a, b) => {
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                return b.date.localeCompare(a.date);
            });
            break;
        case 'category':
            filtered.sort((a, b) => {
                const catA = getCategory(a.categoryId);
                const catB = getCategory(b.categoryId);
                const nameA = catA ? catA.name : 'zzz';
                const nameB = catB ? catB.name : 'zzz';
                return nameA.localeCompare(nameB);
            });
            break;
    }

    return filtered;
}

function populateFilterCategorySelect() {
    const select = document.getElementById('filter-category');
    const calSelect = document.getElementById('calendar-filter-category');
    const currentValue = select.value;
    const currentCalValue = calSelect.value;

    select.innerHTML = '<option value="all">All Categories</option>';
    calSelect.innerHTML = '<option value="all">All Categories</option>';

    state.categories.forEach(cat => {
        const option1 = document.createElement('option');
        option1.value = cat.id;
        option1.textContent = cat.name;
        select.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = cat.id;
        option2.textContent = cat.name;
        calSelect.appendChild(option2);
    });

    // Restore selected values
    select.value = currentValue || 'all';
    calSelect.value = currentCalValue || 'all';
}

function renderActiveFilters() {
    const container = document.getElementById('active-filters');
    container.innerHTML = '';

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (filters.category !== 'all') {
        const cat = getCategory(filters.category);
        if (cat) {
            container.appendChild(createFilterTag(`Category: ${cat.name}`, () => {
                filters.category = 'all';
                document.getElementById('filter-category').value = 'all';
                renderTasks();
                renderActiveFilters();
            }));
        }
    }

    if (filters.dateFrom) {
        container.appendChild(createFilterTag(`From: ${filters.dateFrom}`, () => {
            filters.dateFrom = '';
            document.getElementById('filter-date-from').value = '';
            renderTasks();
            renderActiveFilters();
        }));
    }

    if (filters.dateTo) {
        container.appendChild(createFilterTag(`To: ${filters.dateTo}`, () => {
            filters.dateTo = '';
            document.getElementById('filter-date-to').value = '';
            renderTasks();
            renderActiveFilters();
        }));
    }

    if (filters.dayOfWeek !== 'all') {
        container.appendChild(createFilterTag(`Day: ${dayNames[parseInt(filters.dayOfWeek)]}`, () => {
            filters.dayOfWeek = 'all';
            document.querySelectorAll('.day-pill').forEach(p => p.classList.remove('active'));
            document.querySelector('.day-pill[data-day="all"]').classList.add('active');
            renderTasks();
            renderActiveFilters();
        }));
    }

    if (filters.sort !== 'default') {
        const sortLabels = {
            'alpha-asc': 'A → Z',
            'alpha-desc': 'Z → A',
            'date-asc': 'Date ↑',
            'date-desc': 'Date ↓',
            'category': 'By Category'
        };
        container.appendChild(createFilterTag(`Sort: ${sortLabels[filters.sort]}`, () => {
            filters.sort = 'default';
            document.getElementById('sort-tasks').value = 'default';
            renderTasks();
            renderActiveFilters();
        }));
    }
}

function createFilterTag(label, onRemove) {
    const tag = document.createElement('span');
    tag.className = 'filter-tag';
    tag.innerHTML = `${label} <i class="fa-solid fa-xmark remove-tag"></i>`;
    tag.querySelector('.remove-tag').addEventListener('click', onRemove);
    return tag;
}

function clearAllFilters() {
    filters.category = 'all';
    filters.dateFrom = '';
    filters.dateTo = '';
    filters.dayOfWeek = 'all';
    filters.sort = 'default';

    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('sort-tasks').value = 'default';

    document.querySelectorAll('.day-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('.day-pill[data-day="all"]').classList.add('active');

    renderTasks();
    renderActiveFilters();
}

function hasActiveFilters() {
    return filters.category !== 'all' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== '' ||
        filters.dayOfWeek !== 'all';
}

// Modal logic
function openModal(modalEl) {
    modalOverlay.classList.add('active');
    modalEl.classList.add('active');

    // Repopulate category select on task or event modal open
    if (modalEl === taskModal || modalEl === eventModal) {
        populateCategorySelect(modalEl === taskModal ? 'task-category' : 'event-category');
    }
}

function closeAllModals() {
    modalOverlay.classList.remove('active');
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('active'));
    // Reset forms
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('category-form').reset();
    document.getElementById('category-id').value = '';
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('category-color').value = '';
    document.getElementById('event-form').reset();
    document.getElementById('event-id').value = '';
}

function populateCategorySelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="" disabled selected>Select a category</option>';
    state.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date-display').textContent = new Date().toLocaleDateString('en-US', options);
}

// Render logic
function renderAll() {
    populateFilterCategorySelect();
    renderCategories();
    renderTasks();
    renderCalendar();
    renderActiveFilters();
}

function renderCategories() {
    const list = document.getElementById('categories-list');
    list.innerHTML = '';

    if (state.categories.length === 0) {
        list.innerHTML = `<li style="padding: 10px; color: var(--text-muted); font-size: 0.85rem">No categories. Create one!</li>`;
    }

    state.categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'category-item';
        li.innerHTML = `
            <div class="category-info">
                <div class="category-dot" style="--dot-color: ${cat.color}"></div>
                <span>${cat.name}</span>
            </div>
            <div class="category-actions">
                <button onclick="editCategory('${cat.id}')"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteCategory('${cat.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        list.appendChild(li);
    });
}

function renderTasks() {
    const incompleteCont = document.getElementById('tasks-incomplete');
    const completedCont = document.getElementById('tasks-completed');

    incompleteCont.innerHTML = '';
    completedCont.innerHTML = '';

    const allIncomplete = state.tasks.filter(t => !t.completed);
    const allCompleted = state.tasks.filter(t => t.completed);

    const incTasks = getFilteredAndSortedTasks(allIncomplete);
    const comTasks = getFilteredAndSortedTasks(allCompleted);

    // Update counts
    const incCountEl = document.getElementById('incomplete-count');
    const comCountEl = document.getElementById('completed-count');

    if (hasActiveFilters() || filters.sort !== 'default') {
        incCountEl.textContent = `(${incTasks.length} of ${allIncomplete.length})`;
        comCountEl.textContent = `(${comTasks.length} of ${allCompleted.length})`;
    } else {
        incCountEl.textContent = incTasks.length > 0 ? `(${incTasks.length})` : '';
        comCountEl.textContent = comTasks.length > 0 ? `(${comTasks.length})` : '';
    }

    if (incTasks.length === 0) {
        if (hasActiveFilters() && allIncomplete.length > 0) {
            incompleteCont.innerHTML = `<div class="no-results"><i class="fa-solid fa-filter-circle-xmark"></i><p>No tasks match your filters</p><p class="sub">Try adjusting or clearing filters</p></div>`;
        } else {
            incompleteCont.innerHTML = `<div class="empty-state"><i class="fa-solid fa-mug-hot"></i><p>All caught up!</p></div>`;
        }
    }

    if (comTasks.length === 0) {
        if (hasActiveFilters() && allCompleted.length > 0) {
            completedCont.innerHTML = `<div class="no-results"><i class="fa-solid fa-filter-circle-xmark"></i><p>No completed tasks match filters</p></div>`;
        } else {
            completedCont.innerHTML = `<div class="empty-state" style="padding: 20px;"><p>No completed tasks.</p></div>`;
        }
    }

    incTasks.forEach(task => incompleteCont.appendChild(createTaskElement(task)));
    comTasks.forEach(task => completedCont.appendChild(createTaskElement(task)));
}

function createTaskElement(task) {
    const category = getCategory(task.categoryId);
    const catColor = category ? category.color : 'var(--text-muted)';
    const catName = category ? category.name : 'Uncategorized';

    const div = document.createElement('div');
    div.className = `task-card ${task.completed ? 'completed' : ''}`;

    // Format date nicely
    let dateDisplay = '';
    if (task.date) {
        const d = new Date(task.date + 'T00:00:00');
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        dateDisplay = `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
    }

    div.innerHTML = `
        <div class="task-left">
            <div class="checkbox" onclick="toggleTask('${task.id}')">
                <i class="fa-solid fa-check"></i>
            </div>
            <div class="task-details">
                <div class="task-title">${task.title}</div>
                <div class="task-meta">
                    <span class="task-category-badge">
                        <span class="dot" style="--dot-color: ${catColor}"></span>
                        ${catName}
                    </span>
                    ${dateDisplay ? `<span><i class="fa-regular fa-calendar" style="margin-right:4px;"></i>${dateDisplay}</span>` : ''}
                </div>
            </div>
        </div>
        <div class="task-actions">
            ${!task.completed ? `<button onclick="editTask('${task.id}')"><i class="fa-solid fa-pen"></i></button>` : ''}
            <button class="delete-task" onclick="deleteTask('${task.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
    `;
    return div;
}

// Actions saving
function saveCategory() {
    const id = document.getElementById('category-id').value;
    const name = document.getElementById('category-name').value.trim();
    const color = document.getElementById('category-color').value;

    if (!name || !color) {
        alert("Please provide a name and select a color.");
        return;
    }

    if (id) {
        const index = state.categories.findIndex(c => c.id === id);
        if (index > -1) {
            state.categories[index] = { id, name, color };
        }
    } else {
        state.categories.push({ id: generateId(), name, color });
    }

    saveData();
    closeAllModals();
}

function saveTask() {
    const id = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value.trim();
    const categoryId = document.getElementById('task-category').value;
    const date = document.getElementById('task-date').value;

    if (!title || !categoryId) {
        alert("Title and Category are required.");
        return;
    }

    if (id) {
        const task = state.tasks.find(t => t.id === id);
        task.title = title;
        task.categoryId = categoryId;
        task.date = date;
    } else {
        state.tasks.push({
            id: generateId(),
            title,
            categoryId,
            date,
            completed: false
        });
    }

    saveData();
    closeAllModals();
}

function saveEvent() {
    const id = document.getElementById('event-id').value;
    const title = document.getElementById('event-title').value.trim();
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const categoryId = document.getElementById('event-category').value;

    if (!title || !date) {
        alert("Title and Date are required.");
        return;
    }

    if (id) {
        const ev = state.events.find(e => e.id === id);
        if (ev) {
            ev.title = title;
            ev.date = date;
            ev.time = time;
            ev.categoryId = categoryId;
        }
    } else {
        state.events.push({
            id: generateId(),
            title,
            date,
            time,
            categoryId
        });
    }

    saveData();
    closeAllModals();
}

// Action interactions
window.toggleTask = function (id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveData();
    }
};

window.deleteTask = function (id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveData();
};

window.editTask = function (id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('task-modal-title').textContent = "Edit Task";
    openModal(taskModal);

    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-category').value = task.categoryId;
    document.getElementById('task-date').value = task.date || '';
};

window.editEvent = function (id) {
    const ev = state.events.find(e => e.id === id);
    if (!ev) return;

    document.getElementById('event-modal-title').textContent = "Edit Event";
    openModal(eventModal);

    document.getElementById('event-id').value = ev.id;
    document.getElementById('event-title').value = ev.title;
    document.getElementById('event-date').value = ev.date;
    document.getElementById('event-time').value = ev.time || '';
    document.getElementById('event-category').value = ev.categoryId || '';
};

window.deleteCategory = function (id) {
    if (state.tasks.some(t => t.categoryId === id)) {
        alert("Cannot delete category because there are tasks associated with it.");
        return;
    }
    state.categories = state.categories.filter(c => c.id !== id);
    saveData();
};

window.editCategory = function (id) {
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;

    document.getElementById('category-id').value = cat.id;
    document.getElementById('category-name').value = cat.name;
    document.getElementById('category-color').value = cat.color;

    document.querySelectorAll('.color-option').forEach(opt => {
        if (opt.getAttribute('data-color') === cat.color) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });

    document.getElementById('category-modal-title').textContent = "Edit Category";
    openModal(categoryModal);
};

// Calendar Logic
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function initCalendar() {
    renderCalendar();
}

function changeMonth(dir) {
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

function renderCalendar() {
    const container = document.getElementById('calendar-days');
    const monthYearH2 = document.getElementById('calendar-month-year');

    container.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearH2.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Empty boxes
    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day empty';
        container.appendChild(div);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const calCatFilter = filters.calendarCategory;

    for (let i = 1; i <= daysInMonth; i++) {
        const div = document.createElement('div');

        // Month formatting for date string YYYY-MM-DD
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

        // Find events for this date (with calendar category filter)
        let dayEvents = state.events.filter(e => e.date === dateStr);
        if (calCatFilter !== 'all') {
            dayEvents = dayEvents.filter(e => e.categoryId === calCatFilter);
        }
        dayEvents.forEach(ev => {
            const cat = getCategory(ev.categoryId);
            const color = cat ? cat.color : '#fff';
            const timeStr = ev.time ? ` <span style="font-size: 0.8em; opacity: 0.8;">(${ev.time})</span>` : '';
            const html = `<div class="event-chip type-event" title="${ev.title}" onclick="editEvent('${ev.id}')" style="cursor: pointer;">
                <i class="fa-solid fa-star" style="font-size:8px; color: ${color};"></i> ${ev.title}${timeStr}
            </div>`;
            eventsCont.insertAdjacentHTML('beforeend', html);
        });

        div.appendChild(eventsCont);
        container.appendChild(div);
    }
}
