"""
FastAPI wrapper for existing HIV Prevention Backend
Does NOT modify existing backend files
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
import json
from typing import Dict, List, Any, Optional

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import your EXISTING backend
from backend.backend import HIVPreventionSystem

app = FastAPI(title="HIV Prevention API", version="1.0")

# CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize your existing backend ONCE
system = None

@app.on_event("startup")
def startup_event():
    """Initialize your existing backend system"""
    global system
    try:
        system = HIVPreventionSystem()
        print("✅ Backend system initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize backend: {e}")
        raise

# Pydantic models for request/response
class UserInput(BaseModel):
    """Matches your existing user_input format"""
    data: Dict[str, Any]
    preferred_language: Optional[str] = "en"
    preferred_culture: Optional[str] = "English-speaking"

class BatchInput(BaseModel):
    users: List[Dict[str, Any]]

# API Endpoints
@app.get("/")
def root():
    return {"status": "HIV Prevention API Running", "version": "1.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "backend_loaded": system is not None}

@app.get("/features")
def get_features():
    """Get all feature definitions (from your existing JSON)"""
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        json_path = os.path.join(base_dir, 'data', 'feature_dictionary.json')
        
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return {
            "feature_definitions": data["feature_definitions"],
            "categories": data.get("categories", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load features: {str(e)}")

@app.get("/schema")
def get_schema():
    """Builds the dynamic form for the React Native mobile app"""
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        json_path = os.path.join(base_dir, 'data', 'feature_dictionary.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load schema: {str(e)}")
    
@app.post("/assess")
def assess_risk(user_input: UserInput):
    """Single user assessment - using your existing backend.process_user()"""
    if not system:
        raise HTTPException(status_code=503, detail="Backend not initialized")
    
    try:
        # Prepare input for your existing backend
        input_data = user_input.data.copy()
        
        # Add language/culture if provided
        if user_input.preferred_language:
            input_data['preferred_language'] = user_input.preferred_language
        if user_input.preferred_culture:
            input_data['preferred_culture'] = user_input.preferred_culture
        
        # Call your EXISTING backend - NO CHANGES NEEDED
        result = system.process_user(input_data)
        
        return {
            "success": True,
            "result": result,
            "timestamp": result.get("timestamp")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")

@app.post("/assess/batch")
def assess_batch(batch_input: BatchInput):
    """Batch assessment - using your existing backend.batch_process()"""
    if not system:
        raise HTTPException(status_code=503, detail="Backend not initialized")
    
    try:
        # Call your EXISTING backend batch method
        result = system.batch_process(batch_input.users)
        
        return {
            "success": True,
            "result": result,
            "users_processed": len(batch_input.users)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch assessment failed: {str(e)}")

@app.get("/languages")
def get_supported_languages():
    """Get supported languages for cultural adaptation"""
    return {
        "languages": [
            {"code": "en", "name": "English", "culture": "English-speaking"},
            {"code": "si", "name": "Sinhala", "culture": "Sri Lankan"},
            {"code": "ta", "name": "Tamil", "culture": "Sri Lankan"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)