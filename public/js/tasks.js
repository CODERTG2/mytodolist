import { state, saveData, generateId, getCategory } from './state.js';
import { openModal, closeAllModals } from './modals.js';
import { getFilteredAndSortedTasks, hasActiveFilters } from './filters.js';

// Render all tasks (incomplete + completed)
export function renderTasks(renderAllFn) {
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

    if (hasActiveFilters() || state._currentSort !== 'default') {
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

// Save or update a task
export function saveTask(renderAllFn) {
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

    saveData(renderAllFn);
    closeAllModals();
}

// Register global functions for inline onclick handlers
export function registerTaskGlobals(renderAllFn) {
    window.toggleTask = function (id) {
        const task = state.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveData(renderAllFn);
        }
    };

    window.deleteTask = function (id) {
        state.tasks = state.tasks.filter(t => t.id !== id);
        saveData(renderAllFn);
    };

    window.editTask = function (id) {
        const task = state.tasks.find(t => t.id === id);
        if (!task) return;

        document.getElementById('task-modal-title').textContent = "Edit Task";
        openModal(document.getElementById('task-modal'));

        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-category').value = task.categoryId;
        document.getElementById('task-date').value = task.date || '';
    };
}
