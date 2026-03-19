import sys
import os

# Add current dir to sys.path
sys.path.append(os.getcwd())

from ai.farmer_ai.farmer_pipeline import analyze_farm

data = {
"temperature": 28,
"humidity": 65,
"days_in_storage": 5,
"produce": "Tomato",
"location": "Nashik"
}

try:
    result = analyze_farm(data)
    print(f"Result: {result}")
except Exception as e:
    import traceback
    traceback.print_exc()
