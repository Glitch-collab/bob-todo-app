import pytest
from app import app as flask_app
from database import db
from models import Todo


@pytest.fixture
def app():
    """Create and configure a test Flask application."""
    flask_app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
    })
    
    # Create the database and tables
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create a test client for the Flask application."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test CLI runner for the Flask application."""
    return app.test_cli_runner()


@pytest.fixture
def sample_todo(app):
    """Create a sample todo for testing."""
    with app.app_context():
        todo = Todo(
            title='Test Todo',
            description='Test Description',
            completed=False
        )
        db.session.add(todo)
        db.session.commit()
        
        # Refresh to get the ID
        db.session.refresh(todo)
        todo_id = todo.id
        
        yield todo_id
        
        # Cleanup is handled by the app fixture


@pytest.fixture
def multiple_todos(app):
    """Create multiple todos for testing."""
    with app.app_context():
        todos = [
            Todo(title='Todo 1', description='Description 1', completed=False),
            Todo(title='Todo 2', description='Description 2', completed=True),
            Todo(title='Todo 3', description='Description 3', completed=False),
        ]
        
        db.session.add_all(todos)
        db.session.commit()
        
        # Get IDs
        todo_ids = [todo.id for todo in todos]
        
        yield todo_ids

# Made with Bob
