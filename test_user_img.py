import requests

image_path = "/home/saran/Desktop/temporary/img.jpeg"

try:
    with open(image_path, "rb") as f:
        response = requests.post(
            "http://localhost:8000/ocr",
            files={"file": ("img.jpeg", f, "image/jpeg")}
        )
    print("API Response:")
    print(response.json())
except Exception as e:
    print("Error:", e)
