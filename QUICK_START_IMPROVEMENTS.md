# Quick Start: Implementing Key Improvements

This guide provides ready-to-use code for the most impactful improvements to your todo application.

## 🚀 Priority 1: Enhanced Database Schema

### Step 1: Update the Todo Model

Replace [`backend/models.py`](backend/models.py) with:

```python
from datetime import datetime
from database import db

class Todo(db.Model):
    """Enhanced Todo model with priority, due dates, and soft delete."""
    __tablename__ = 'todos'
    
    # Core fields
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    completed = db.Column(db.Boolean, default=False, nullable=False, index=True)
    
    # New enhancement fields
    priority = db.Column(db.String(20), default='medium', nullable=False)
    due_date = db.Column(db.DateTime, nullable=True, index=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Soft delete support
    is_deleted = db.Column(db.Boolean, default=False, nullable=False, index=True)
    deleted_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        """Convert Todo to dictionary."""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'completed': self.completed,
            'priority': self.priority,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def soft_delete(self):
        """Mark todo as deleted without removing from database."""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
    
    def __repr__(self):
        return f'<Todo {self.id}: {self.title}>'
```

### Step 2: Migration Script

Create [`backend/migrate_db.py`](backend/migrate_db.py):

```python
"""
Database migration script to add new fields to existing todos table.
Run this once to upgrade your database schema.
"""
from app import app
from database import db
from sqlalchemy import text

def migrate_database():
    """Add new columns to existing todos table."""
    with app.app_context():
        try:
            # Add new columns
            with db.engine.connect() as conn:
                # Priority column
                conn.execute(text(
                    "ALTER TABLE todos ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' NOT NULL"
                ))
                
                # Due date column
                conn.execute(text(
                    "ALTER TABLE todos ADD COLUMN due_date DATETIME"
                ))
                
                # Completed at column
                conn.execute(text(
                    "ALTER TABLE todos ADD COLUMN completed_at DATETIME"
                ))
                
                # Soft delete columns
                conn.execute(text(
                    "ALTER TABLE todos ADD COLUMN is_deleted BOOLEAN DEFAULT 0 NOT NULL"
                ))
                conn.execute(text(
                    "ALTER TABLE todos ADD COLUMN deleted_at DATETIME"
                ))
                
                # Updated at column
                conn.execute(text(
                    "ALTER TABLE todos ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL"
                ))
                
                conn.commit()
            
            print("✅ Database migration completed successfully!")
            print("New fields added: priority, due_date, completed_at, is_deleted, deleted_at, updated_at")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            print("If columns already exist, you can ignore this error.")

if __name__ == '__main__':
    migrate_database()
```

Run migration:
```bash
cd backend
python migrate_db.py
```

## 🔌 Priority 2: Enhanced API Endpoints

### Add Pagination and Filtering

Update [`backend/app.py`](backend/app.py) GET endpoint:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from database import db, init_db
from models import Todo
from datetime import datetime

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

init_db(app)


