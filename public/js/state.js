// Shared application state
export let state = {
    categories: [],
    tasks: [],
    events: []
};

// Filter/Sort state
export let filters = {
    category: 'all',
    dateFrom: '',
    dateTo: '',
    dayOfWeek: 'all',
    sort: 'default',
    calendarCategory: 'all'
};

// Utilities
export const generateId = () => Math.random().toString(36).substr(2, 9);
export const getCategory = (id) => state.categories.find(c => c.id === id);

// API: Load all data from server
export const loadData = async (renderAllFn) => {
    try {
        const response = await fetch('/api/data');
        if (response.ok) {
            const data = await response.json();
            state.categories = data.categories || [];
            state.tasks = data.tasks || [];
            state.events = data.events || [];
            renderAllFn();
        }
    } catch (err) {
        console.error('Error loading data:', err);
    }
};

// API: Save all data to server
export const saveData = async (renderAllFn) => {
    try {
        await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        });
        renderAllFn();
    } catch (err) {
        console.error('Error saving data:', err);
    }
};
