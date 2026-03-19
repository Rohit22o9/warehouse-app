import requests
import json

url = "http://127.0.0.1:8000/farmer/analyze"
payload = {
    "temperature": 28,
    "humidity": 65,
    "days_in_storage": 5,
    "produce": "Tomato",
    "location": "Nashik"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
