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
from detection_models import EnhancedHandDetector
from sign_analysis import analyze_hand_for_sign

# Try to import MediaPipe, fallback to OpenCV-only if not available
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    print("Warning: MediaPipe not available. Using enhanced detection methods.")

app = FastAPI(title="AI Sign Language API", version="1.0.0")

# Add CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize enhanced hand detector
detector = EnhancedHandDetector()
detection_info = detector.get_detection_info()

# Legacy MediaPipe initialization for backward compatibility
if MEDIAPIPE_AVAILABLE:
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    hands = mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=2,
        min_detection_confidence=0.5
    )
    
    # Streaming-optimized hands instance for live detection
    hands_stream = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
else:
    # Fallback for when MediaPipe is not available
    mp_hands = None
    mp_drawing = None
    hands = None
    hands_stream = None

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

# Old detect_hands_opencv function moved to detection_models.py

@app.get("/")
async def root():
    return {"message": "AI Sign Language API is running!"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "AI Sign Language API",
        "detection_info": detection_info
    }

@app.get("/detection-methods")
async def get_detection_methods():
    """
    Get information about available detection methods
    """
    return {
        "available_methods": detector.get_available_methods(),
        "detection_info": detection_info,
        "recommended_method": "ensemble" if len(detector.get_available_methods()) > 1 else detector.get_available_methods()[0] if detector.get_available_methods() else "none"
    }

@app.post("/detect-sign")
async def detect_sign(file: UploadFile = File(...), annotated: bool = False):
    """
    Detect sign language from uploaded image
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
        
        # Use enhanced detection system
        hands_data = detector.detect_hands_ensemble(rgb_image)
        
        if not hands_data:
            return {
                "detected": False,
                "message": "No hands detected in the image",
                "suggestions": ["Ensure hands are clearly visible", "Check lighting conditions", "Try different angles"],
                "detection_methods_used": detector.get_available_methods(),
                "available_methods": detector.get_available_methods()
            }
        
        # Analyze each detected hand for sign language
        signs_detected = []
        for hand in hands_data:
            sign_analysis = analyze_hand_for_sign(hand)
            sign_analysis["method"] = hand.get("method", "unknown")
            sign_analysis["hand_index"] = hand.get("index", 0)
            signs_detected.append(sign_analysis)
        
        # Create annotated image if requested
        annotated_bgr = None
        if annotated:
            annotated_bgr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
            
            # Draw bounding boxes for all detected hands
            for hand in hands_data:
                bbox = hand["bbox"]
                cv2.rectangle(annotated_bgr, 
                            (bbox["x"], bbox["y"]), 
                            (bbox["x"] + bbox["width"], bbox["y"] + bbox["height"]), 
                            (0, 255, 0), 2)
                
                # Add method and confidence info
                method_text = hand.get("method", "unknown")
                confidence = hand.get("confidence", 0.0)
                cv2.putText(annotated_bgr, f"{method_text} ({confidence:.2f})", 
                           (bbox["x"], bbox["y"] - 10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        # Prepare response
        methods_used = list(set(hand.get("method", "unknown") for hand in hands_data))
        response: Dict[str, Any] = {
            "detected": True,
            "num_hands": len(hands_data),
            "hands": hands_data,
            "signs_detected": signs_detected,
            "message": f"Detected {len(signs_detected)} sign(s): {', '.join([sign['letter'] for sign in signs_detected])}",
            "detection_methods_used": methods_used,
            "available_methods": detector.get_available_methods()
        }

        if annotated and annotated_bgr is not None:
            _, buffer = cv2.imencode('.jpg', annotated_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
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
                
                # Use enhanced detection system
                hands_data = detector.detect_hands_ensemble(cv_image_rgb)

                if not hands_data:
                    methods_used = detector.get_available_methods()
                    await websocket.send_json({
                        "detected": False,
                        "num_hands": 0,
                        "message": "No hands detected",
                        "detection_methods_used": methods_used,
                        "available_methods": methods_used
                    })
                    continue

                # Analyze each detected hand for sign language
                signs_detected = []
                for hand in hands_data:
                    sign_analysis = analyze_hand_for_sign(hand)
                    sign_analysis["method"] = hand.get("method", "unknown")
                    sign_analysis["hand_index"] = hand.get("index", 0)
                    signs_detected.append(sign_analysis)

                # Prepare response with method information
                methods_used = list(set(hand.get("method", "unknown") for hand in hands_data))
                await websocket.send_json({
                    "detected": True,
                    "num_hands": len(hands_data),
                    "hands": hands_data,
                    "signs_detected": signs_detected,
                    "message": f"Detected {len(signs_detected)} sign(s): {', '.join([sign['letter'] for sign in signs_detected])}",
                    "detection_methods_used": methods_used,
                    "available_methods": detector.get_available_methods()
                })
            except Exception as inner_exc:
                await websocket.send_json({"error": f"Processing error: {str(inner_exc)}"})
    except WebSocketDisconnect:
        # Client disconnected; gracefully end
        return

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
