from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import mediapipe as mp
import io
from PIL import Image
import base64
import json
from typing import List, Dict, Any

app = FastAPI(title="AI Sign Language API", version="1.0.0")

# Add CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe hands
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

@app.get("/")
async def root():
    return {"message": "AI Sign Language API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Sign Language API"}

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
        
        # Process with MediaPipe (expects RGB)
        results = hands.process(rgb_image)
        
        if not results.multi_hand_landmarks:
            return {
                "detected": False,
                "message": "No hands detected in the image",
                "suggestions": ["Ensure hands are clearly visible", "Check lighting conditions"]
            }
        
        # Collect per-hand details
        hands_data: List[Dict[str, Any]] = []
        image_h, image_w = rgb_image.shape[:2]

        def serialize_landmarks(lms: List[Any]) -> List[Dict[str, float]]:
            return [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in lms]

        def compute_bbox(lms: List[Any]) -> Dict[str, int]:
            xs = [int(lm.x * image_w) for lm in lms]
            ys = [int(lm.y * image_h) for lm in lms]
            x_min, x_max = max(min(xs), 0), min(max(xs), image_w - 1)
            y_min, y_max = max(min(ys), 0), min(max(ys), image_h - 1)
            return {
                "x": x_min,
                "y": y_min,
                "width": max(x_max - x_min, 1),
                "height": max(y_max - y_min, 1)
            }

        # Optional annotation canvas
        annotated_bgr = None
        if annotated:
            annotated_bgr = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)

        for idx, hand_lms in enumerate(results.multi_hand_landmarks):
            handedness_label = None
            if results.multi_handedness and idx < len(results.multi_handedness):
                handedness_label = results.multi_handedness[idx].classification[0].label

            hand_info = {
                "index": idx,
                "handedness": handedness_label,
                "landmarks": serialize_landmarks(hand_lms.landmark),
                "bbox": compute_bbox(hand_lms.landmark)
            }
            hands_data.append(hand_info)

            if annotated and annotated_bgr is not None:
                mp_drawing.draw_landmarks(
                    annotated_bgr,
                    hand_lms,
                    mp_hands.HAND_CONNECTIONS,
                )

        response: Dict[str, Any] = {
            "detected": True,
            "num_hands": len(hands_data),
            "hands": hands_data,
            "message": f"Detected {len(hands_data)} hand(s)"
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
                # MediaPipe expects RGB
                results = hands_stream.process(cv_image_rgb)

                if not results.multi_hand_landmarks:
                    await websocket.send_json({
                        "detected": False,
                        "num_hands": 0,
                        "message": "No hands detected"
                    })
                    continue

                image_h, image_w = cv_image_rgb.shape[:2]
                hands_payload = []

                for idx, hand_lms in enumerate(results.multi_hand_landmarks):
                    handedness_label = None
                    if results.multi_handedness and idx < len(results.multi_handedness):
                        handedness_label = results.multi_handedness[idx].classification[0].label

                    xs = [int(lm.x * image_w) for lm in hand_lms.landmark]
                    ys = [int(lm.y * image_h) for lm in hand_lms.landmark]
                    x_min, x_max = max(min(xs), 0), min(max(xs), image_w - 1)
                    y_min, y_max = max(min(ys), 0), min(max(ys), image_h - 1)

                    hands_payload.append({
                        "index": idx,
                        "handedness": handedness_label,
                        "bbox": {
                            "x": x_min,
                            "y": y_min,
                            "width": max(x_max - x_min, 1),
                            "height": max(y_max - y_min, 1)
                        },
                        "landmarks": [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in hand_lms.landmark]
                    })

                await websocket.send_json({
                    "detected": True,
                    "num_hands": len(hands_payload),
                    "hands": hands_payload,
                    "message": f"Detected {len(hands_payload)} hand(s)"
                })
            except Exception as inner_exc:
                await websocket.send_json({"error": f"Processing error: {str(inner_exc)}"})
    except WebSocketDisconnect:
        # Client disconnected; gracefully end
        return

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
