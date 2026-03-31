/*
 * ============================================================================
 * TODO APPLICATION - FRONTEND JAVASCRIPT
 * ============================================================================
 * 
 * This file contains all the JavaScript code for the Todo application frontend.
 * It handles communication with the Flask backend API and manages the user
 * interface interactions.
 * 
 * LEARNING OBJECTIVES:
 * - Understanding REST API communication
 * - Working with async/await for asynchronous operations
 * - DOM manipulation and event handling
 * - Error handling in JavaScript
 * - State management in vanilla JavaScript
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * API_BASE_URL: The base URL for our Flask backend API
 * 
 * This is where our Flask server is running. All API requests will be sent
 * to endpoints under this URL (e.g., http://localhost:5000/api/todos)
 */
const API_BASE_URL = 'http://localhost:5001/api';

// ============================================================================
// APPLICATION STATE
// ============================================================================

/**
 * Application state variables
 * 
 * These variables store the current state of our application:
 * - todos: Array of all todo objects from the database
 * - currentFilter: Which filter is active ('all', 'active', or 'completed')
 * 
 * We keep this state in memory to avoid unnecessary API calls and to make
 * the UI more responsive.
 */
let todos = [];
let currentFilter = 'all';

// ============================================================================
// DOM ELEMENT REFERENCES
// ============================================================================

/**
 * Cache DOM element references
 * 
 * We store references to frequently used DOM elements in variables.
 * This is more efficient than calling document.getElementById() every time
 * we need to access an element.
 * 
 * Benefits:
 * - Faster performance (no repeated DOM queries)
 * - Cleaner code (shorter variable names)
 * - Easier to maintain (all elements defined in one place)
 */
const todoTitle = document.getElementById('todoTitle');
const todoDescription = document.getElementById('todoDescription');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const filterBtns = document.querySelectorAll('.filter-btn');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the application when the DOM is fully loaded
 * 
 * DOMContentLoaded event fires when the HTML document has been completely
 * parsed and all DOM elements are available. This ensures our code doesn't
 * try to access elements before they exist.
 * 
 * We use an arrow function here for concise syntax.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Load todos from the backend when the page loads
    loadTodos();
    
    // Set up all event listeners for user interactions
    setupEventListeners();
});

// ============================================================================
// EVENT LISTENER SETUP
// ============================================================================

/**
 * Set up all event listeners for user interactions
 * 
 * Event listeners allow us to respond to user actions like clicks and
 * key presses. We set them up once during initialization rather than
 * inline in HTML for better separation of concerns.
 */
function setupEventListeners() {
    // Listen for clicks on the "Add Todo" button
    addTodoBtn.addEventListener('click', handleAddTodo);
    
    /**
     * Allow users to press Enter in the title field to add a todo
     * 
     * This improves user experience by providing a keyboard shortcut.
     * We check if the pressed key is 'Enter' before calling handleAddTodo.
     */
    todoTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTodo();
        }
    });
    
    /**
     * Set up filter button click handlers
     * 
     * We iterate over all filter buttons and add a click listener to each.
     * When clicked, we:
     * 1. Update the currentFilter state
     * 2. Update the visual active state of buttons
     * 3. Re-render the todo list with the new filter
     */
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Get the filter type from the button's data-filter attribute
            currentFilter = btn.dataset.filter;
            
            // Remove 'active' class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Add 'active' class to the clicked button
            btn.classList.add('active');
            
            // Re-render todos with the new filter
            renderTodos();
        });
    });
}

// ============================================================================
// API FUNCTIONS - COMMUNICATING WITH THE BACKEND
// ============================================================================

/**
 * Load all todos from the backend API
 * 
 * ASYNC/AWAIT EXPLANATION:
 * - 'async' keyword makes this function asynchronous, meaning it can perform
 *   operations that take time (like network requests) without blocking other code
 * - 'await' keyword pauses execution until the Promise resolves (the API responds)
 * - This makes asynchronous code look and behave more like synchronous code
 * 
 * WHY USE ASYNC/AWAIT?
 * - Cleaner syntax than callbacks or .then() chains
 * - Easier error handling with try/catch
 * - More readable and maintainable code
 * 
 * FETCH API:
 * - Modern way to make HTTP requests in JavaScript
 * - Returns a Promise that resolves to the Response object
 * - We use await to wait for the response before continuing
 */
