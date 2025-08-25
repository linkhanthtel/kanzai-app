#!/bin/bash

echo "Starting AI Sign Language API..."
echo "Installing dependencies..."

# Install dependencies
pip install -r requirements.txt

echo "Starting server..."
echo "API will be available at: http://localhost:8000"
echo "Interactive docs at: http://localhost:8000/docs"
echo "Press Ctrl+C to stop the server"

# Start the server
python main.py

