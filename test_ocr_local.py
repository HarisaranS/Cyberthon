import cv2
import numpy as np
import pytesseract
from PIL import Image

def test_contours(image_path):
    print("--- Local Enterprise OCR Engine Core ---")
    img = cv2.imread(image_path)
    
    # Resize for better Tesseract detection
    img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Isolate blue ink
    lower_blue = np.array([90, 40, 40])
    upper_blue = np.array([140, 255, 255])
    mask = cv2.inRange(hsv, lower_blue, upper_blue)
    
    # Connect handwriting strokes
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 3))
    connected = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    # Find contours
    cnts, _ = cv2.findContours(connected, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Sort contours left to right
    boundingBoxes = [cv2.boundingRect(c) for c in cnts]
    if not boundingBoxes:
        return ""
        
    (cnts, boundingBoxes) = zip(*sorted(zip(cnts, boundingBoxes), key=lambda b:b[1][0]))
    
    full_text = []
    
    for c in cnts:
        x, y, w, h = cv2.boundingRect(c)
        if w > 20 and h > 20: # Filter out tiny noise
            # Crop the original ink mask for just this digit group
            roi_mask = mask[y:y+h, x:x+w]
            
            # Pad it a bit
            roi_mask = cv2.copyMakeBorder(roi_mask, 10, 10, 10, 10, cv2.BORDER_CONSTANT, value=[0,0,0])
            
            roi_inv = 255 - roi_mask
            
            # OCR with psm 7 (single text line) or 8 (single word)
            text = pytesseract.image_to_string(Image.fromarray(roi_inv), config=r'--oem 3 --psm 8 -c tessedit_char_whitelist=0123456789')
            text = text.strip()
            if text:
                full_text.append(text)
                
    result = " ".join(full_text)
    print(f"Final Perfected Extraction: '{result}'")
    return result

test_contours("/home/saran/Desktop/temporary/img.jpeg")
