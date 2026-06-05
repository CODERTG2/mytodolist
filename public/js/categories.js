import { state, saveData, generateId } from './state.js';
import { openModal, closeAllModals } from './modals.js';

// Render all categories in the sidebar
export function renderCategories(renderAllFn) {
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

// Save or update a category
export function saveCategory(renderAllFn) {
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

    saveData(renderAllFn);
    closeAllModals();
}

// Attach global functions for inline onclick handlers
export function registerCategoryGlobals(renderAllFn) {
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
        openModal(document.getElementById('category-modal'));
    };

    window.deleteCategory = function (id) {
        if (state.tasks.some(t => t.categoryId === id)) {
            alert("Cannot delete category because there are tasks associated with it.");
            return;
        }
        state.categories = state.categories.filter(c => c.id !== id);
        saveData(renderAllFn);
    };
}
