# AI Sign Language Recognition System

A full-stack application for real-time sign language detection and learning, built with FastAPI (backend) and React (frontend).

## Features

- **Real-time Detection**: Live webcam-based sign language detection using MediaPipe
- **Image Upload**: Upload images for sign language analysis
- **Learning Mode**: Interactive sign language learning with descriptions
- **WebSocket Support**: Real-time communication between frontend and backend
- **Hand Landmark Detection**: Advanced hand tracking and landmark detection

## Project Structure

```
kanzai-app/
├── backend/
│   ├── main.py              # FastAPI server
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── public/
│   │   └── index.html       # HTML template
│   ├── src/
│   │   ├── components/
│   │   │   └── LiveSignDetection.js
│   │   ├── App.js           # Main React component
│   │   └── index.js         # React entry point
│   └── package.json         # Node.js dependencies
└── README.md
```

## Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the FastAPI server:**
   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8000`

## Frontend Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Start the React development server:**
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

## API Endpoints

- `GET /` - API status
- `GET /health` - Health check
- `GET /signs` - Get available sign language mappings
- `GET /sign/{letter}` - Get specific sign information
- `POST /detect-sign` - Detect sign language from uploaded image
- `WS /ws/live-detect` - WebSocket for real-time detection

## Technologies Used

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **MediaPipe**: Google's framework for building perception pipelines
- **OpenCV**: Computer vision library
- **WebSocket**: Real-time communication

### Frontend
- **React**: JavaScript library for building user interfaces
- **WebSocket**: Real-time communication with backend
- **Canvas API**: For image processing and webcam capture

## Usage

1. Start both the backend and frontend servers
2. Open the React app in your browser
3. Use the "Live Detection" tab for real-time sign language detection
4. Use the "Upload Image" tab to analyze uploaded images
5. Use the "Learn Signs" tab to explore sign language alphabet

## Requirements

- Python 3.8+
- Node.js 16+
- Modern web browser with camera support
- Good lighting for optimal hand detection

## Development

The project is structured with separate backend and frontend directories for easy development and deployment. The backend provides a REST API and WebSocket endpoints, while the frontend consumes these services to provide a rich user interface.