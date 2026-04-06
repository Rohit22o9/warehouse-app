import joblib
import numpy as np
import os
import datetime

# --- Model Loading Configuration ---
# Models are expected in the 'Farmer_model' folder relative to the backend root.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_PATH = os.path.join(BASE_DIR, "Farmer_model")

def load_with_fallback(path):
    if os.path.exists(path):
        try:
            return joblib.load(path)
        except Exception as e:
            print(f"Error loading model at {path}: {e}")
            return None
    print(f"Warning: Model not found at {path}")
    return None

# Load models from corrected paths
crop_model = load_with_fallback(os.path.join(MODEL_PATH, "crop_model.pkl"))
crop_encoder = load_with_fallback(os.path.join(MODEL_PATH, "crop_encoder.pkl"))
price_model = load_with_fallback(os.path.join(MODEL_PATH, "price_model.pkl"))
warehouse_model = load_with_fallback(os.path.join(MODEL_PATH, "warehouse_model.pkl"))
spoilage_model = load_with_fallback(os.path.join(MODEL_PATH, "spoilage_model.pkl"))

def predict_farmer_models(data):
    """
    ML prediction engine. Uses pre-trained models to forecast crop, price, spoilage, and warehouse suitability.
    Requires environment and warehouse parameters, provides defaults if missing.
    """
    # 0. Preprocessing & Defaults
    now = datetime.datetime.now()
    
    # Environment (using provided data or sensible defaults)
    soil_ph = float(data.get("soil_ph", 6.5))
    moisture = float(data.get("moisture", 40.0))
    temperature = float(data.get("temperature", 25.0))
    rainfall = float(data.get("rainfall", 200.0))
    
    # Time context
    day = int(data.get("day", now.day))
    month = int(data.get("month", now.month))
    year = int(data.get("year", now.year))
    
    # Storage context
    storage_temp = float(data.get("storage_temp", temperature))
    humidity = float(data.get("humidity", 60.0))
    storage_days = int(data.get("days_in_storage", data.get("storage_days", 0)))
    distance = float(data.get("distance", 10.0))
    rating = float(data.get("rating", 4.5))
    
    # Warehouse context
    warehouse_price = float(data.get("warehouse_price", 2.0))
    vacancy = float(data.get("vacancy", 70.0))
    warehouse_temp = float(data.get("warehouse_temp", 20.0))
    warehouse_humidity = float(data.get("warehouse_humidity", 55.0))

    results = ["Unknown", 0.0, 0.0, 0.0]

    # 1. Crop recommendation (if model loaded)
    if crop_model and crop_encoder:
        try:
            crop_pred = crop_model.predict(np.array([[soil_ph, moisture, temperature, rainfall]]))
            results[0] = crop_encoder.inverse_transform(crop_pred)[0]
        except Exception:
            results[0] = str(data.get("produce", "Unknown"))

    # 2. Market price forecast (if model loaded)
    if price_model:
        try:
            price = price_model.predict(np.array([[day, month, year]]))
            results[1] = float(price[0])
        except Exception:
            results[1] = 0.0

    # 3. Spoilage risk (if model loaded)
    if spoilage_model:
        try:
            risk = spoilage_model.predict(np.array([[storage_temp, humidity, storage_days, distance, rating]]))
            results[2] = float(risk[0])
        except Exception:
            results[2] = 0.0

    # 4. Warehouse Match Score (if model loaded)
    if warehouse_model:
        try:
            score = warehouse_model.predict(np.array([[distance, warehouse_price, vacancy, warehouse_temp, warehouse_humidity]]))
            results[3] = float(score[0])
        except Exception:
            results[3] = 0.0

    return tuple(results)