@app.route('/api/todos', methods=['GET'])
def get_todos():
    """Get todos with pagination, filtering, and sorting."""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        completed = request.args.get('completed', type=str)
        priority = request.args.get('priority', type=str)
        search = request.args.get('search', type=str)
        sort_by = request.args.get('sort_by', 'created_at', type=str)
        order = request.args.get('order', 'desc', type=str)
        include_deleted = request.args.get('include_deleted', 'false', type=str).lower() == 'true'
        
        # Validate pagination
        per_page = min(per_page, 100)  # Max 100 items per page
        
        # Build query
        query = Todo.query
        
        # Filter out deleted todos by default
        if not include_deleted:
            query = query.filter_by(is_deleted=False)
        
        # Apply filters
        if completed is not None:
            completed_bool = completed.lower() == 'true'
            query = query.filter_by(completed=completed_bool)
        
        if priority:
            query = query.filter_by(priority=priority)
        
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    Todo.title.ilike(search_pattern),
                    Todo.description.ilike(search_pattern)
                )
            )
        
        # Apply sorting
        if hasattr(Todo, sort_by):
            order_column = getattr(Todo, sort_by)
            if order == 'asc':
                query = query.order_by(order_column.asc())
            else:
                query = query.order_by(order_column.desc())
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'todos': [todo.to_dict() for todo in pagination.items],
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/todos', methods=['POST'])
def create_todo():
    """Create a new todo with enhanced fields."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'title' not in data or not data['title'].strip():
            return jsonify({'error': 'Title is required'}), 400
        
        # Validate priority
        priority = data.get('priority', 'medium')
        if priority not in ['low', 'medium', 'high', 'urgent']:
            return jsonify({'error': 'Invalid priority. Must be: low, medium, high, or urgent'}), 400
        
        # Parse due_date if provided
        due_date = None
        if 'due_date' in data and data['due_date']:
            try:
                due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({'error': 'Invalid due_date format. Use ISO 8601 format'}), 400
        
        # Create new todo
        new_todo = Todo(
            title=data['title'],
            description=data.get('description', ''),
            completed=data.get('completed', False),
            priority=priority,
            due_date=due_date
        )
        
        db.session.add(new_todo)
        db.session.commit()
        
        return jsonify(new_todo.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    """Update an existing todo."""
    try:
        todo = db.session.get(Todo, todo_id)
        
        if not todo or todo.is_deleted:
            return jsonify({'error': 'Todo not found'}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'title' in data:
            if not data['title'].strip():
                return jsonify({'error': 'Title cannot be empty'}), 400
            todo.title = data['title']
        
        if 'description' in data:
            todo.description = data['description']
        
        if 'completed' in data:
            was_completed = todo.completed
            todo.completed = data['completed']
            
            # Set completed_at timestamp
            if todo.completed and not was_completed:
                todo.completed_at = datetime.utcnow()
            elif not todo.completed:
                todo.completed_at = None
        
        if 'priority' in data:
            if data['priority'] not in ['low', 'medium', 'high', 'urgent']:
                return jsonify({'error': 'Invalid priority'}), 400
            todo.priority = data['priority']
        
        if 'due_date' in data:
            if data['due_date']:
                try:
                    todo.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except ValueError:
                    return jsonify({'error': 'Invalid due_date format'}), 400
            else:
                todo.due_date = None
        
        db.session.commit()
        
        return jsonify(todo.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    """Soft delete a todo."""
    try:
        todo = db.session.get(Todo, todo_id)
        
        if not todo or todo.is_deleted:
            return jsonify({'error': 'Todo not found'}), 404
        
        # Soft delete
        todo.soft_delete()
        db.session.commit()
        
        return jsonify({'message': 'Todo deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get todo statistics."""
    try:
        total = Todo.query.filter_by(is_deleted=False).count()
        completed = Todo.query.filter_by(is_deleted=False, completed=True).count()
        active = total - completed
        
        # Count by priority
        priority_counts = {
            'low': Todo.query.filter_by(is_deleted=False, priority='low').count(),
            'medium': Todo.query.filter_by(is_deleted=False, priority='medium').count(),
            'high': Todo.query.filter_by(is_deleted=False, priority='high').count(),
            'urgent': Todo.query.filter_by(is_deleted=False, priority='urgent').count(),
        }
        
        # Overdue todos
        now = datetime.utcnow()
        overdue = Todo.query.filter(
            Todo.is_deleted == False,
            Todo.completed == False,
            Todo.due_date < now
        ).count()
        
        return jsonify({
            'total': total,
            'completed': completed,
            'active': active,
            'overdue': overdue,
            'by_priority': priority_counts
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/todos/bulk', methods=['POST'])
def create_bulk_todos():
    """Create multiple todos at once."""
    try:
        data = request.get_json()
        
        if not isinstance(data, list):
            return jsonify({'error': 'Expected array of todos'}), 400
        
        if len(data) > 50:
            return jsonify({'error': 'Maximum 50 todos per bulk operation'}), 400
        
        todos = []
        for item in data:
            if not item.get('title', '').strip():
                continue
            
            todo = Todo(
                title=item['title'],
                description=item.get('description', ''),
                completed=item.get('completed', False),
                priority=item.get('priority', 'medium')
            )
            todos.append(todo)
        
        db.session.add_all(todos)
        db.session.commit()
        
        return jsonify([todo.to_dict() for todo in todos]), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
```

## 🎨 Priority 3: Enhanced Frontend

### Update Frontend to Support New Features

Update [`frontend/script.js`](frontend/script.js) to add priority and due date support:

```javascript
// Add to the createTodoElement function
function createTodoElement(todo) {
    const date = new Date(todo.created_at);
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    
    // Priority badge
    const priorityColors = {
        'low': '#95a5a6',
        'medium': '#3498db',
        'high': '#f39c12',
        'urgent': '#e74c3c'
    };
    
    const priorityBadge = `<span class="priority-badge" style="background-color: ${priorityColors[todo.priority]}">${todo.priority}</span>`;
    
    // Due date display
    let dueDateHtml = '';
    if (todo.due_date) {
        const dueDate = new Date(todo.due_date);
        const isOverdue = dueDate < new Date() && !todo.completed;
        dueDateHtml = `<div class="due-date ${isOverdue ? 'overdue' : ''}">
            📅 Due: ${dueDate.toLocaleDateString()}
        </div>`;
    }
    
    return `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="todo-header">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                ${priorityBadge}
            </div>
            ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
            ${dueDateHtml}
            <div class="edit-form">
                <input type="text" class="edit-title" value="${escapeHtml(todo.title)}">
                <textarea class="edit-description" rows="2">${escapeHtml(todo.description || '')}</textarea>
                <select class="edit-priority">
                    <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>High</option>
                    <option value="urgent" ${todo.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                </select>
                <input type="date" class="edit-due-date" value="${todo.due_date ? todo.due_date.split('T')[0] : ''}">
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
```

### Add Priority and Due Date to Input Form

Update [`frontend/index.html`](frontend/index.html):

```html
<div class="todo-input-section">
    <input 
        type="text" 
        id="todoTitle" 
        placeholder="Enter todo title..." 
        maxlength="200"
    >
    <textarea 
        id="todoDescription" 
        placeholder="Enter description (optional)..." 
        rows="3"
    ></textarea>
    
    <!-- New fields -->
    <div class="todo-meta-inputs">
        <select id="todoPriority">
            <option value="low">Low Priority</option>
            <option value="medium" selected>Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
        </select>
        
        <input 
            type="date" 
            id="todoDueDate" 
            placeholder="Due date (optional)"
        >
    </div>
    
    <button id="addTodoBtn" class="btn btn-primary">Add Todo</button>
</div>
```

### Add CSS for New Elements

Add to [`frontend/style.css`](frontend/style.css):

```css
.priority-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    color: white;
    font-weight: 600;
    text-transform: uppercase;
    margin-left: 8px;
}

.due-date {
    font-size: 0.85rem;
    color: #7f8c8d;
    margin-top: 4px;
}

.due-date.overdue {
    color: #e74c3c;
    font-weight: 600;
}

.todo-meta-inputs {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}

.todo-meta-inputs select,
.todo-meta-inputs input[type="date"] {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.edit-priority,
.edit-due-date {
    width: 100%;
    padding: 8px;
    margin-bottom: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}
```

## 📦 Priority 4: Configuration Management

Create [`backend/.env.example`](backend/.env.example):

```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database
DATABASE_URL=sqlite:///todos.db

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Server
HOST=0.0.0.0
PORT=5002

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

Create [`backend/config.py`](backend/config.py):

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Pagination
    DEFAULT_PAGE_SIZE = int(os.getenv('DEFAULT_PAGE_SIZE', 20))
    MAX_PAGE_SIZE = int(os.getenv('MAX_PAGE_SIZE', 100))
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///todos_dev.db')
    SQLALCHEMY_ECHO = True

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```

## 🧪 Testing the Improvements

### Test the Enhanced API

```bash
# Get todos with pagination
curl "http://localhost:5002/api/todos?page=1&per_page=10"

# Filter by priority
curl "http://localhost:5002/api/todos?priority=high"

# Search todos
curl "http://localhost:5002/api/todos?search=meeting"

# Get statistics
curl "http://localhost:5002/api/stats"

# Create todo with priority and due date
curl -X POST http://localhost:5002/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Important Meeting",
    "description": "Quarterly review",
    "priority": "high",
    "due_date": "2026-04-15T10:00:00Z"
  }'

# Bulk create todos
curl -X POST http://localhost:5002/api/todos/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {"title": "Task 1", "priority": "low"},
    {"title": "Task 2", "priority": "high"},
    {"title": "Task 3", "priority": "medium"}
  ]'
```

## 📝 Next Steps

1. **Run the migration** to update your database schema
2. **Update your backend** with the enhanced endpoints
3. **Update your frontend** to support new features
4. **Test thoroughly** using the curl commands above
5. **Add more features** from the main IMPROVEMENTS.md document

## 🎯 Quick Wins

These improvements will immediately give you:
- ✅ Priority levels for todos
- ✅ Due dates with overdue detection
- ✅ Soft delete (recoverable deletion)
- ✅ Pagination for better performance
- ✅ Search and filtering
- ✅ Statistics endpoint
- ✅ Bulk operations
- ✅ Better timestamps (created_at, updated_at, completed_at)

Start with these changes and gradually add more features as needed!