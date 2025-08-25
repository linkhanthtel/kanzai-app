# Project Structure

```
kanzai/
├── main.py                 # Full AI Sign Language API with MediaPipe
├── main_simple.py          # Simplified version for testing (no heavy deps)
├── requirements.txt        # Python dependencies
├── README.md              # Project documentation
├── test_api.py            # API testing script
├── start.sh               # Unix/Mac startup script
├── start.bat              # Windows startup script
└── project_structure.md   # This file
```

## Quick Start Options

### Option 1: Simple Version (Recommended for testing)
```bash
python3 main_simple.py
```
- No heavy dependencies required
- Basic API functionality
- Perfect for development and testing

### Option 2: Full Version (With AI capabilities)
```bash
pip install -r requirements.txt
python3 main.py
```
- Includes MediaPipe for hand detection
- OpenCV for image processing
- Full AI sign language detection

### Option 3: Using startup scripts
```bash
# Unix/Mac
./start.sh

# Windows
start.bat
```

## API Endpoints

All endpoints are available at `http://localhost:8000`:

- `GET /` - API status
- `GET /health` - Health check
- `GET /signs` - List all available signs
- `GET /sign/{letter}` - Get specific sign info
- `POST /detect-sign` - Upload image for sign detection
- `GET /docs` - Interactive API documentation
- `GET /redoc` - Alternative API documentation

## Testing

Run the test script to verify all endpoints:
```bash
python3 test_api.py
```

## React Integration

The API is CORS-enabled and ready for React frontend integration. Use the endpoints to:
- Display sign language information
- Upload images for sign detection
- Build a complete learning application

