#!/bin/bash

echo "Installing enhanced detection dependencies..."

# Install basic requirements
pip install -r requirements.txt

# Install additional computer vision libraries
echo "Installing additional computer vision libraries..."
pip install opencv-contrib-python

# Install Hugging Face transformers (optional)
echo "Installing Hugging Face transformers (this may take a while)..."
pip install transformers torch torchvision

# Install additional ML libraries
pip install scikit-learn matplotlib

echo "Installation complete!"
echo "Available detection methods:"
python3 -c "
from detection_models import EnhancedHandDetector
detector = EnhancedHandDetector()
print('Available methods:', detector.get_available_methods())
print('Detection info:', detector.get_detection_info())
"
