import os
import json
import re
from dotenv import load_dotenv
from huggingface_hub import InferenceClient


# Load environment variables
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

if HF_TOKEN is None:
    raise ValueError("HF_TOKEN not found in environment variables.")

# Initialize HuggingFace client
client = InferenceClient(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    token=HF_TOKEN
)

def extract_json(text):
    """
    Extract valid JSON from model output.
    """
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            return None
    return None

def ai_decision_from_ml(risk, remaining_days, produce):

    prompt = f"""
You are an Agricultural Warehouse Optimization AI.

ML Predictions:
- Produce: {produce}
- Spoilage Risk: {risk}
- Remaining Days: {remaining_days}

Decision Rules:
- High risk OR remaining_days <= 2 → Priority P1
- Medium risk OR remaining_days <= 5 → Priority P2
- Otherwise → Priority P3

Return ONLY valid JSON in this format:

{{
  "priority": "P1 | P2 | P3",
  "recommended_action": "short action sentence",
  "confidence": number between 0 and 1
}}

Do NOT include explanation.
Do NOT use markdown.
Return only raw JSON.
"""

    try:
        response = client.chat_completion(
            messages=[
                {"role": "system", "content": "Return raw JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,   # even more deterministic
            max_tokens=200
        )

        raw_output = response.choices[0].message.content
        parsed = extract_json(raw_output)

        if parsed is None:
            return {
                "priority": "Unknown",
                "recommended_action": "Model returned invalid response",
                "confidence": 0.0
            }

        return parsed

    except Exception as e:
        return {
            "priority": "Error",
            "recommended_action": str(e),
            "confidence": 0.0
        }