async function loadTodos() {
    try {
        // TRY BLOCK: Code that might fail (network request)
        
        /**
         * Make a GET request to fetch all todos
         * 
         * fetch() returns a Promise, so we use 'await' to wait for the response.
         * The response object contains the HTTP response from the server.
         */
        const response = await fetch(`${API_BASE_URL}/todos`);
        
        /**
         * Check if the request was successful
         * 
         * response.ok is true if the status code is 200-299
         * If not ok, we throw an error to jump to the catch block
         */
        if (!response.ok) throw new Error('Failed to load todos');
        
        /**
         * Parse the JSON response body
         * 
         * response.json() also returns a Promise, so we await it.
         * This converts the JSON string from the server into a JavaScript array.
         */
        todos = await response.json();
        
        // Update the UI with the loaded todos
        renderTodos();
        updateStats();
        
    } catch (error) {
        // CATCH BLOCK: Handles any errors that occurred in the try block
        
        /**
         * Log the error to the console for debugging
         * 
         * In production, you might want to send this to an error tracking service
         */
        console.error('Error loading todos:', error);
        
        /**
         * Show a user-friendly error message
         * 
         * We don't show the technical error to users, just a helpful message
         * about what went wrong and how to fix it.
         */
        showError('Failed to load todos. Make sure the backend server is running.');
    }
}

/**
 * Create a new todo by sending a POST request to the API
 * 
 * @param {string} title - The title of the todo (required)
 * @param {string} description - The description of the todo (optional)
 * @returns {Promise<Object>} The created todo object from the server
 * 
 * HTTP POST METHOD:
 * - Used to create new resources on the server
 * - Sends data in the request body (as JSON in our case)
 * - Server responds with the created resource (including generated ID)
 */
async function createTodo(title, description) {
    try {
        /**
         * Make a POST request with JSON data
         * 
         * We need to specify:
         * 1. method: 'POST' - tells the server we're creating something
         * 2. headers: tells the server we're sending JSON data
         * 3. body: the actual data, converted to a JSON string
         */
        const response = await fetch(`${API_BASE_URL}/todos`, {
            method: 'POST',
            headers: {
                /**
                 * Content-Type header tells the server what format our data is in
                 * 
                 * 'application/json' means we're sending JSON data
                 * The server needs this to parse the request body correctly
                 */
                'Content-Type': 'application/json',
            },
            /**
             * Convert JavaScript object to JSON string
             * 
             * JSON.stringify() converts our JavaScript object into a JSON string
             * that can be sent over the network. The server will parse it back
             * into a Python dictionary.
             */
            body: JSON.stringify({ title, description }),
        });
        
        // Check if the request was successful (status 201 Created)
        if (!response.ok) throw new Error('Failed to create todo');
        
        /**
         * Parse the response to get the created todo
         * 
         * The server responds with the complete todo object, including:
         * - id: generated by the database
         * - created_at: timestamp from the server
         * - completed: default value (false)
         */
        const newTodo = await response.json();
        
        /**
         * Update local state
         * 
         * We add the new todo to our local array so the UI updates immediately
         * without needing to reload all todos from the server.
         */
        todos.push(newTodo);
        
        // Update the UI to show the new todo
        renderTodos();
        updateStats();
        
        // Return the new todo in case the caller needs it
        return newTodo;
        
    } catch (error) {
        /**
         * Error handling for failed creation
         * 
         * Possible reasons for failure:
         * - Network error (server not running)
         * - Validation error (missing title)
         * - Server error (database issue)
         */
        console.error('Error creating todo:', error);
        showError('Failed to create todo');
        
        /**
         * Re-throw the error
         * 
         * This allows the calling function to handle the error if needed.
         * For example, handleAddTodo() can decide not to clear the input
         * fields if creation failed.
         */
        throw error;
    }
}

/**
 * Update an existing todo by sending a PUT request to the API
 * 
 * @param {number} id - The ID of the todo to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<Object>} The updated todo object from the server
 * 
 * HTTP PUT METHOD:
 * - Used to update existing resources
 * - Sends the ID in the URL path
 * - Sends updated fields in the request body
 * - Server responds with the complete updated resource
 * 
 * PARTIAL UPDATES:
 * We only send the fields that changed, not the entire todo object.
 * The server merges these updates with the existing data.
 */
