"""
Sign language analysis functions
Analyzes hand landmarks and bounding boxes to determine sign language letters
"""

import numpy as np
from typing import Dict, Any, List

# Sign language alphabet mapping
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

def analyze_hand_for_sign(hand: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze hand data to determine the most likely sign language letter
    
    Args:
        hand: Hand detection data with landmarks and/or bounding box
        
    Returns:
        Dictionary with letter, confidence, and description
    """
    
    # If we have MediaPipe landmarks, use them for analysis
    if hand.get("landmarks") and len(hand["landmarks"]) > 0:
        return analyze_landmarks(hand["landmarks"])
    
    # Otherwise, use bounding box analysis
    return analyze_bounding_box(hand.get("bbox", {}))

def analyze_landmarks(landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
    """
    Analyze MediaPipe hand landmarks to determine sign
    
    Args:
        landmarks: List of 21 hand landmark points
        
    Returns:
        Dictionary with predicted letter and confidence
    """
    
    if len(landmarks) != 21:
        return {"letter": "?", "confidence": 0.0, "description": "Invalid landmarks"}
    
    # Convert landmarks to numpy array for easier processing
    points = np.array([[lm["x"], lm["y"], lm["z"]] for lm in landmarks])
    
    # Analyze finger positions
    finger_analysis = analyze_finger_positions(points)
    
    # Determine sign based on finger analysis
    predicted_letter = determine_sign_from_fingers(finger_analysis)
    
    return {
        "letter": predicted_letter,
        "confidence": finger_analysis["confidence"],
        "description": SIGN_MAPPING.get(predicted_letter, "Unknown sign")
    }

def analyze_finger_positions(points: np.ndarray) -> Dict[str, Any]:
    """
    Analyze finger positions from landmark points
    
    Args:
        points: Array of 21 landmark points
        
    Returns:
        Dictionary with finger analysis results
    """
    
    # MediaPipe hand landmark indices
    # Thumb: 0-4, Index: 5-8, Middle: 9-12, Ring: 13-16, Pinky: 17-20
    thumb_tip = points[4]
    index_tip = points[8]
    middle_tip = points[12]
    ring_tip = points[16]
    pinky_tip = points[20]
    
    # Wrist reference point
    wrist = points[0]
    
    # Calculate finger extensions (simplified)
    thumb_extended = is_finger_extended(points[0], points[1], points[2], points[3], points[4])
    index_extended = is_finger_extended(points[5], points[6], points[7], points[8])
    middle_extended = is_finger_extended(points[9], points[10], points[11], points[12])
    ring_extended = is_finger_extended(points[13], points[14], points[15], points[16])
    pinky_extended = is_finger_extended(points[17], points[18], points[19], points[20])
    
    # Calculate confidence based on landmark quality
    confidence = calculate_landmark_confidence(points)
    
    return {
        "thumb": thumb_extended,
        "index": index_extended,
        "middle": middle_extended,
        "ring": ring_extended,
        "pinky": pinky_extended,
        "confidence": confidence
    }

def is_finger_extended(*finger_points):
    """Check if a finger is extended based on landmark positions"""
    if len(finger_points) < 3:
        return False
    
    # Calculate angles between finger segments
    # If the angle is close to 180 degrees, finger is extended
    vectors = []
    for i in range(len(finger_points) - 1):
        vectors.append(finger_points[i+1] - finger_points[i])
    
    if len(vectors) < 2:
        return False
    
    # Calculate angle between first two segments
    v1, v2 = vectors[0], vectors[1]
    cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
    angle = np.arccos(np.clip(cos_angle, -1.0, 1.0))
    
    # If angle is close to 180 degrees (π radians), finger is extended
    return angle > 2.5  # Approximately 143 degrees

def calculate_landmark_confidence(points: np.ndarray) -> float:
    """Calculate confidence based on landmark quality"""
    # Simple confidence calculation based on landmark spread
    if len(points) == 0:
        return 0.0
    
    # Calculate the spread of landmarks
    x_range = np.max(points[:, 0]) - np.min(points[:, 0])
    y_range = np.max(points[:, 1]) - np.min(points[:, 1])
    
    # Normalize confidence based on hand size
    spread = np.sqrt(x_range**2 + y_range**2)
    confidence = min(spread * 10, 1.0)  # Scale to 0-1 range
    
    return confidence

def determine_sign_from_fingers(finger_analysis: Dict[str, Any]) -> str:
    """
    Determine sign language letter from finger analysis
    
    Args:
        finger_analysis: Dictionary with finger positions and confidence
        
    Returns:
        Predicted sign language letter
    """
    
    thumb = finger_analysis["thumb"]
    index = finger_analysis["index"]
    middle = finger_analysis["middle"]
    ring = finger_analysis["ring"]
    pinky = finger_analysis["pinky"]
    
    # Sign language letter determination based on finger positions
    if not thumb and not index and not middle and not ring and not pinky:
        return "E"  # Fist
    elif thumb and not index and not middle and not ring and not pinky:
        return "A"  # Thumb up
    elif not thumb and index and not middle and not ring and not pinky:
        return "D"  # Index finger only
    elif not thumb and index and middle and not ring and not pinky:
        return "V"  # V sign
    elif not thumb and index and middle and ring and not pinky:
        return "W"  # Three fingers
    elif not thumb and not index and not middle and not ring and pinky:
        return "I"  # Pinky only
    elif thumb and not index and not middle and not ring and pinky:
        return "Y"  # Thumb and pinky
    elif index and middle and ring and pinky and not thumb:
        return "B"  # All fingers except thumb
    elif thumb and index and not middle and not ring and not pinky:
        return "L"  # L shape
    elif thumb and index and middle and not ring and not pinky:
        return "K"  # K shape
    elif not thumb and index and middle and ring and pinky:
        return "B"  # All fingers
    else:
        # Default to most common sign or random based on confidence
        return "A" if finger_analysis["confidence"] > 0.5 else "?"

def analyze_bounding_box(bbox: Dict[str, int]) -> Dict[str, Any]:
    """
    Analyze hand bounding box to make basic sign predictions
    
    Args:
        bbox: Bounding box with x, y, width, height
        
    Returns:
        Dictionary with predicted letter and confidence
    """
    
    if not bbox or bbox.get("width", 0) == 0 or bbox.get("height", 0) == 0:
        return {"letter": "?", "confidence": 0.0, "description": "Invalid bounding box"}
    
    width = bbox["width"]
    height = bbox["height"]
    aspect_ratio = width / height
    
    # Basic heuristics based on hand shape
    if aspect_ratio > 1.3:
        predicted_letter = "B"  # Wide hand (fingers spread)
    elif aspect_ratio < 0.7:
        predicted_letter = "I"  # Tall hand (single finger)
    elif width > 120 and height > 120:
        predicted_letter = "O"  # Large hand (open palm)
    elif width < 60 or height < 60:
        predicted_letter = "D"  # Small hand (single finger)
    else:
        predicted_letter = "A"  # Default
    
    # Calculate confidence based on size and aspect ratio
    size_confidence = min((width * height) / 10000, 1.0)
    shape_confidence = 1.0 - abs(aspect_ratio - 1.0) * 0.5
    confidence = (size_confidence + shape_confidence) / 2
    
    return {
        "letter": predicted_letter,
        "confidence": confidence,
        "description": SIGN_MAPPING.get(predicted_letter, "Unknown sign")
    }
