#!/bin/bash

echo "========================================="
echo "Frontend Testing Guide"
echo "========================================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:5000/api/todos > /dev/null 2>&1; then
    echo "⚠️  Backend server is not running!"
    echo ""
    echo "Starting Flask backend server..."
    cd backend
    python app.py &
    BACKEND_PID=$!
    cd ..
    
    echo "Waiting for backend to start..."
    sleep 3
    
    if ! curl -s http://localhost:5000/api/todos > /dev/null 2>&1; then
        echo "❌ Failed to start backend server"
        exit 1
    fi
    
    echo "✅ Backend server started (PID: $BACKEND_PID)"
else
    echo "✅ Backend server is already running"
fi

echo ""
echo "========================================="
echo "Frontend Testing Instructions"
echo "========================================="
echo ""
echo "1. Open frontend/index.html in your browser"
echo "   - Option A: Double-click frontend/index.html"
echo "   - Option B: Right-click → Open With → Browser"
echo "   - Option C: Use a local server (recommended):"
echo ""
echo "   cd frontend"
echo "   python -m http.server 8000"
echo "   # Then open http://localhost:8000"
echo ""
echo "2. Test the following features:"
echo ""
echo "   ✓ Add a new todo"
echo "     - Enter title and description"
echo "     - Click 'Add Todo' button"
echo "     - Verify todo appears in the list"
echo ""
echo "   ✓ Mark todo as complete"
echo "     - Click the checkbox next to a todo"
echo "     - Verify todo gets strikethrough style"
echo "     - Check statistics update"
echo ""
echo "   ✓ Edit a todo"
echo "     - Click 'Edit' button"
echo "     - Modify title/description"
echo "     - Click 'Save' or 'Cancel'"
echo ""
echo "   ✓ Delete a todo"
echo "     - Click 'Delete' button"
echo "     - Confirm deletion"
echo "     - Verify todo is removed"
echo ""
echo "   ✓ Filter todos"
echo "     - Click 'All', 'Active', or 'Completed' buttons"
echo "     - Verify correct todos are shown"
echo ""
echo "   ✓ Check statistics"
echo "     - Verify Total, Active, and Completed counts"
echo "     - Verify they update correctly"
echo ""
echo "3. Check browser console for errors:"
echo "   - Press F12 or Cmd+Option+I (Mac)"
echo "   - Go to Console tab"
echo "   - Should see no errors"
echo ""
echo "4. Test responsive design:"
echo "   - Resize browser window"
echo "   - Test on mobile device or use browser dev tools"
echo ""
echo "========================================="
echo "API Endpoints Available:"
echo "========================================="
echo ""
echo "GET    http://localhost:5000/api/todos"
echo "POST   http://localhost:5000/api/todos"
echo "PUT    http://localhost:5000/api/todos/<id>"
echo "DELETE http://localhost:5000/api/todos/<id>"
echo ""
echo "========================================="
echo "Quick API Test:"
echo "========================================="
echo ""

# Test API
echo "Testing API endpoints..."
echo ""

echo "1. GET /api/todos (should be empty initially):"
curl -s http://localhost:5000/api/todos | python -m json.tool
echo ""

echo "2. POST /api/todos (create a test todo):"
curl -s -X POST http://localhost:5000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Frontend", "description": "Testing the frontend integration"}' | python -m json.tool
echo ""

echo "3. GET /api/todos (should have 1 todo now):"
curl -s http://localhost:5000/api/todos | python -m json.tool
echo ""

echo "========================================="
echo "✅ Backend is ready for frontend testing!"
echo "========================================="
echo ""
echo "Now open frontend/index.html in your browser"
echo "or run: cd frontend && python -m http.server 8000"
echo ""

# Made with Bob
