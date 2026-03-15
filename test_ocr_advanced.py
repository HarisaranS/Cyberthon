import pytesseract
from PIL import Image, ImageEnhance
import cv2
import numpy as np

image_path = "/home/saran/Desktop/temporary/img.jpeg"

def test_ocr():
    print("Testing Tesseract directly on the raw image...")
    img = Image.open(image_path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    print("-- Raw Text (eng, default) --")
    print(repr(pytesseract.image_to_string(img, lang='eng')))

    print("-- Basic Contrast Enhancer --")
    enhancer = ImageEnhance.Contrast(img)
    img_contrast = enhancer.enhance(2.0)
    print(repr(pytesseract.image_to_string(img_contrast, lang='eng', config=r'--oem 3 --psm 6')))
    
    # Let's try advanced OpenCV preprocessing
    print("-- Advanced OpenCV Color Isolation (Blue Ink) --")
    cv_img = cv2.imread(image_path)
    
    # Resize the image to make it larger for Tesseract (handwriting is easier to read when upscaled)
    cv_img = cv2.resize(cv_img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    
    # Convert to HSV
    hsv = cv2.cvtColor(cv_img, cv2.COLOR_BGR2HSV)
    
    # Define range for blue color ink. Blue in OpenCV HSV is around H=100-130
    # The lines are gray, so their saturation will be low.
    # The ink is dark blue, so saturation is higher, value is low-ish.
    lower_blue = np.array([90, 40, 40])
    upper_blue = np.array([140, 255, 255])
    
    # Create mask
    mask = cv2.inRange(hsv, lower_blue, upper_blue)
    
    # Some morphological closing to connect gaps in handwriting
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    
    # Invert the mask: text should be black on white for pytesseract
    result = 255 - mask

    cv2.imwrite("debug_hsv.png", result)

    text = pytesseract.image_to_string(Image.fromarray(result), lang='eng', config=r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789\ ')
    print("Extracted (HSV):", repr(text))
    
    # Let's also try a more generic approach: pure adaptive thresholding without heavy morphological filters, but with upscaling
    print("-- Upscaled + Simple Thresholding --")
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    
    # 1. Blur to remove high frequency paper noise
    blur = cv2.GaussianBlur(gray, (5,5), 0)
    
    # 2. Adaptive threshold
    thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 51, 15)
    
    # 3. Invert back
    thresh_inv = 255 - thresh
    cv2.imwrite("debug_thresh.png", thresh_inv)
    
    text = pytesseract.image_to_string(Image.fromarray(thresh_inv), lang='eng', config=r'--oem 3 --psm 7 -c tessedit_char_whitelist=0123456789\ ')
    print("Extracted (Upscale+Thresh):", repr(text))

test_ocr()
