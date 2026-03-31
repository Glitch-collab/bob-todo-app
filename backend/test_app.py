import pytest
import json
from models import Todo
from database import db


class TestGetTodos:
    """Test cases for GET /api/todos endpoint."""
    
    def test_get_empty_todos(self, client):
        """Test getting todos when database is empty."""
        response = client.get('/api/todos')
        assert response.status_code == 200
        assert response.json == []
    
    def test_get_all_todos(self, client, multiple_todos):
        """Test getting all todos."""
        response = client.get('/api/todos')
        assert response.status_code == 200
        data = response.json
        assert len(data) == 3
        assert all('id' in todo for todo in data)
        assert all('title' in todo for todo in data)
        assert all('completed' in todo for todo in data)
    
    def test_get_todos_returns_correct_data(self, client, sample_todo):
        """Test that returned todo data is correct."""
        response = client.get('/api/todos')
        assert response.status_code == 200
        data = response.json
        assert len(data) == 1
        assert data[0]['title'] == 'Test Todo'
        assert data[0]['description'] == 'Test Description'
        assert data[0]['completed'] is False
        assert 'created_at' in data[0]


class TestCreateTodo:
    """Test cases for POST /api/todos endpoint."""
    
    def test_create_todo_success(self, client):
        """Test creating a new todo successfully."""
        payload = {
            'title': 'New Todo',
            'description': 'New Description'
        }
        response = client.post(
            '/api/todos',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 201
        data = response.json
        assert data['title'] == 'New Todo'
        assert data['description'] == 'New Description'
        assert data['completed'] is False
        assert 'id' in data
        assert 'created_at' in data
    
    def test_create_todo_without_description(self, client):
        """Test creating a todo without description."""
        payload = {'title': 'Todo without description'}
        response = client.post(
            '/api/todos',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 201
        data = response.json
        assert data['title'] == 'Todo without description'
        assert data['description'] == ''
    
    def test_create_todo_with_completed_status(self, client):
        """Test creating a todo with completed status."""
        payload = {
            'title': 'Completed Todo',
            'completed': True
        }
        response = client.post(
            '/api/todos',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 201
        data = response.json
        assert data['completed'] is True
    
    def test_create_todo_missing_title(self, client):
        """Test creating a todo without title returns error."""
        payload = {'description': 'No title'}
        response = client.post(
            '/api/todos',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 400
        assert 'error' in response.json
        assert 'Title is required' in response.json['error']
    
    def test_create_todo_empty_title(self, client):
        """Test creating a todo with empty title returns error."""
        payload = {'title': ''}
        response = client.post(
            '/api/todos',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 400
    
    def test_create_todo_no_data(self, client):
        """Test creating a todo without data returns error."""
        response = client.post(
            '/api/todos',
            data=json.dumps({}),
            content_type='application/json'
        )
        assert response.status_code == 400
    
    def test_create_todo_invalid_json(self, client):
        """Test creating a todo with invalid JSON."""
        response = client.post(
            '/api/todos',
            data='invalid json',
            content_type='application/json'
        )
        assert response.status_code in [400, 500]


class TestUpdateTodo:
    """Test cases for PUT /api/todos/<id> endpoint."""
    
    def test_update_todo_title(self, client, sample_todo):
        """Test updating todo title."""
        payload = {'title': 'Updated Title'}
        response = client.put(
            f'/api/todos/{sample_todo}',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 200
        data = response.json
        assert data['title'] == 'Updated Title'
        assert data['description'] == 'Test Description'
    
    def test_update_todo_description(self, client, sample_todo):
        """Test updating todo description."""
        payload = {'description': 'Updated Description'}
        response = client.put(
            f'/api/todos/{sample_todo}',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 200
        data = response.json
        assert data['description'] == 'Updated Description'
        assert data['title'] == 'Test Todo'
    
    def test_update_todo_completed_status(self, client, sample_todo):
        """Test updating todo completed status."""
        payload = {'completed': True}
        response = client.put(
            f'/api/todos/{sample_todo}',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 200
        data = response.json
        assert data['completed'] is True
    
    def test_update_todo_multiple_fields(self, client, sample_todo):
        """Test updating multiple fields at once."""
        payload = {
            'title': 'New Title',
            'description': 'New Description',
            'completed': True
        }
        response = client.put(
            f'/api/todos/{sample_todo}',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 200
        data = response.json
        assert data['title'] == 'New Title'
        assert data['description'] == 'New Description'
        assert data['completed'] is True
    
    def test_update_nonexistent_todo(self, client):
        """Test updating a todo that doesn't exist."""
        payload = {'title': 'Updated'}
        response = client.put(
            '/api/todos/99999',
            data=json.dumps(payload),
            content_type='application/json'
        )
        assert response.status_code == 404
        assert 'error' in response.json
        assert 'not found' in response.json['error'].lower()
    
    def test_update_todo_empty_payload(self, client, sample_todo):
        """Test updating todo with empty payload."""
        response = client.put(
            f'/api/todos/{sample_todo}',
            data=json.dumps({}),
            content_type='application/json'
        )
        assert response.status_code == 200
        # Todo should remain unchanged
        data = response.json
        assert data['title'] == 'Test Todo'


class TestDeleteTodo:
    """Test cases for DELETE /api/todos/<id> endpoint."""
    
    def test_delete_todo_success(self, client, sample_todo):
        """Test deleting a todo successfully."""
        response = client.delete(f'/api/todos/{sample_todo}')
        assert response.status_code == 200
        assert 'message' in response.json
        
        # Verify todo is deleted
        get_response = client.get('/api/todos')
        assert len(get_response.json) == 0
    
    def test_delete_nonexistent_todo(self, client):
        """Test deleting a todo that doesn't exist."""
        response = client.delete('/api/todos/99999')
        assert response.status_code == 404
        assert 'error' in response.json
        assert 'not found' in response.json['error'].lower()
    
    def test_delete_todo_multiple_times(self, client, sample_todo):
        """Test deleting the same todo twice."""
        # First delete
        response1 = client.delete(f'/api/todos/{sample_todo}')
        assert response1.status_code == 200
        
        # Second delete should fail
        response2 = client.delete(f'/api/todos/{sample_todo}')
        assert response2.status_code == 404
    
    def test_delete_one_of_multiple_todos(self, client, multiple_todos):
        """Test deleting one todo when multiple exist."""
        todo_id = multiple_todos[0]
        response = client.delete(f'/api/todos/{todo_id}')
        assert response.status_code == 200
        
        # Verify only one was deleted
        get_response = client.get('/api/todos')
        assert len(get_response.json) == 2


class TestErrorHandlers:
    """Test cases for error handlers."""
    
    def test_404_error_handler(self, client):
        """Test 404 error handler for non-existent endpoint."""
        response = client.get('/api/nonexistent')
        assert response.status_code == 404
        assert 'error' in response.json


class TestTodoModel:
    """Test cases for Todo model."""
    
    def test_todo_to_dict(self, app):
        """Test Todo model to_dict method."""
        with app.app_context():
            todo = Todo(
                title='Test',
                description='Description',
                completed=False
            )
            db.session.add(todo)
            db.session.commit()
            
            todo_dict = todo.to_dict()
            assert 'id' in todo_dict
            assert todo_dict['title'] == 'Test'
            assert todo_dict['description'] == 'Description'
            assert todo_dict['completed'] is False
            assert 'created_at' in todo_dict
    
    def test_todo_repr(self, app):
        """Test Todo model __repr__ method."""
        with app.app_context():
            todo = Todo(title='Test Todo')
            db.session.add(todo)
            db.session.commit()
            
            repr_str = repr(todo)
            assert 'Todo' in repr_str
            assert 'Test Todo' in repr_str


class TestIntegration:
    """Integration tests for complete workflows."""
    
    def test_create_update_delete_workflow(self, client):
        """Test complete CRUD workflow."""
        # Create
        create_response = client.post(
            '/api/todos',
            data=json.dumps({'title': 'Workflow Test'}),
            content_type='application/json'
        )
        assert create_response.status_code == 201
        todo_id = create_response.json['id']
        
        # Read
        get_response = client.get('/api/todos')
        assert len(get_response.json) == 1
        
        # Update
        update_response = client.put(
            f'/api/todos/{todo_id}',
            data=json.dumps({'completed': True}),
            content_type='application/json'
        )
        assert update_response.status_code == 200
        assert update_response.json['completed'] is True
        
        # Delete
        delete_response = client.delete(f'/api/todos/{todo_id}')
        assert delete_response.status_code == 200
        
        # Verify deletion
        final_get = client.get('/api/todos')
        assert len(final_get.json) == 0
    
    def test_multiple_todos_management(self, client):
        """Test managing multiple todos."""
        # Create multiple todos
        for i in range(5):
            client.post(
                '/api/todos',
                data=json.dumps({'title': f'Todo {i}'}),
                content_type='application/json'
            )
        
        # Verify all created
        response = client.get('/api/todos')
        assert len(response.json) == 5
        
        # Mark some as completed
        todos = response.json
        for i in range(3):
            client.put(
                f'/api/todos/{todos[i]["id"]}',
                data=json.dumps({'completed': True}),
                content_type='application/json'
            )
        
        # Verify updates
        updated_response = client.get('/api/todos')
        completed_count = sum(1 for t in updated_response.json if t['completed'])
        assert completed_count == 3

# Made with Bob
