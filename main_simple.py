from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Sign Language API", version="1.0.0")

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
        
        # For now, return basic response without heavy processing
        # You can implement MediaPipe processing here later
        return {
            "detected": True,
            "num_hands": 1,  # Placeholder
            "message": "Image uploaded successfully (basic mode)",
            "landmarks": 21,  # Placeholder for MediaPipe hand landmarks
            "confidence": "Basic detection completed",
            "note": "Full hand detection requires MediaPipe and OpenCV"
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

