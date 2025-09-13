from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import io
from PIL import Image
import base64
import json
from typing import List, Dict, Any

app = FastAPI(title="AI Sign Language API (No MediaPipe)", version="1.0.0")

# Add CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic sign language mapping (you can expand this later)
SIGN_MAPPING = {
    "A": "Thumb and index finger form a circle, other fingers extended",
    "B": "All fingers extended and together",
    "C": "Fingers curved as if holding a cup",
    "D": "Index finger extended, other fingers closed",
    "E": "All fingers closed in a fist",
    "F": "Index and middle finger extended, other fingers closed",
    "G": "Index finger pointing, other fingers closed",
    "H": "Index and middle finger extended and separated",
    "I": "Pinky finger extended, other fingers closed",
    "J": "Pinky finger extended and curved",
    "K": "Index and middle finger extended and separated, thumb extended",
    "L": "Index finger and thumb extended, other fingers closed",
    "M": "Three fingers extended, thumb and pinky closed",
    "N": "Index and middle finger extended, other fingers closed",
    "O": "All fingers curved to form a circle",
    "P": "Index finger pointing down, other fingers closed",
    "Q": "Index finger pointing down and curved",
    "R": "Index and middle finger crossed, other fingers closed",
    "S": "All fingers closed in a fist",
    "T": "Index finger extended, other fingers closed",
    "U": "Index and middle finger extended together",
    "V": "Index and middle finger extended and separated",
    "W": "Index, middle, and ring finger extended",
    "X": "Index finger bent, other fingers closed",
    "Y": "Thumb and pinky extended, other fingers closed",
    "Z": "Index finger drawing a Z shape"
}

def detect_hands_opencv(image: np.ndarray) -> List[Dict[str, Any]]:
    """
    Basic hand detection using OpenCV (without MediaPipe)
    This is a simplified version that detects skin-colored regions
    """
    # Convert to HSV for better skin detection
    hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
    
    # Define range for skin color in HSV
    lower_skin = np.array([0, 20, 70], dtype=np.uint8)
    upper_skin = np.array([20, 255, 255], dtype=np.uint8)
    
    # Create mask for skin color
    mask = cv2.inRange(hsv, lower_skin, upper_skin)
    
    # Apply morphological operations to clean up the mask
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    # Find contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    hands_data = []
    for idx, contour in enumerate(contours):
        # Filter out small contours
        area = cv2.contourArea(contour)
        if area < 1000:  # Minimum area threshold
            continue
            
        # Get bounding box
        x, y, w, h = cv2.boundingRect(contour)
        
        # Create a simple hand representation
        hand_info = {
            "index": idx,
            "handedness": "Unknown",  # Can't determine without MediaPipe
            "landmarks": [],  # Would need MediaPipe for landmarks
            "bbox": {
                "x": x,
                "y": y,
                "width": w,
                "height": h
            }
        }
        hands_data.append(hand_info)
    
    return hands_data

@app.get("/")
async def root():
    return {"message": "AI Sign Language API is running! (OpenCV-only version)"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Sign Language API (OpenCV-only)", "note": "MediaPipe not available for Python 3.13"}

@app.post("/detect-sign")
async def detect_sign(file: UploadFile = File(...), annotated: bool = False):
    """
    Detect hand regions from uploaded image using OpenCV
    Note: This is a simplified version without MediaPipe hand landmark detection
    """
    try:
        # Read and validate image
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Convert PIL -> numpy RGB
        rgb_image = np.array(image)
        
        # Process with OpenCV hand detection
        hands_data = detect_hands_opencv(rgb_image)
        
        if not hands_data:
            return {
                "detected": False,
                "message": "No hands detected in the image",
                "suggestions": ["Ensure hands are clearly visible", "Check lighting conditions", "Note: This version uses basic OpenCV detection"]
            }
        
        response: Dict[str, Any] = {
            "detected": True,
            "num_hands": len(hands_data),
            "hands": hands_data,
            "message": f"Detected {len(hands_data)} hand region(s) using OpenCV",
            "note": "This is a simplified version without MediaPipe hand landmark detection"
        }

        if annotated:
            # Create annotated image
            annotated_image = rgb_image.copy()
            for hand in hands_data:
                bbox = hand["bbox"]
                cv2.rectangle(annotated_image, 
                            (bbox["x"], bbox["y"]), 
                            (bbox["x"] + bbox["width"], bbox["y"] + bbox["height"]), 
                            (0, 255, 0), 2)
                cv2.putText(annotated_image, f"Hand {hand['index']}", 
                           (bbox["x"], bbox["y"] - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Convert to base64
            _, buffer = cv2.imencode('.jpg', cv2.cvtColor(annotated_image, cv2.COLOR_RGB2BGR), 
                                   [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            response["annotated_image"] = "data:image/jpeg;base64," + base64.b64encode(buffer.tobytes()).decode("utf-8")

        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/signs")
async def get_available_signs():
    """
    Get list of available sign language mappings
    """
    return {
        "available_signs": list(SIGN_MAPPING.keys()),
        "total_signs": len(SIGN_MAPPING),
        "description": "Basic American Sign Language alphabet"
    }

@app.get("/sign/{letter}")
async def get_sign_info(letter: str):
    """
    Get information about a specific sign
    """
    letter = letter.upper()
    if letter not in SIGN_MAPPING:
        raise HTTPException(status_code=404, detail=f"Sign '{letter}' not found")
    
    return {
        "letter": letter,
        "description": SIGN_MAPPING[letter],
        "category": "Alphabet"
    }

@app.websocket("/ws/live-detect")
async def websocket_live_detect(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive_text()
            try:
                payload = json.loads(message)
                image_b64 = payload.get("image")
                if not image_b64:
                    await websocket.send_json({"error": "Missing 'image' field (base64 or data URL)"})
                    continue

                # Support data URLs (e.g., "data:image/jpeg;base64,....")
                if "," in image_b64 and image_b64.strip().startswith("data:"):
                    image_b64 = image_b64.split(",", 1)[1]

                image_bytes = base64.b64decode(image_b64)
                image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

                cv_image_rgb = np.array(image)
                hands_data = detect_hands_opencv(cv_image_rgb)

                if not hands_data:
                    await websocket.send_json({
                        "detected": False,
                        "num_hands": 0,
                        "message": "No hands detected",
                        "note": "Using OpenCV-only detection"
                    })
                    continue

                await websocket.send_json({
                    "detected": True,
                    "num_hands": len(hands_data),
                    "hands": hands_data,
                    "message": f"Detected {len(hands_data)} hand region(s)",
                    "note": "Using OpenCV-only detection"
                })
            except Exception as inner_exc:
                await websocket.send_json({"error": f"Processing error: {str(inner_exc)}"})
    except WebSocketDisconnect:
        # Client disconnected; gracefully end
        return

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
