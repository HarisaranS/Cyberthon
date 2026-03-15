import cv2
import numpy as np
import pytesseract
from PIL import Image
import sys

def preprocess_and_ocr(image_path):
    # 1. Read image
    img = cv2.imread(image_path)
    if img is None:
        print(f"Failed to load image at {image_path}")
        return

    # 2. Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 3. Apply adaptive thresholding to aggressively separate ink from paper
    # We use a large block size to account for varying lighting
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 51, 15
    )

    # 4. Morphological operations to remove horizontal lines
    # Create a horizontal kernel
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
    
    # Detect horizontal lines
    detect_horizontal = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    
    # Subtract lines from the thresholded image
    thresh = cv2.subtract(thresh, detect_horizontal)

    # 5. Clean up remaining noise (small dots)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)

    # 6. Dilate slightly to reconnect any breaks in the digits caused by line removal
    dilated = cv2.dilate(cleaned, kernel, iterations=1)

    # 7. Invert back to black text on white background for Tesseract
    result_img = cv2.bitwise_not(dilated)

    # Save to disk for debugging
    cv2.imwrite("debug_preprocessed.png", result_img)
    print("Saved preprocessed image to debug_preprocessed.png")

    # 8. Run OCR
    # psm 6 assumes a single uniform block of text
    # oem 3 uses the default (LSTM) engine
    # whitelist heavily biases towards digits and spaces
    custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789\ '
    
    # Convert OpenCV image (NumPy array) to PIL Image for pytesseract
    pil_img = Image.fromarray(result_img)
    
    text = pytesseract.image_to_string(pil_img, lang='eng', config=custom_config)
    print(f"Extracted Text: '{text.strip()}'")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        preprocess_and_ocr(sys.argv[1])
    else:
        print("Please provide an image path.")
