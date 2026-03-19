from .ml_engine_farmer import predict_farmer_models
from .ai_agent_farmer import farmer_ai_decision

def analyze_farm(data):
    """
    Combines ML predictions and AI decision logic into a single response.
    """
    # 1. Run ML predictions
    crop, price, risk, warehouse_score = predict_farmer_models(data)

    # 2. Run AI strategic decision logic
    decision = farmer_ai_decision(crop, price, risk, warehouse_score)

    # 3. Form final unified response as requested
    final = {
        "crop_prediction": crop,
        "price_prediction": price,
        "spoilage_risk": risk,
        "warehouse_score": warehouse_score,
        "priority": decision.get("priority", "P3"),
        "recommended_action": decision.get("recommended_action", "Maintain storage.")
    }

    return final