# Python 3.13 Setup Guide

## Issue with MediaPipe and Python 3.13

Your project uses MediaPipe for hand detection, but MediaPipe doesn't currently support Python 3.13. This guide provides solutions to get your AI Sign Language API working.

## Current Status

✅ **Working**: FastAPI, OpenCV, NumPy, Pillow, and other dependencies  
❌ **Not Working**: MediaPipe (no Python 3.13 support yet)

## Solutions

### Option 1: Use the OpenCV-Only Version (Recommended for now)

I've created `main_no_mediapipe.py` which works with Python 3.13:

```bash
# Run the OpenCV-only version
python3 main_no_mediapipe.py
```

**Features:**
- ✅ Basic hand region detection using OpenCV
- ✅ All API endpoints working
- ✅ WebSocket support for live detection
- ✅ Image annotation
- ❌ No detailed hand landmarks (fingers, joints, etc.)

### Option 2: Use Python 3.11 or 3.12 for Full MediaPipe Support

If you need the full MediaPipe functionality, you can use an older Python version:

#### Using pyenv (Recommended)
```bash
# Install pyenv if you don't have it
brew install pyenv

# Install Python 3.11
pyenv install 3.11.9

# Set Python 3.11 for this project
pyenv local 3.11.9

# Install dependencies
python -m pip install -r requirements.txt

# Run the original version
python main.py
```

#### Using conda
```bash
# Create a new environment with Python 3.11
conda create -n kanzai-app python=3.11

# Activate the environment
conda activate kanzai-app

# Install dependencies
pip install -r requirements.txt

# Run the original version
python main.py
```

### Option 3: Wait for MediaPipe Python 3.13 Support

MediaPipe typically adds support for new Python versions within a few months. You can:
- Monitor the [MediaPipe releases](https://github.com/google/mediapipe/releases)
- Check [PyPI MediaPipe page](https://pypi.org/project/mediapipe/) for updates

## Running the API

### OpenCV Version (Current)
```bash
python3 main_no_mediapipe.py
```

### Full MediaPipe Version (with Python 3.11/3.12)
```bash
python main.py
```

## API Endpoints

Both versions support the same endpoints:

- `GET /` - API status
- `GET /health` - Health check
- `POST /detect-sign` - Upload image for hand detection
- `GET /signs` - List available signs
- `GET /sign/{letter}` - Get specific sign info
- `WS /ws/live-detect` - WebSocket for live detection

## Testing the API

```bash
# Health check
curl http://localhost:8000/health

# Get available signs
curl http://localhost:8000/signs

# Get specific sign info
curl http://localhost:8000/sign/A

# Interactive API docs
open http://localhost:8000/docs
```

## Differences Between Versions

| Feature | Original (MediaPipe) | OpenCV-Only |
|---------|---------------------|-------------|
| Hand Detection | ✅ Detailed landmarks | ✅ Basic regions |
| Finger Tracking | ✅ Individual fingers | ❌ Not available |
| Hand Orientation | ✅ Left/Right detection | ❌ Not available |
| Accuracy | ✅ High precision | ⚠️ Basic detection |
| Python 3.13 | ❌ Not supported | ✅ Fully supported |

## Next Steps

1. **For immediate use**: Use `main_no_mediapipe.py` with Python 3.13
2. **For full features**: Switch to Python 3.11/3.12 with `main.py`
3. **For production**: Consider using Docker with Python 3.11/3.12

## Docker Option (Future)

You could also create a Dockerfile with Python 3.11 to ensure consistent MediaPipe support:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["python", "main.py"]
```

This would allow you to use the full MediaPipe functionality regardless of your local Python version.
