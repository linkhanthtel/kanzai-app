# AI Sign Language API

A minimal FastAPI-based API for AI-powered sign language detection and recognition.

## Features

- **Hand Detection**: Uses MediaPipe for hand landmark detection
- **Sign Language Support**: Basic American Sign Language alphabet mapping
- **Image Processing**: Accepts image uploads for sign detection
- **RESTful API**: Clean endpoints for React frontend integration
- **CORS Enabled**: Ready for web application integration

## API Endpoints

- `GET /` - Root endpoint with API status
- `GET /health` - Health check endpoint
- `POST /detect-sign` - Upload image for sign detection
- `GET /signs` - Get list of available signs
- `GET /sign/{letter}` - Get specific sign information

## Setup

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server**:
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Access the API**:
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

## Usage Examples

### Test the API
```bash
# Health check
curl http://localhost:8000/health

# Get available signs
curl http://localhost:8000/signs

# Get specific sign info
curl http://localhost:8000/sign/A
```

### For React Integration
The API is configured with CORS to work with React applications. You can:
- Upload images using the `/detect-sign` endpoint
- Fetch sign information for display
- Build a complete sign language learning application

## Future Improvements

- Advanced sign recognition using machine learning
- Real-time video processing
- Support for more sign languages
- Gesture sequence recognition
- User authentication and progress tracking

## Dependencies

- FastAPI - Modern web framework
- MediaPipe - Hand tracking and pose estimation
- OpenCV - Image processing
- NumPy - Numerical computing
- PIL - Image handling
- Uvicorn - ASGI server

