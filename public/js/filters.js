import { state, filters, getCategory } from './state.js';

// ===== Filter & Sort Logic =====

export function getFilteredAndSortedTasks(tasks) {
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

// Populate filter category selects (task + calendar)
export function populateFilterCategorySelect() {
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

// Render active filter tags below the toolbar
export function renderActiveFilters(renderTasksFn) {
    const container = document.getElementById('active-filters');
    container.innerHTML = '';

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (filters.category !== 'all') {
        const cat = getCategory(filters.category);
        if (cat) {
            container.appendChild(createFilterTag(`Category: ${cat.name}`, () => {
                filters.category = 'all';
                document.getElementById('filter-category').value = 'all';
                renderTasksFn();
                renderActiveFilters(renderTasksFn);
            }));
        }
    }

    if (filters.dateFrom) {
        container.appendChild(createFilterTag(`From: ${filters.dateFrom}`, () => {
            filters.dateFrom = '';
            document.getElementById('filter-date-from').value = '';
            renderTasksFn();
            renderActiveFilters(renderTasksFn);
        }));
    }

    if (filters.dateTo) {
        container.appendChild(createFilterTag(`To: ${filters.dateTo}`, () => {
            filters.dateTo = '';
            document.getElementById('filter-date-to').value = '';
            renderTasksFn();
            renderActiveFilters(renderTasksFn);
        }));
    }

    if (filters.dayOfWeek !== 'all') {
        container.appendChild(createFilterTag(`Day: ${dayNames[parseInt(filters.dayOfWeek)]}`, () => {
            filters.dayOfWeek = 'all';
            document.querySelectorAll('.day-pill').forEach(p => p.classList.remove('active'));
            document.querySelector('.day-pill[data-day="all"]').classList.add('active');
            renderTasksFn();
            renderActiveFilters(renderTasksFn);
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
            renderTasksFn();
            renderActiveFilters(renderTasksFn);
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

// Clear all filters to defaults
export function clearAllFilters(renderTasksFn, renderActiveFiltersFn) {
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

    renderTasksFn();
    renderActiveFiltersFn();
}

// Check if any filter is active
export function hasActiveFilters() {
    return filters.category !== 'all' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== '' ||
        filters.dayOfWeek !== 'all';
}
