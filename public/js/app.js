// State
let state = {
    categories: [],
    tasks: [],
    events: []
};

// Elements
const modalOverlay = document.getElementById('modal-overlay');
const taskModal = document.getElementById('task-modal');
const categoryModal = document.getElementById('category-modal');
const eventModal = document.getElementById('event-modal');

// API Functions
const loadData = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/data');
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
        await fetch('http://localhost:3000/api/data', {
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
}

// Modal logic
function openModal(modalEl) {
    modalOverlay.classList.add('active');
    modalEl.classList.add('active');

    // Repopulate category select on task modal open
    if (modalEl === taskModal) {
        populateCategorySelect();
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

function populateCategorySelect() {
    const select = document.getElementById('task-category');
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
    renderCategories();
    renderTasks();
    renderCalendar();
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

    const incTasks = state.tasks.filter(t => !t.completed);
    const comTasks = state.tasks.filter(t => t.completed);

    if (incTasks.length === 0) incompleteCont.innerHTML = `<div class="empty-state"><i class="fa-solid fa-mug-hot"></i><p>All caught up!</p></div>`;
    if (comTasks.length === 0) completedCont.innerHTML = `<div class="empty-state" style="padding: 20px;"><p>No completed tasks.</p></div>`;

    incTasks.forEach(task => incompleteCont.appendChild(createTaskElement(task)));
    comTasks.forEach(task => completedCont.appendChild(createTaskElement(task)));
}

function createTaskElement(task) {
    const category = getCategory(task.categoryId);
    const catColor = category ? category.color : 'var(--text-muted)';
    const catName = category ? category.name : 'Uncategorized';

    const div = document.createElement('div');
    div.className = `task-card ${task.completed ? 'completed' : ''}`;

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
                    ${task.date ? `<span><i class="fa-regular fa-calendar" style="margin-right:4px;"></i>${task.date}</span>` : ''}
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

    if (!title || !date) {
        alert("Title and Date are required.");
        return;
    }

    if (id) {
        const ev = state.events.find(e => e.id === id);
        ev.title = title;
        ev.date = date;
    } else {
        state.events.push({
            id: generateId(),
            title,
            date
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

    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    populateCategorySelect();
    document.getElementById('task-category').value = task.categoryId;
    document.getElementById('task-date').value = task.date || '';

    document.getElementById('task-modal-title').textContent = "Edit Task";
    openModal(taskModal);
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

    for (let i = 1; i <= daysInMonth; i++) {
        const div = document.createElement('div');

        // Month formatting for date string YYYY-MM-DD
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

        div.className = `calendar-day ${dateStr === todayStr ? 'today' : ''}`;

        div.innerHTML = `<span class="day-number">${i}</span>`;

        const eventsCont = document.createElement('div');
        eventsCont.className = 'day-events';

        // Find tasks for this date
        const dayTasks = state.tasks.filter(t => t.date === dateStr);
        dayTasks.forEach(task => {
            const cat = getCategory(task.categoryId);
            const color = cat ? cat.color : '#fff';
            const html = `<div class="event-chip type-task" title="${task.title}">
                <span class="dot" style="width:6px;height:6px;border-radius:50%;background:${color};"></span>
                ${task.title}
            </div>`;
            eventsCont.insertAdjacentHTML('beforeend', html);
        });

        // Find events for this date
        const dayEvents = state.events.filter(e => e.date === dateStr);
        dayEvents.forEach(ev => {
            const html = `<div class="event-chip type-event" title="${ev.title}">
                <i class="fa-solid fa-star" style="font-size:8px;"></i> ${ev.title}
            </div>`;
            eventsCont.insertAdjacentHTML('beforeend', html);
        });

        div.appendChild(eventsCont);
        container.appendChild(div);
    }
}