async function updateTodo(id, updates) {
    try {
        /**
         * Make a PUT request to update the todo
         * 
         * Note: The ID is in the URL path (/todos/1, /todos/2, etc.)
         * This is RESTful API design - the URL identifies the resource
         */
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            /**
             * Send only the fields that need to be updated
             * 
             * Examples:
             * - { completed: true } - just toggle completion
             * - { title: "New title", description: "New desc" } - update text
             * - { title: "Updated", completed: true } - update multiple fields
             */
            body: JSON.stringify(updates),
        });
        
        // Check if the update was successful
        if (!response.ok) throw new Error('Failed to update todo');
        
        // Get the updated todo from the server
        const updatedTodo = await response.json();
        
        /**
         * Update the todo in our local state
         * 
         * We find the todo by ID and replace it with the updated version.
         * This keeps our local state in sync with the server.
         */
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
            todos[index] = updatedTodo;
        }
        
        // Update the UI to reflect the changes
        renderTodos();
        updateStats();
        
        return updatedTodo;
        
    } catch (error) {
        /**
         * Error handling for failed updates
         * 
         * Common errors:
         * - Todo not found (404) - maybe it was deleted by another user
         * - Network error
         * - Validation error (empty title)
         */
        console.error('Error updating todo:', error);
        showError('Failed to update todo');
        throw error;
    }
}

/**
 * Delete a todo by sending a DELETE request to the API
 * 
 * @param {number} id - The ID of the todo to delete
 * 
 * HTTP DELETE METHOD:
 * - Used to remove resources from the server
 * - Only needs the ID in the URL path
 * - No request body needed
 * - Server responds with a success message
 */
async function deleteTodo(id) {
    try {
        /**
         * Make a DELETE request
         * 
         * This is the simplest type of request - just the method and URL.
         * No headers or body needed because we're just deleting by ID.
         */
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'DELETE',
        });
        
        // Check if the deletion was successful
        if (!response.ok) throw new Error('Failed to delete todo');
        
        /**
         * Remove the todo from our local state
         * 
         * filter() creates a new array without the deleted todo.
         * This is more efficient than reloading all todos from the server.
         */
        todos = todos.filter(t => t.id !== id);
        
        // Update the UI to remove the deleted todo
        renderTodos();
        updateStats();
        
    } catch (error) {
        /**
         * Error handling for failed deletion
         * 
         * Possible errors:
         * - Todo not found (404)
         * - Network error
         * - Server error
         */
        console.error('Error deleting todo:', error);
        showError('Failed to delete todo');
        throw error;
    }
}

// ============================================================================
// UI FUNCTIONS - MANAGING THE USER INTERFACE
// ============================================================================

/**
 * Handle the "Add Todo" button click
 * 
 * This function is called when the user clicks the "Add Todo" button or
 * presses Enter in the title field. It validates the input and creates
 * a new todo.
 * 
 * VALIDATION:
 * We validate on the frontend for immediate feedback, but the backend
 * also validates to ensure data integrity.
 */
function handleAddTodo() {
    /**
     * Get and clean the input values
     * 
     * trim() removes whitespace from the beginning and end of the string.
     * This prevents users from creating todos with just spaces.
     */
    const title = todoTitle.value.trim();
    const description = todoDescription.value.trim();
    
    /**
     * Validate that title is not empty
     * 
     * We check this before making an API call to provide immediate feedback
     * and avoid unnecessary network requests.
     */
    if (!title) {
        alert('Please enter a todo title');
        return; // Exit the function early if validation fails
    }
    
    /**
     * Create the todo
     * 
     * We use .then() here to handle the success case.
     * If creation succeeds, we clear the input fields and focus the title
     * field so the user can immediately add another todo.
     */
    createTodo(title, description)
        .then(() => {
            // Clear the input fields after successful creation
            todoTitle.value = '';
            todoDescription.value = '';
            
            // Focus the title field for the next todo
            todoTitle.focus();
        })
        .catch(() => {
            /**
             * Error handling
             * 
             * We don't need to do anything here because createTodo()
             * already showed an error message. We just catch the error
             * to prevent it from being unhandled.
             */
        });
}

/**
 * Render all todos to the DOM
 * 
 * This function is called whenever the todo list needs to be updated:
 * - After loading todos from the server
 * - After creating a new todo
 * - After updating a todo
 * - After deleting a todo
 * - After changing the filter
 * 
 * RENDERING STRATEGY:
 * We use innerHTML to replace the entire list. This is simple but not
 * the most efficient for large lists. For better performance with many
 * todos, consider using a virtual DOM library or incremental updates.
 */
