"""
Enhanced detection models for sign language recognition
Supports multiple approaches: OpenCV, Hugging Face transformers, and pose estimation
"""

import cv2
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging

# Try to import optional dependencies
try:
    from transformers import pipeline, AutoImageProcessor, AutoModel
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("Warning: Transformers not available. Install with: pip install transformers torch")

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False

logger = logging.getLogger(__name__)

class EnhancedHandDetector:
    """
    Enhanced hand detector supporting multiple detection methods
    """
    
    def __init__(self):
        self.detection_methods = []
        self.huggingface_models = {}
        self.mediapipe_hands = None
        
        # Initialize available detection methods
        self._initialize_detection_methods()
    
    def _initialize_detection_methods(self):
        """Initialize all available detection methods"""
        
        # OpenCV method (always available)
        self.detection_methods.append("opencv")
        logger.info("OpenCV detection method initialized")
        
        # MediaPipe method
        if MEDIAPIPE_AVAILABLE:
            try:
                self.mediapipe_hands = mp.solutions.hands.Hands(
                    static_image_mode=False,
                    max_num_hands=2,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                self.detection_methods.append("mediapipe")
                logger.info("MediaPipe detection method initialized")
            except Exception as e:
                logger.warning(f"Failed to initialize MediaPipe: {e}")
        
        # Hugging Face transformers
        if TRANSFORMERS_AVAILABLE:
            self._initialize_huggingface_models()
    
    def _initialize_huggingface_models(self):
        """Initialize Hugging Face models for hand detection"""
        try:
            # Object detection model for hand detection
            self.huggingface_models['object_detection'] = pipeline(
                "object-detection",
                model="facebook/detr-resnet-50",
                device=0 if torch.cuda.is_available() else -1
            )
            self.detection_methods.append("huggingface_object")
            logger.info("Hugging Face object detection model initialized")
            
        except Exception as e:
            logger.warning(f"Failed to initialize Hugging Face models: {e}")
    
    def detect_hands_opencv(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Enhanced OpenCV hand detection with multiple techniques
        """
        hands_data = []
        
        # Method 1: Skin color detection (original)
        skin_hands = self._detect_skin_color_hands(image)
        hands_data.extend(skin_hands)
        
        # Method 2: Contour-based detection
        contour_hands = self._detect_contour_hands(image)
        hands_data.extend(contour_hands)
        
        # Method 3: Template matching (if we had templates)
        # template_hands = self._detect_template_hands(image)
        # hands_data.extend(template_hands)
        
        # Remove duplicates and merge close detections
        hands_data = self._merge_close_detections(hands_data)
        
        return hands_data
    
    def _detect_skin_color_hands(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Original skin color detection method"""
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        
        # Define range for skin color in HSV
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        
        # Create mask for skin color
        mask = cv2.inRange(hsv, lower_skin, upper_skin)
        
        # Apply morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        # Find contours
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        hands_data = []
        for idx, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            if area < 1000:
                continue
                
            x, y, w, h = cv2.boundingRect(contour)
            
            hand_info = {
                "index": idx,
                "handedness": "Unknown",
                "landmarks": [],
                "bbox": {"x": x, "y": y, "width": w, "height": h},
                "confidence": min(area / 10000, 1.0),  # Normalized confidence
                "method": "opencv_skin"
            }
            hands_data.append(hand_info)
        
        return hands_data
    
    def _detect_contour_hands(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Contour-based hand detection using edge detection"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detection
        edges = cv2.Canny(blurred, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        hands_data = []
        for idx, contour in enumerate(contours):
            area = cv2.contourArea(contour)
            if area < 500:  # Smaller threshold for edge detection
                continue
            
            # Check if contour could be a hand (rough shape analysis)
            perimeter = cv2.arcLength(contour, True)
            if perimeter == 0:
                continue
                
            circularity = 4 * np.pi * area / (perimeter * perimeter)
            
            # Hands typically have lower circularity (not perfectly round)
            if 0.1 < circularity < 0.8:
                x, y, w, h = cv2.boundingRect(contour)
                
                hand_info = {
                    "index": idx + 100,  # Offset to avoid conflicts
                    "handedness": "Unknown",
                    "landmarks": [],
                    "bbox": {"x": x, "y": y, "width": w, "height": h},
                    "confidence": min(area / 5000, 1.0),
                    "method": "opencv_contour"
                }
                hands_data.append(hand_info)
        
        return hands_data
    
    def detect_hands_huggingface(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Hand detection using Hugging Face transformers
        """
        if not TRANSFORMERS_AVAILABLE or 'object_detection' not in self.huggingface_models:
            return []
        
        try:
            # Convert numpy array to PIL Image
            from PIL import Image
            pil_image = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
            
            # Run object detection
            results = self.huggingface_models['object_detection'](pil_image)
            
            hands_data = []
            for idx, result in enumerate(results):
                # Look for person-related detections (hands are often detected as part of person)
                if result['label'].lower() in ['person', 'hand', 'handbag'] and result['score'] > 0.3:
                    bbox = result['box']
                    
                    hand_info = {
                        "index": idx,
                        "handedness": "Unknown",
                        "landmarks": [],
                        "bbox": {
                            "x": int(bbox['xmin']),
                            "y": int(bbox['ymin']),
                            "width": int(bbox['xmax'] - bbox['xmin']),
                            "height": int(bbox['ymax'] - bbox['ymin'])
                        },
                        "confidence": result['score'],
                        "method": "huggingface"
                    }
                    hands_data.append(hand_info)
            
            return hands_data
            
        except Exception as e:
            logger.error(f"Hugging Face detection failed: {e}")
            return []
    
    def detect_hands_mediapipe(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Hand detection using MediaPipe
        """
        if not MEDIAPIPE_AVAILABLE or self.mediapipe_hands is None:
            return []
        
        try:
            results = self.mediapipe_hands.process(image)
            
            if not results.multi_hand_landmarks:
                return []
            
            hands_data = []
            image_h, image_w = image.shape[:2]
            
            for idx, hand_lms in enumerate(results.multi_hand_landmarks):
                handedness_label = None
                if results.multi_handedness and idx < len(results.multi_handedness):
                    handedness_label = results.multi_handedness[idx].classification[0].label
                
                # Calculate bounding box
                xs = [int(lm.x * image_w) for lm in hand_lms.landmark]
                ys = [int(lm.y * image_h) for lm in hand_lms.landmark]
                x_min, x_max = max(min(xs), 0), min(max(xs), image_w - 1)
                y_min, y_max = max(min(ys), 0), min(max(ys), image_h - 1)
                
                hand_info = {
                    "index": idx,
                    "handedness": handedness_label,
                    "landmarks": [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in hand_lms.landmark],
                    "bbox": {
                        "x": x_min,
                        "y": y_min,
                        "width": max(x_max - x_min, 1),
                        "height": max(y_max - y_min, 1)
                    },
                    "confidence": 0.9,  # MediaPipe typically has high confidence
                    "method": "mediapipe"
                }
                hands_data.append(hand_info)
            
            return hands_data
            
        except Exception as e:
            logger.error(f"MediaPipe detection failed: {e}")
            return []
    
    def detect_hands_ensemble(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """
        Ensemble detection using multiple methods and combining results
        """
        all_hands = []
        
        # Run all available detection methods
        if "opencv" in self.detection_methods:
            opencv_hands = self.detect_hands_opencv(image)
            all_hands.extend(opencv_hands)
        
        if "mediapipe" in self.detection_methods:
            mediapipe_hands = self.detect_hands_mediapipe(image)
            all_hands.extend(mediapipe_hands)
        
        if "huggingface_object" in self.detection_methods:
            hf_hands = self.detect_hands_huggingface(image)
            all_hands.extend(hf_hands)
        
        # Merge and deduplicate results
        merged_hands = self._merge_close_detections(all_hands)
        
        # Sort by confidence
        merged_hands.sort(key=lambda x: x['confidence'], reverse=True)
        
        return merged_hands
    
    def _merge_close_detections(self, hands_data: List[Dict[str, Any]], 
                               distance_threshold: float = 50.0) -> List[Dict[str, Any]]:
        """
        Merge detections that are close to each other
        """
        if not hands_data:
            return []
        
        merged = []
        used = set()
        
        for i, hand1 in enumerate(hands_data):
            if i in used:
                continue
            
            # Find all hands close to this one
            close_hands = [hand1]
            for j, hand2 in enumerate(hands_data[i+1:], i+1):
                if j in used:
                    continue
                
                # Calculate distance between bounding box centers
                center1 = (hand1['bbox']['x'] + hand1['bbox']['width']/2,
                          hand1['bbox']['y'] + hand1['bbox']['height']/2)
                center2 = (hand2['bbox']['x'] + hand2['bbox']['width']/2,
                          hand2['bbox']['y'] + hand2['bbox']['height']/2)
                
                distance = np.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)
                
                if distance < distance_threshold:
                    close_hands.append(hand2)
                    used.add(j)
            
            # Merge close hands (take the one with highest confidence)
            best_hand = max(close_hands, key=lambda x: x['confidence'])
            best_hand['confidence'] = min(sum(h['confidence'] for h in close_hands) / len(close_hands) * 1.2, 1.0)
            best_hand['methods_used'] = [h['method'] for h in close_hands]
            
            merged.append(best_hand)
            used.add(i)
        
        return merged
    
    def get_available_methods(self) -> List[str]:
        """Get list of available detection methods"""
        return self.detection_methods.copy()
    
    def get_detection_info(self) -> Dict[str, Any]:
        """Get information about available detection methods"""
        return {
            "available_methods": self.detection_methods,
            "transformers_available": TRANSFORMERS_AVAILABLE,
            "mediapipe_available": MEDIAPIPE_AVAILABLE,
            "total_methods": len(self.detection_methods)
        }
