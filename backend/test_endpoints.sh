#!/bin/bash

# Test script for Todo API endpoints
# Make sure the Flask server is running on http://localhost:5000

API_URL="http://localhost:5000/api"

echo "========================================="
echo "Testing Todo API Endpoints"
echo "========================================="
echo ""

# Test 1: GET /api/todos (empty list)
echo "1. GET /api/todos - Get all todos (should be empty initially)"
curl -X GET "${API_URL}/todos"
echo -e "\n"

# Test 2: POST /api/todos - Create first todo
echo "2. POST /api/todos - Create a new todo"
TODO1=$(curl -X POST "${API_URL}/todos" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}')
echo $TODO1
TODO1_ID=$(echo $TODO1 | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo -e "\n"

# Test 3: POST /api/todos - Create second todo
echo "3. POST /api/todos - Create another todo"
TODO2=$(curl -X POST "${API_URL}/todos" \
  -H "Content-Type: application/json" \
  -d '{"title": "Finish project", "description": "Complete the Flask todo app"}')
echo $TODO2
TODO2_ID=$(echo $TODO2 | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo -e "\n"

# Test 4: GET /api/todos (with data)
echo "4. GET /api/todos - Get all todos (should have 2 todos)"
curl -X GET "${API_URL}/todos"
echo -e "\n"

# Test 5: PUT /api/todos/<id> - Update todo
echo "5. PUT /api/todos/${TODO1_ID} - Update first todo (mark as completed)"
curl -X PUT "${API_URL}/todos/${TODO1_ID}" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
echo -e "\n"

# Test 6: PUT /api/todos/<id> - Update title and description
echo "6. PUT /api/todos/${TODO2_ID} - Update second todo (change title)"
curl -X PUT "${API_URL}/todos/${TODO2_ID}" \
  -H "Content-Type: application/json" \
  -d '{"title": "Finish Flask project", "description": "Add tests and documentation"}'
echo -e "\n"

# Test 7: GET /api/todos (verify updates)
echo "7. GET /api/todos - Verify updates"
curl -X GET "${API_URL}/todos"
echo -e "\n"

# Test 8: DELETE /api/todos/<id>
echo "8. DELETE /api/todos/${TODO1_ID} - Delete first todo"
curl -X DELETE "${API_URL}/todos/${TODO1_ID}"
echo -e "\n"

# Test 9: GET /api/todos (after deletion)
echo "9. GET /api/todos - Get todos after deletion (should have 1 todo)"
curl -X GET "${API_URL}/todos"
echo -e "\n"

# Test 10: Error handling - Try to get non-existent todo
echo "10. DELETE /api/todos/99999 - Try to delete non-existent todo (should return 404)"
curl -X DELETE "${API_URL}/todos/99999"
echo -e "\n"

# Test 11: Error handling - Create todo without title
echo "11. POST /api/todos - Try to create todo without title (should return 400)"
curl -X POST "${API_URL}/todos" \
  -H "Content-Type: application/json" \
  -d '{"description": "No title provided"}'
echo -e "\n"

echo "========================================="
echo "All tests completed!"
echo "========================================="

# Made with Bob
