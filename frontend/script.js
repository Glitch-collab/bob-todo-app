// API Configuration
const API_BASE_URL = 'http://localhost:5002/api';

// State
let todos = [];
let currentFilter = 'all';

// DOM Elements
const todoTitle = document.getElementById('todoTitle');
const todoDescription = document.getElementById('todoDescription');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    addTodoBtn.addEventListener('click', handleAddTodo);
    
    todoTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTodo();
        }
    });
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTodos();
        });
    });
}

// API Functions
async function loadTodos() {
    try {
        const response = await fetch(`${API_BASE_URL}/todos`);
        if (!response.ok) throw new Error('Failed to load todos');
        
        todos = await response.json();
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error loading todos:', error);
        showError('Failed to load todos. Make sure the backend server is running.');
    }
}

async function createTodo(title, description) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description }),
        });
        
        if (!response.ok) throw new Error('Failed to create todo');
        
        const newTodo = await response.json();
        todos.push(newTodo);
        renderTodos();
        updateStats();
        return newTodo;
    } catch (error) {
        console.error('Error creating todo:', error);
        showError('Failed to create todo');
        throw error;
    }
}

async function updateTodo(id, updates) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });
        
        if (!response.ok) throw new Error('Failed to update todo');
        
        const updatedTodo = await response.json();
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
            todos[index] = updatedTodo;
        }
        renderTodos();
        updateStats();
        return updatedTodo;
    } catch (error) {
        console.error('Error updating todo:', error);
        showError('Failed to update todo');
        throw error;
    }
}

async function deleteTodo(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete todo');
        
        todos = todos.filter(t => t.id !== id);
        renderTodos();
        updateStats();
    } catch (error) {
        console.error('Error deleting todo:', error);
        showError('Failed to delete todo');
        throw error;
    }
}

// UI Functions
function handleAddTodo() {
    const title = todoTitle.value.trim();
    const description = todoDescription.value.trim();
    
    if (!title) {
        alert('Please enter a todo title');
        return;
    }
    
    createTodo(title, description)
        .then(() => {
            todoTitle.value = '';
            todoDescription.value = '';
            todoTitle.focus();
        })
        .catch(() => {
            // Error already handled in createTodo
        });
}

function renderTodos() {
    const filteredTodos = getFilteredTodos();
    
    if (filteredTodos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state">
                <p>📭 No todos ${currentFilter !== 'all' ? currentFilter : 'yet'}</p>
                <small>${currentFilter === 'all' ? 'Add your first todo above!' : 'Try a different filter'}</small>
            </div>
        `;
        return;
    }
    
    todoList.innerHTML = filteredTodos.map(todo => createTodoElement(todo)).join('');
    
    // Attach event listeners
    filteredTodos.forEach(todo => {
        const todoElement = document.querySelector(`[data-id="${todo.id}"]`);
        if (todoElement) {
            attachTodoEventListeners(todoElement, todo);
        }
    });
}

function createTodoElement(todo) {
    const date = new Date(todo.created_at);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    return `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="todo-header">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <div class="todo-title">${escapeHtml(todo.title)}</div>
            </div>
            ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
            <div class="edit-form">
                <input type="text" class="edit-title" value="${escapeHtml(todo.title)}">
                <textarea class="edit-description" rows="2">${escapeHtml(todo.description || '')}</textarea>
                <div class="edit-actions">
                    <button class="btn-save">Save</button>
                    <button class="btn-cancel">Cancel</button>
                </div>
            </div>
            <div class="todo-actions">
                <button class="btn-edit">Edit</button>
                <button class="btn-delete">Delete</button>
            </div>
            <div class="todo-timestamp">Created: ${formattedDate}</div>
        </div>
    `;
}

function attachTodoEventListeners(element, todo) {
    const checkbox = element.querySelector('.todo-checkbox');
    const editBtn = element.querySelector('.btn-edit');
    const deleteBtn = element.querySelector('.btn-delete');
    const saveBtn = element.querySelector('.btn-save');
    const cancelBtn = element.querySelector('.btn-cancel');
    
    checkbox.addEventListener('change', () => {
        updateTodo(todo.id, { completed: checkbox.checked });
    });
    
    editBtn.addEventListener('click', () => {
        element.classList.add('editing');
    });
    
    deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this todo?')) {
            deleteTodo(todo.id);
        }
    });
    
    saveBtn.addEventListener('click', () => {
        const newTitle = element.querySelector('.edit-title').value.trim();
        const newDescription = element.querySelector('.edit-description').value.trim();
        
        if (!newTitle) {
            alert('Title cannot be empty');
            return;
        }
        
        updateTodo(todo.id, {
            title: newTitle,
            description: newDescription,
        }).then(() => {
            element.classList.remove('editing');
        });
    });
    
    cancelBtn.addEventListener('click', () => {
        element.classList.remove('editing');
        // Reset form values
        element.querySelector('.edit-title').value = todo.title;
        element.querySelector('.edit-description').value = todo.description || '';
    });
}

function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(t => !t.completed);
        case 'completed':
            return todos.filter(t => t.completed);
        default:
            return todos;
    }
}

function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const active = total - completed;
    
    totalCount.textContent = `Total: ${total}`;
    activeCount.textContent = `Active: ${active}`;
    completedCount.textContent = `Completed: ${completed}`;
}

function showError(message) {
    // Simple error display - could be enhanced with a toast notification
    alert(message);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Made with Bob
