# Todo Application

A simple todo application with a Python Flask backend and JavaScript frontend.

## Features

- ✅ Create, read, update, and delete todos
- ✅ Mark todos as complete/incomplete
- ✅ Add optional descriptions to todos
- ✅ Filter todos (All, Active, Completed)
- ✅ Edit todos inline
- ✅ Real-time statistics
- ✅ Responsive design
- ✅ SQLite database (no installation needed)

## Project Structure

```
todo-app/
├── backend/
│   ├── app.py              # Flask REST API
│   ├── models.py           # Todo database model
│   ├── database.py         # Database initialization
│   ├── requirements.txt    # Python dependencies
│   └── todos.db           # SQLite database (auto-created)
├── frontend/
│   ├── index.html         # Main HTML page
│   ├── style.css          # Styling
│   └── script.js          # Frontend logic
└── README.md
```

## Technology Stack

### Backend
- **Flask** - Python web framework
- **Flask-CORS** - Cross-Origin Resource Sharing
- **Flask-SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database

### Frontend
- **Vanilla JavaScript (ES6+)** - No frameworks
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations

## Installation & Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python app.py
```

The backend server will start on `http://localhost:5000`

### Frontend Setup

1. Open `frontend/index.html` in your web browser, or
2. Use a simple HTTP server (recommended):

```bash
cd frontend
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/todos` | Get all todos | - |
| POST | `/api/todos` | Create a new todo | `{title, description?}` |
| PUT | `/api/todos/<id>` | Update a todo | `{title?, description?, completed?}` |
| DELETE | `/api/todos/<id>` | Delete a todo | - |

## Usage

1. **Add a Todo**: Enter a title (required) and optional description, then click "Add Todo"
2. **Complete a Todo**: Click the checkbox next to a todo
3. **Edit a Todo**: Click the "Edit" button, modify the fields, and click "Save"
4. **Delete a Todo**: Click the "Delete" button and confirm
5. **Filter Todos**: Use the filter buttons to view All, Active, or Completed todos

## Database Schema

```sql
CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development

### Backend Development
- The Flask app runs in debug mode by default
- Changes to Python files will auto-reload the server
- Database file (`todos.db`) is created automatically on first run

### Frontend Development
- No build process required
- Simply refresh the browser to see changes
- Check browser console for any JavaScript errors

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
- Make sure the Flask backend is running on port 5000
- Verify Flask-CORS is installed: `pip install Flask-CORS`

### Database Errors
If you encounter database errors:
- Delete `todos.db` and restart the Flask server
- The database will be recreated automatically

### Connection Refused
If the frontend can't connect to the backend:
- Ensure the Flask server is running (`python app.py`)
- Check that the API_BASE_URL in `script.js` matches your backend URL
- Verify no firewall is blocking port 5000

## Future Enhancements

- [ ] User authentication
- [ ] Due dates and reminders
- [ ] Priority levels
- [ ] Categories/tags
- [ ] Search functionality
- [ ] Drag-and-drop reordering
- [ ] Dark mode
- [ ] Export/import todos

## License

MIT License - feel free to use this project for learning or personal use.