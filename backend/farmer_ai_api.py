from fastapi import APIRouter, HTTPException
from ai.farmer_ai.farmer_pipeline import analyze_farm
import traceback

router = APIRouter()

@router.post("/farmer/analyze")
def farmer_ai(data: dict):
    print(f"API CALL RECEIVED: /farmer/analyze with data: {data}")
    try:
        result = analyze_farm(data)
        print(f"API ANALYSIS COMPLETE: {result}")
        return result
    except Exception as e:
        print(f"API ERROR: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")