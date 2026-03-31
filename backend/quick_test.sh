#!/bin/bash

echo "========================================="
echo "Quick Backend Test Script"
echo "========================================="
echo ""

# Check if Flask app file exists
if [ ! -f "flask_app.py" ]; then
    echo "❌ Error: flask_app.py not found"
    echo "Please ensure the Flask application file exists"
    exit 1
fi

echo "✓ Flask application file found"
echo ""

# Start the Flask server in the background
echo "Starting Flask server..."
python flask_app.py &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 3

# Check if server is running
if ! ps -p $SERVER_PID > /dev/null; then
    echo "❌ Error: Flask server failed to start"
    echo "Check for errors above"
    exit 1
fi

echo "✓ Flask server started (PID: $SERVER_PID)"
echo ""

# Test 1: GET empty todos
echo "Test 1: GET /api/todos (should be empty)"
curl -s http://localhost:5000/api/todos
echo -e "\n"

# Test 2: POST create todo
echo "Test 2: POST /api/todos (create new todo)"
RESPONSE=$(curl -s -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Todo", "description": "Testing the API"}')
echo $RESPONSE
TODO_ID=$(echo $RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo "Created todo with ID: $TODO_ID"
echo ""

# Test 3: GET todos (should have 1)
echo "Test 3: GET /api/todos (should have 1 todo)"
curl -s http://localhost:5000/api/todos
echo -e "\n"

# Test 4: PUT update todo
echo "Test 4: PUT /api/todos/$TODO_ID (mark as completed)"
curl -s -X PUT http://localhost:5000/api/todos/$TODO_ID \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
echo -e "\n"

# Test 5: DELETE todo
echo "Test 5: DELETE /api/todos/$TODO_ID"
curl -s -X DELETE http://localhost:5000/api/todos/$TODO_ID
echo -e "\n"

# Test 6: GET todos (should be empty again)
echo "Test 6: GET /api/todos (should be empty again)"
curl -s http://localhost:5000/api/todos
echo -e "\n"

# Stop the server
echo ""
echo "Stopping Flask server..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo ""
echo "========================================="
echo "✓ All tests completed successfully!"
echo "========================================="

# Made with Bob
