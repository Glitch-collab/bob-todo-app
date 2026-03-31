# Testing Guide for Todo API

This document provides instructions for testing the Todo API endpoints.

## Prerequisites

1. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Start the Flask server:
```bash
python app.py
```

The server will run on `http://localhost:5000`

## Manual Testing with cURL

### 1. GET /api/todos - Get all todos

**Request:**
```bash
curl -X GET http://localhost:5000/api/todos
```

**Expected Response (empty):**
```json
[]
```

**Expected Response (with data):**
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "created_at": "2024-03-31T10:00:00"
  }
]
```

---

### 2. POST /api/todos - Create a new todo

**Request:**
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy groceries",
    "description": "Milk, eggs, bread"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2024-03-31T10:00:00"
}
```

**Error Case - Missing Title (400 Bad Request):**
```bash
curl -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"description": "No title"}'
```

Response:
```json
{
  "error": "Title is required"
}
```

---

### 3. PUT /api/todos/<id> - Update a todo

**Request (Update title and description):**
```bash
curl -X PUT http://localhost:5000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy groceries and cook",
    "description": "Milk, eggs, bread, chicken"
  }'
```

**Request (Mark as completed):**
```bash
curl -X PUT http://localhost:5000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

**Expected Response (200 OK):**
```json
{
  "id": 1,
  "title": "Buy groceries and cook",
  "description": "Milk, eggs, bread, chicken",
  "completed": true,
  "created_at": "2024-03-31T10:00:00"
}
```

**Error Case - Todo Not Found (404 Not Found):**
```bash
curl -X PUT http://localhost:5000/api/todos/99999 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated"}'
```

Response:
```json
{
  "error": "Todo not found"
}
```

---

### 4. DELETE /api/todos/<id> - Delete a todo

**Request:**
```bash
curl -X DELETE http://localhost:5000/api/todos/1
```

**Expected Response (200 OK):**
```json
{
  "message": "Todo deleted successfully"
}
```

**Error Case - Todo Not Found (404 Not Found):**
```bash
curl -X DELETE http://localhost:5000/api/todos/99999
```

Response:
```json
{
  "error": "Todo not found"
}
```

---

## Automated Testing Script

Run the automated test script to test all endpoints:

```bash
cd backend
chmod +x test_endpoints.sh
./test_endpoints.sh
```

This script will:
1. Create multiple todos
2. Retrieve all todos
3. Update todos
4. Delete todos
5. Test error cases

---

## Unit Testing with pytest

### Run all tests:
```bash
cd backend
pytest test_app.py -v
```

### Run tests with coverage:
```bash
pytest test_app.py --cov=. --cov-report=html --cov-report=term
```

### View coverage report:
```bash
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

### Run specific test class:
```bash
pytest test_app.py::TestGetTodos -v
pytest test_app.py::TestCreateTodo -v
pytest test_app.py::TestUpdateTodo -v
pytest test_app.py::TestDeleteTodo -v
```

### Run specific test:
```bash
pytest test_app.py::TestGetTodos::test_get_empty_todos -v
```

---

## Test Coverage Goals

The test suite aims for **90%+ code coverage** and includes:

### Test Categories:
1. **GET /api/todos** - 4 test cases
   - Empty database
   - Multiple todos
   - Correct data format
   - Data integrity

2. **POST /api/todos** - 8 test cases
   - Successful creation
   - Without description
   - With completed status
   - Missing title (error)
   - Empty title (error)
   - No data (error)
   - Invalid JSON (error)

3. **PUT /api/todos/<id>** - 7 test cases
   - Update title
   - Update description
   - Update completed status
   - Update multiple fields
   - Non-existent todo (error)
   - Empty payload

4. **DELETE /api/todos/<id>** - 4 test cases
   - Successful deletion
   - Non-existent todo (error)
   - Delete twice (error)
   - Delete one of multiple

5. **Integration Tests** - 2 test cases
   - Complete CRUD workflow
   - Multiple todos management

6. **Model Tests** - 2 test cases
   - to_dict() method
   - __repr__() method

7. **Error Handlers** - 1 test case
   - 404 handler

**Total: 28+ comprehensive test cases**

---

## Expected Test Results

```
========================= test session starts ==========================
collected 28 items

test_app.py::TestGetTodos::test_get_empty_todos PASSED           [  3%]
test_app.py::TestGetTodos::test_get_all_todos PASSED             [  7%]
test_app.py::TestGetTodos::test_get_todos_returns_correct_data PASSED [ 10%]
test_app.py::TestCreateTodo::test_create_todo_success PASSED     [ 14%]
test_app.py::TestCreateTodo::test_create_todo_without_description PASSED [ 17%]
test_app.py::TestCreateTodo::test_create_todo_with_completed_status PASSED [ 21%]
test_app.py::TestCreateTodo::test_create_todo_missing_title PASSED [ 25%]
test_app.py::TestCreateTodo::test_create_todo_empty_title PASSED [ 28%]
test_app.py::TestCreateTodo::test_create_todo_no_data PASSED     [ 32%]
test_app.py::TestCreateTodo::test_create_todo_invalid_json PASSED [ 35%]
test_app.py::TestUpdateTodo::test_update_todo_title PASSED       [ 39%]
test_app.py::TestUpdateTodo::test_update_todo_description PASSED [ 42%]
test_app.py::TestUpdateTodo::test_update_todo_completed_status PASSED [ 46%]
test_app.py::TestUpdateTodo::test_update_todo_multiple_fields PASSED [ 50%]
test_app.py::TestUpdateTodo::test_update_nonexistent_todo PASSED [ 53%]
test_app.py::TestUpdateTodo::test_update_todo_empty_payload PASSED [ 57%]
test_app.py::TestDeleteTodo::test_delete_todo_success PASSED     [ 60%]
test_app.py::TestDeleteTodo::test_delete_nonexistent_todo PASSED [ 64%]
test_app.py::TestDeleteTodo::test_delete_todo_multiple_times PASSED [ 67%]
test_app.py::TestDeleteTodo::test_delete_one_of_multiple_todos PASSED [ 71%]
test_app.py::TestErrorHandlers::test_404_error_handler PASSED    [ 75%]
test_app.py::TestTodoModel::test_todo_to_dict PASSED             [ 78%]
test_app.py::TestTodoModel::test_todo_repr PASSED                [ 82%]
test_app.py::TestIntegration::test_create_update_delete_workflow PASSED [ 85%]
test_app.py::TestIntegration::test_multiple_todos_management PASSED [ 89%]

========================== 28 passed in 0.45s ==========================

Coverage Report:
Name            Stmts   Miss  Cover
-----------------------------------
app.py             65      2    97%
database.py         8      0   100%
models.py          15      0   100%
-----------------------------------
TOTAL              88      2    98%
```

---

## Troubleshooting

### Server not running
```
curl: (7) Failed to connect to localhost port 5000
```
**Solution:** Start the Flask server with `python app.py`

### CORS errors in browser
**Solution:** Flask-CORS is already configured in app.py

### Database locked
**Solution:** Stop the server and delete `todos.db`, then restart

### Import errors in tests
**Solution:** Make sure you're in the backend directory and pytest is installed