function renderTodos() {
    // Get the filtered list of todos based on the current filter
    const filteredTodos = getFilteredTodos();
    
    /**
     * Handle empty state
     * 
     * If there are no todos to display, show a friendly message instead
     * of an empty list. This improves user experience.
     */
    if (filteredTodos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-state">
                <p>📭 No todos ${currentFilter !== 'all' ? currentFilter : 'yet'}</p>
                <small>${currentFilter === 'all' ? 'Add your first todo above!' : 'Try a different filter'}</small>
            </div>
        `;
        return; // Exit early since there's nothing to render
    }
    
    /**
     * Render all todos
     * 
     * We use map() to convert each todo object into an HTML string,
     * then join() to combine them into a single string.
     * Finally, we set innerHTML to update the DOM.
     */
    todoList.innerHTML = filteredTodos.map(todo => createTodoElement(todo)).join('');
    
    /**
     * Attach event listeners to the rendered todos
     * 
     * Since we replaced the HTML, we need to re-attach event listeners.
     * We can't use innerHTML for event listeners - they must be attached
     * to actual DOM elements.
     */
    filteredTodos.forEach(todo => {
        const todoElement = document.querySelector(`[data-id="${todo.id}"]`);
        if (todoElement) {
            attachTodoEventListeners(todoElement, todo);
        }
    });
}

/**
 * Create HTML for a single todo item
 * 
 * @param {Object} todo - The todo object to render
 * @returns {string} HTML string for the todo item
 * 
 * TEMPLATE LITERALS:
 * We use template literals (backticks) to create multi-line HTML strings.
 * ${} syntax allows us to embed JavaScript expressions in the string.
 * 
 * SECURITY:
 * We use escapeHtml() to prevent XSS attacks. Never trust user input!
 */
function createTodoElement(todo) {
    /**
     * Format the creation date
     * 
     * We convert the ISO date string from the server into a more
     * readable format for display.
     */
    const date = new Date(todo.created_at);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    /**
     * Build the HTML string
     * 
     * Note the use of:
     * - Conditional classes: ${todo.completed ? 'completed' : ''}
     * - Conditional attributes: ${todo.completed ? 'checked' : ''}
     * - Conditional rendering: ${todo.description ? '...' : ''}
     * - XSS protection: escapeHtml(todo.title)
     */
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

/**
 * Attach event listeners to a todo element
 * 
 * @param {HTMLElement} element - The DOM element for the todo
 * @param {Object} todo - The todo data object
 * 
 * This function sets up all the interactive behavior for a single todo:
 * - Checkbox for toggling completion
 * - Edit button to enter edit mode
 * - Delete button to remove the todo
 * - Save button to save edits
 * - Cancel button to discard edits
 */
function attachTodoEventListeners(element, todo) {
    /**
     * Get references to all interactive elements within this todo
     * 
     * We use querySelector to find elements within the specific todo element,
     * not the entire document. This ensures we get the right elements even
     * when there are multiple todos.
     */
    const checkbox = element.querySelector('.todo-checkbox');
    const editBtn = element.querySelector('.btn-edit');
    const deleteBtn = element.querySelector('.btn-delete');
    const saveBtn = element.querySelector('.btn-save');
    const cancelBtn = element.querySelector('.btn-cancel');
    
    /**
     * Checkbox change handler - Toggle completion status
     * 
     * When the user clicks the checkbox, we immediately update the server.
     * The checkbox.checked property gives us the new state.
     */
    checkbox.addEventListener('change', () => {
        updateTodo(todo.id, { completed: checkbox.checked });
    });
    
    /**
     * Edit button handler - Enter edit mode
     * 
     * We add the 'editing' class to show the edit form and hide the
     * display elements. This is controlled by CSS.
     */
    editBtn.addEventListener('click', () => {
        element.classList.add('editing');
    });
    
    /**
     * Delete button handler - Remove the todo
     * 
     * We ask for confirmation before deleting to prevent accidental deletions.
     * This is a good UX practice for destructive actions.
     */
    deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this todo?')) {
            deleteTodo(todo.id);
        }
    });
    
    /**
     * Save button handler - Save edits
     * 
     * We get the new values from the edit form, validate them,
     * and send them to the server.
     */
    saveBtn.addEventListener('click', () => {
        // Get the new values from the edit form
        const newTitle = element.querySelector('.edit-title').value.trim();
        const newDescription = element.querySelector('.edit-description').value.trim();
        
        // Validate that title is not empty
        if (!newTitle) {
            alert('Title cannot be empty');
            return;
        }
        
        /**
         * Update the todo on the server
         * 
         * If successful, we exit edit mode by removing the 'editing' class.
         */
        updateTodo(todo.id, {
            title: newTitle,
            description: newDescription,
        }).then(() => {
            element.classList.remove('editing');
        });
    });
    
    /**
     * Cancel button handler - Discard edits
     * 
     * We exit edit mode and reset the form values to the original values.
     * This ensures that if the user enters edit mode again, they see the
     * current values, not their previous unsaved edits.
     */
    cancelBtn.addEventListener('click', () => {
        element.classList.remove('editing');
        
        // Reset form values to original values
        element.querySelector('.edit-title').value = todo.title;
        element.querySelector('.edit-description').value = todo.description || '';
    });
}

/**
 * Get filtered todos based on the current filter
 * 
 * @returns {Array} Filtered array of todos
 * 
 * FILTER LOGIC:
 * - 'all': Return all todos
 * - 'active': Return only incomplete todos (completed = false)
 * - 'completed': Return only completed todos (completed = true)
 * 
 * We use Array.filter() which creates a new array containing only
 * the elements that pass the test function.
 */
function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            // Return todos where completed is false
            return todos.filter(t => !t.completed);
        case 'completed':
            // Return todos where completed is true
            return todos.filter(t => t.completed);
        default:
            // Return all todos
            return todos;
    }
}

/**
 * Update the statistics display
 * 
 * This function calculates and displays:
 * - Total number of todos
 * - Number of active (incomplete) todos
 * - Number of completed todos
 * 
 * CALCULATION:
 * We use Array.filter() to count todos that match certain criteria.
 * filter().length gives us the count of matching items.
 */
function updateStats() {
    // Total is simply the length of the todos array
    const total = todos.length;
    
    // Count completed todos
    const completed = todos.filter(t => t.completed).length;
    
    // Active is total minus completed
    const active = total - completed;
    
    /**
     * Update the DOM with the new counts
     * 
     * We use textContent (not innerHTML) because we're setting plain text,
     * not HTML. This is safer and more efficient.
     */
    totalCount.textContent = `Total: ${total}`;
    activeCount.textContent = `Active: ${active}`;
    completedCount.textContent = `Completed: ${completed}`;
}

/**
 * Show an error message to the user
 * 
 * @param {string} message - The error message to display
 * 
 * CURRENT IMPLEMENTATION:
 * We use a simple alert() for now. This is not ideal for production.
 * 
 * BETTER ALTERNATIVES:
 * - Toast notifications (non-blocking, auto-dismiss)
 * - Error banner at the top of the page
 * - Inline error messages near the relevant UI element
 * - Modal dialog for critical errors
 */
function showError(message) {
    alert(message);
}

/**
 * Escape HTML to prevent XSS attacks
 * 
 * @param {string} text - The text to escape
 * @returns {string} HTML-safe text
 * 
 * XSS (Cross-Site Scripting) PREVENTION:
 * If we directly insert user input into HTML, a malicious user could
 * inject JavaScript code that would run in other users' browsers.
 * 
 * EXAMPLE ATTACK:
 * If a user enters: <script>alert('hacked!')</script>
 * Without escaping, this would execute as JavaScript!
 * 
 * HOW IT WORKS:
 * We create a temporary div element and set its textContent (not innerHTML).
 * textContent automatically escapes HTML special characters.
 * Then we read back the innerHTML, which gives us the escaped version.
 * 
 * WHAT IT DOES:
 * - < becomes <
 * - > becomes >
 * - & becomes &
 * - " becomes "
 * - ' becomes '
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/*
 * ============================================================================
 * END OF FILE
 * ============================================================================
 * 
 * SUMMARY OF KEY CONCEPTS:
 * 
 * 1. ASYNC/AWAIT: Makes asynchronous code easier to read and write
 * 2. FETCH API: Modern way to make HTTP requests
 * 3. ERROR HANDLING: Always use try/catch with async functions
 * 4. STATE MANAGEMENT: Keep local state in sync with server state
 * 5. DOM MANIPULATION: Use efficient methods to update the UI
 * 6. EVENT HANDLING: Set up listeners for user interactions
 * 7. SECURITY: Always escape user input to prevent XSS
 * 8. USER EXPERIENCE: Provide feedback for all user actions
 * 
 * NEXT STEPS FOR LEARNING:
 * - Learn about JavaScript frameworks (React, Vue, Angular)
 * - Explore state management libraries (Redux, Vuex)
 * - Study advanced async patterns (Promises, generators)
 * - Learn about testing JavaScript applications
 * - Understand build tools and bundlers (Webpack, Vite)
 */

// Made with Bob
