"""
FastAPI wrapper for existing HIV Prevention Backend
Does NOT backend files - APi endpoints for connecting with Firebase database
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os
import json
from typing import Dict, List, Any, Optional
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# 1. Initialize Firebase (Ensure serviceAccountKey.json is in your api folder)
# You get this file from Firebase Console > Project Settings > Service Accounts
cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), "serviceAccountKey.json"))
firebase_admin.initialize_app(cred)
db = firestore.client()

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
# Add this endpoint to your api.py
@app.post("/login")
def login_user(payload: dict):
    try:
        p_id = payload.get("patient_id") # e.g., research_user_001
        code = payload.get("access_code") # e.g., 1234
        
        # Pulls the document from /users/research_user_001
        user_ref = db.collection("users").document(p_id).get()
        
        if not user_ref.exists:
            raise HTTPException(
                status_code=404, 
                detail="Invalid Patient ID. Please check your credentials or contact the clinical administrator."
            )
                    
        user_data = user_ref.to_dict()
        
        # Check if code matches
        if str(user_data.get("access_code")) == str(code):
            return {
                "success": True,
                "name": user_data.get("name"),
                "patient_id": p_id
            }
        else:
            raise HTTPException(
                status_code=401, 
                detail="The Access Code entered is incorrect. Please try again."
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal server error occurred. Please try again later.")
    
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
    if not system:
        raise HTTPException(status_code=503, detail="Backend not initialized")
    try:
        input_data = user_input.data.copy()
        # Ensure your backend receives clean data
        result = system.process_user(input_data)
        
        # Log the result to your terminal so you can see the structure
        print(f"DEBUG: Backend Result: {result}") 

        return {
            "success": True,
            "result": result
        }
    except Exception as e:
        print(f"ERROR in /assess: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

# @app.post("/save_assessment")
# def save_assessment(payload: dict):
#     try:
#         user_id = payload.get("user_id")
#         # We take the text level (e.g., "Low Risk")
#         level_text = payload.get("level", "Low Risk")
        
#         # Clean the string for the mapping
#         clean_level = level_text.replace(" Risk", "")
        
#         stage_map = {
#             "Low": 1,
#             "Moderate": 2,
#             "High": 3,
#             "Very High": 4
#         }
#         numeric_score = stage_map.get(clean_level, 1)

#         doc_ref = db.collection("users").document(user_id).collection("history").document()
#         doc_ref.set({
#             "score": numeric_score, # This fixes your 400-scale issue
#             "risk_level": level_text,
#             "date": datetime.now().isoformat().split('T')[0], # Adds the date for RiskTrendScreen
#             "timestamp": datetime.now(),
#         })
#         return {"success": True}
#     except Exception as e:
#         print(f"ERROR in /save_assessment: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))
@app.post("/save_assessment")
def save_assessment(payload: dict):
    try:
        user_id = payload.get("user_id")
        full_result = payload.get("full_result")
        form_data = payload.get("form_data")
        
        if not full_result:
            raise HTTPException(status_code=400, detail="Missing data")

        # 1. Map Numeric Score for the Trend Chart
        level_text = full_result["risk_prediction"]["risk_level"]
        clean_level = level_text.replace(" Risk", "")
        stage_map = {"Low": 1, "Moderate": 2, "High": 3, "Very High": 4}
        numeric_score = stage_map.get(clean_level, 1)

        # 2. Reference the 'history' subcollection
        doc_ref = db.collection("users").document(user_id).collection("history").document()
        
        # 3. Create a clean dictionary (This prevents "Snapshot" views)
        clinical_record = {
            "metadata": {
                "timestamp": datetime.now(),
                "date_string": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "app_version": "1.0"
            },
            "summary": {
                "score": numeric_score,
                "risk_level": level_text,
                "analysis_strength": full_result["risk_prediction"].get("confidence_percentage", "Standard"),
            },
            "clinical_details": {
                "top_risk_factors": full_result["risk_prediction"]["personalized_factors"],
                "intervention_plan": full_result["intervention_plan"]["personalized_plan"],
                "plan_rationale": full_result["intervention_plan"]["plan_summary"],
                "expected_outcomes": full_result["intervention_plan"]["expected_outcomes"]
            },
            "raw_input_data": form_data  # Saves the actual questions/answers
        }

        # 4. Save to Firestore
        doc_ref.set(clinical_record)
        
        return {"success": True, "assessment_id": doc_ref.id}
    except Exception as e:
        print(f"Firestore Save Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
@app.get("/history/{user_id}")
def get_history(user_id: str):
    """Retrieves all past scores for the line chart"""
    try:
        docs = db.collection("users").document(user_id).collection("history")\
                 .order_by("timestamp", direction=firestore.Query.ASCENDING).stream()
        
        history = []
        for doc in docs:
            data = doc.to_dict()
            history.append({
                "value": data["score"],
                "label": data["timestamp"].strftime("%b %d"), # Format: Dec 30
            })
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import HTTPException

@app.patch("/update_profile/{user_id}/")
async def update_profile(user_id: str, payload: dict):
    try:
        # 1. Reference the specific user document
        user_ref = db.collection("users").document(user_id)
        
        # 2. Build the update dictionary dynamically
        update_data = {}
        
        # If 'name' was sent in the request, add it to update_data
        if "name" in payload and payload["name"]:
            update_data["name"] = payload["name"]
            
        # If 'access_code' was sent in the request, add it to update_data
        if "access_code" in payload and payload["access_code"]:
            update_data["access_code"] = payload["access_code"]

        # 3. If no data was provided, return an error
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid data provided to update")

        # 4. Perform the update in Firestore
        user_ref.update(update_data)
        
        return {
            "success": True, 
            "message": f"Updated fields: {list(update_data.keys())}"
        }
        
    except Exception as e:
        print(f"Update Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)