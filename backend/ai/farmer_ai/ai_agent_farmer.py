import os
import json
import re
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=HF_TOKEN
)

def extract_json(text):
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except:
            return None
    return None

def farmer_ai_decision(crop, price, risk, warehouse_score):
    """
    AI decision logic using HuggingFace Llama 3 for strategic farmer recommendations.
    """
    prompt = f"""
You are an AI farming advisor for AgriFresh. 

ML Predictions for this batch:
- Crop Prediction: {crop}
- Market Price Forecast: {price}
- Spoilage Risk (0-1): {risk}
- Warehouse Match Score (0-1): {warehouse_score}

Return a JSON object in this format:
{{
 "priority": "P1/P2/P3 based on urgency",
 "recommended_action": "Short strategic recommendation (e.g. Move to cold storage, Sell immediately to local market, Wait for better price)"
}}

Return ONLY the raw JSON.
"""

    try:
        response = client.chat_completion(
            messages=[
                {"role": "system", "content": "Return JSON only"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=200
        )
        raw_output = response.choices[0].message.content
        parsed = extract_json(raw_output)
        if parsed and "priority" in parsed and "recommended_action" in parsed:
            return parsed
        
        # Fallback logic if AI fails
        priority = "P3"
        action = "Maintain storage and monitor."
        if risk > 0.6 or warehouse_score < 0.4:
            priority = "P1"
            action = "Urgent: Move to alternative warehouse or sell immediately."
        elif risk > 0.3:
            priority = "P2"
            action = "Monitor condition and consider early sale."
            
        return {
            "priority": priority,
            "recommended_action": action
        }
    except Exception as e:
        return {
            "priority": "P3",
            "recommended_action": "Regular monitoring. AI Service unavailable."
        }