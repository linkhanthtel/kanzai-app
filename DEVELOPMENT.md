# Development Guide

## Quick Start

### 1. Backend Setup
```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Start the FastAPI server
python main.py
# OR use the startup script
../start_backend.sh
```

### 2. Frontend Setup
```bash
# Install Node.js dependencies
cd frontend
npm install

# Start the React development server
npm start
# OR use the startup script
../start_frontend.sh
```

## Project Structure

```
kanzai-app/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main FastAPI application (REST + WebSocket)
│   ├── detection_models.py # Hand detection methods
│   ├── sign_analysis.py    # Sign/letter analysis logic
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── public/
│   │   └── index.html      # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   ├── LiveSignDetection.js
│   │   │   └── Reveal.js   # Scroll-reveal animation helper
│   │   ├── App.js          # Main React component
│   │   ├── index.css       # Global styles / theme
│   │   └── index.js        # React entry point
│   └── package.json        # Node.js dependencies
├── start_backend.sh        # Backend startup script
├── start_frontend.sh       # Frontend startup script
└── README.md
```

## API Endpoints

### REST Endpoints
- `GET /` - API status
- `GET /health` - Health check
- `GET /signs` - Get available sign language mappings
- `GET /sign/{letter}` - Get specific sign information
- `POST /detect-sign` - Detect sign language from uploaded image

### WebSocket Endpoints
- `WS /ws/live-detect` - Real-time sign language detection

## Development Notes

### Backend (FastAPI)
- Uses MediaPipe for hand detection and landmark tracking
- Supports both static image upload and real-time WebSocket detection
- CORS enabled for frontend communication
- Handles image processing with OpenCV and PIL

### Frontend (React)
- Modern React with hooks (useState, useEffect, useRef, useCallback)
- WebSocket integration for real-time detection
- Canvas API for webcam capture and image processing
- Responsive design with modern UI components

### Key Features
1. **Live Detection**: Real-time webcam-based sign language detection
2. **Image Upload**: Static image analysis with annotation support
3. **Learning Mode**: Interactive sign language alphabet learning
4. **WebSocket Communication**: Real-time data exchange between frontend and backend

## Troubleshooting

### Common Issues

1. **MediaPipe Installation Issues**
   - Ensure Python 3.8+ is installed
   - Try: `pip install --upgrade pip`
   - Then: `pip install mediapipe`

2. **WebSocket Connection Issues**
   - Ensure backend is running on port 8000
   - Check browser console for connection errors
   - Verify CORS settings in backend

3. **Camera Access Issues**
   - Ensure browser has camera permissions
   - Use HTTPS in production (required for camera access)
   - Check browser compatibility

4. **React Development Server Issues**
   - Ensure Node.js 16+ is installed
   - Try: `npm install` to reinstall dependencies
   - Check for port conflicts (default port 3000)

## Production Deployment

### Backend
- Use a production ASGI server like Gunicorn with Uvicorn workers
- Set up proper CORS origins for production
- Use environment variables for configuration

### Frontend
- Build the React app: `npm run build`
- Serve static files with a web server like Nginx
- Ensure HTTPS for camera access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.
