from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from farmer_ai_api import router as farmer_router

# Create FastAPI app
app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register AI router
app.include_router(farmer_router)

@app.get("/")
def home():
    return {"message": "AgriFresh AI Backend Running"}