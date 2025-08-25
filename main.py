from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import mediapipe as mp
import io
from PIL import Image
import base64

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
async def detect_sign(file: UploadFile = File(...)):
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
        
        # Convert to OpenCV format
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Process with MediaPipe
        results = hands.process(cv_image)
        
        if not results.multi_hand_landmarks:
            return {
                "detected": False,
                "message": "No hands detected in the image",
                "suggestions": ["Ensure hands are clearly visible", "Check lighting conditions"]
            }
        
        # Basic hand detection response
        num_hands = len(results.multi_hand_landmarks)
        
        # For now, return basic detection info
        # You can implement more sophisticated sign recognition here later
        return {
            "detected": True,
            "num_hands": num_hands,
            "message": f"Detected {num_hands} hand(s)",
            "landmarks": len(results.multi_hand_landmarks[0].landmark) if num_hands > 0 else 0,
            "confidence": "Basic detection completed"
        }
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
