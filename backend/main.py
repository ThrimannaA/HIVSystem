# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel, Field
# import pickle
# import pandas as pd
# import numpy as np
# from typing import Dict, List
# import uvicorn

# # Initialize FastAPI app
# app = FastAPI(
#     title="HIV TDF Resistance Prediction API",
#     description="API for predicting TDF resistance and recommending treatment",
#     version="1.0.0"
# )

# # Add CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Load the trained model
# try:
#     with open('../models/hiv_tdf_resistance_model.pkl', 'rb') as file:
#         model_package = pickle.load(file)
    
#     best_model = model_package['best_model']
#     preprocessor = model_package['preprocessor']
#     scaler = model_package['scaler']
#     label_encoder = model_package['label_encoder']
#     feature_columns = model_package['feature_columns']
    
#     print("✅ Model loaded successfully!")
# except Exception as e:
#     print(f"❌ Error loading model: {e}")
#     raise

# # Define input schema
# class PatientData(BaseModel):
#     SEX: int = Field(..., description="Gender (0=Female, 1=Male)", ge=0, le=1)
#     YEAR: int = Field(..., description="Age in years", ge=0, le=120)
#     Ethnicity: int = Field(..., description="Ethnicity code", ge=0)
#     Education: int = Field(..., description="Education level code", ge=0)
#     Occupation: int = Field(..., description="Occupation code", ge=0)
#     Marital_status: int = Field(..., description="Marital status code (use underscore)", ge=0)
#     Transmission_category: int = Field(..., description="Transmission category code (use underscore)", ge=0)
#     Baseline_CD4: float = Field(..., description="Baseline CD4+ T-cell count (cells/μL)", ge=0)
#     Baseline_VL: float = Field(..., description="Baseline HIV Viral Load (copies/mL)", ge=0)
#     ART_duration: float = Field(..., description="ART duration in months", ge=0)
#     HIV_1YX: str = Field(..., description="HIV-1 subtype (e.g., 'CRF07_BC', 'CRF01_AE')")
#     Initial_ART_regimen: str = Field(..., description="Initial ART regimen (e.g., '2NRTIs+NNRTIs')")
#     PI_MU_Count: int = Field(..., description="PI mutation count", ge=0)
#     NRTI_MU_Count: int = Field(..., description="NRTI mutation count", ge=0)
#     NNRTI_MU_Count: int = Field(..., description="NNRTI mutation count", ge=0)

#     class Config:
#         json_schema_extra = {
#             "example": {
#                 "SEX": 1,
#                 "YEAR": 45,
#                 "Ethnicity": 1,
#                 "Education": 3,
#                 "Occupation": 4,
#                 "Marital_status": 2,
#                 "Transmission_category": 3,
#                 "Baseline_CD4": 120.0,
#                 "Baseline_VL": 100000.0,
#                 "ART_duration": 36.0,
#                 "HIV_1YX": "CRF07_BC",
#                 "Initial_ART_regimen": "2NRTIs+NNRTIs",
#                 "PI_MU_Count": 0,
#                 "NRTI_MU_Count": 2,
#                 "NNRTI_MU_Count": 1
#             }
#         }

# # Define output schema
# class PredictionResponse(BaseModel):
#     predicted_resistance_level: str
#     probability_susceptible: float
#     all_probabilities: Dict[str, float]
#     recommendation: str
#     explanation: str
#     risk_category: str
#     total_mutations: int

# def optimize_treatment(patient_dict: dict, threshold_S: float = 0.8):
#     """
#     Make prediction and generate treatment recommendation
#     """
#     try:
#         # Convert input to match training feature names
#         patient_features = {
#             'SEX': patient_dict['SEX'],
#             'YEAR': patient_dict['YEAR'],
#             'Ethnicity': patient_dict['Ethnicity'],
#             'Education': patient_dict['Education'],
#             'Occupation': patient_dict['Occupation'],
#             'Marital status': patient_dict['Marital_status'],  # Note: space not underscore
#             'Transmission category': patient_dict['Transmission_category'],  # Note: space
#             'Baseline CD4+T-cell count(cells/μL)': patient_dict['Baseline_CD4'],
#             'log_VL': np.log1p(patient_dict['Baseline_VL']),  # Log transform
#             'ART duration': patient_dict['ART_duration'],
#             'HIV-1YX': patient_dict['HIV_1YX'],
#             'Initial ART regimen': patient_dict['Initial_ART_regimen'],
#             'PI_MU_Count': patient_dict['PI_MU_Count'],
#             'NRTI_MU_Count': patient_dict['NRTI_MU_Count'],
#             'NNRTI_MU_Count': patient_dict['NNRTI_MU_Count']
#         }
        
#         # Create DataFrame
#         patient_df = pd.DataFrame(patient_features, index=[0])
        
#         # Preprocess
#         patient_processed = preprocessor.transform(patient_df)
#         patient_scaled = scaler.transform(patient_processed)
        
#         # Predict
#         probs = best_model.predict_proba(patient_scaled)[0]
#         pred_class = np.argmax(probs)
#         pred_label = label_encoder.inverse_transform([pred_class])[0]
        
#         # Get probability for each class
#         prob_dict = {
#             label: float(prob) 
#             for label, prob in zip(label_encoder.classes_, probs)
#         }
        
#         prob_S = prob_dict.get('S', 0)
        
#         # Calculate total mutations
#         total_mutations = (patient_dict['PI_MU_Count'] + 
#                           patient_dict['NRTI_MU_Count'] + 
#                           patient_dict['NNRTI_MU_Count'])
        
#         # Determine risk category and recommendation
#         if pred_label in ['S', 'L', 'P'] or prob_S >= threshold_S:
#             recommendation = "CONTINUE CURRENT ART"
#             explanation = f"Low resistance risk ({prob_S:.1%} susceptible). Current treatment is likely effective."
#             risk_category = "LOW"
#         elif pred_label == 'I':
#             recommendation = "MONITOR CLOSELY"
#             explanation = f"Intermediate resistance detected ({probs[pred_class]:.1%}). Continue current regimen but monitor viral load regularly."
#             risk_category = "MODERATE"
#         else:  # High resistance
#             recommendation = "CHANGE ART REGIMEN"
#             explanation = f"High resistance risk (predicted {pred_label}, {probs[pred_class]:.1%}). Consider switching to alternatives such as zidovudine, abacavir, or dolutegravir-based regimens."
#             risk_category = "HIGH"
        
#         return {
#             'predicted_resistance_level': pred_label,
#             'probability_susceptible': prob_S,
#             'all_probabilities': prob_dict,
#             'recommendation': recommendation,
#             'explanation': explanation,
#             'risk_category': risk_category,
#             'total_mutations': total_mutations
#         }
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# # API Endpoints

# @app.get("/")
# def read_root():
#     """
#     Root endpoint - API information
#     """
#     return {
#         "message": "HIV TDF Resistance Prediction API",
#         "version": "1.0.0",
#         "endpoints": {
#             "/predict": "POST - Make prediction",
#             "/health": "GET - Health check",
#             "/model-info": "GET - Model information"
#         }
#     }

# @app.get("/health")
# def health_check():
#     """
#     Health check endpoint
#     """
#     return {
#         "status": "healthy",
#         "model_loaded": best_model is not None
#     }

# @app.get("/model-info")
# def get_model_info():
#     """
#     Get model information
#     """
#     return {
#         "model_type": model_package.get('best_model_name', 'Random Forest'),
#         "resistance_classes": list(label_encoder.classes_),
#         "features_count": len(feature_columns),
#         "features": feature_columns,
#         "performance": model_package.get('performance', {})
#     }

# @app.post("/predict", response_model=PredictionResponse)
# def predict(patient: PatientData):
#     """
#     Make TDF resistance prediction
    
#     - **Input**: Patient clinical and demographic data
#     - **Output**: Resistance prediction, probabilities, and treatment recommendation
#     """
#     try:
#         # Convert Pydantic model to dict
#         patient_dict = patient.dict()
        
#         # Get prediction
#         result = optimize_treatment(patient_dict)
        
#         return result
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # Batch prediction endpoint
# @app.post("/predict-batch")
# def predict_batch(patients: List[PatientData]):
#     """
#     Make predictions for multiple patients
#     """
#     try:
#         results = []
#         for patient in patients:
#             patient_dict = patient.dict()
#             result = optimize_treatment(patient_dict)
#             results.append(result)
        
#         return {
#             "predictions": results,
#             "count": len(results)
#         }
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# # Run the application
# if __name__ == "__main__":
#     uvicorn.run(app, host="0.0.0.0", port=8000)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import pickle
import pandas as pd
import numpy as np
import uvicorn
import traceback

# Import Firebase service
try:
    from firebase_service import firebase_service
    FIREBASE_ENABLED = True
    print("✅ Firebase service imported successfully")
except ImportError as e:
    print(f"⚠️ Firebase not available: {e}")
    FIREBASE_ENABLED = False

# Initialize FastAPI app
app = FastAPI(
    title="HIV Care Optimizer API",
    description="AI-powered HIV treatment resistance prediction with Firebase integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
try:
    print("🔄 Loading ML model...")
    with open('../models/hiv_tdf_resistance_model.pkl', 'rb') as file:
        model_package = pickle.load(file)
    
    best_model = model_package['best_model']
    preprocessor = model_package['preprocessor']
    scaler = model_package['scaler']
    label_encoder = model_package['label_encoder']
    feature_columns = model_package['feature_columns']
    
    print("✅ Model loaded successfully!")
    print(f"📊 Model type: {model_package.get('best_model_name', 'Unknown')}")
    print(f"🎯 Resistance classes: {label_encoder.classes_}")
    
except FileNotFoundError:
    print("❌ Model file not found at '../models/hiv_tdf_resistance_model.pkl'")
    print("⚠️ Make sure the model file exists in the 'models' folder")
    raise
except Exception as e:
    print(f"❌ Error loading model: {e}")
    raise

# Define input schema
class PatientData(BaseModel):
    SEX: int = Field(..., description="Gender (0=Female, 1=Male)", ge=0, le=1)
    YEAR: int = Field(..., description="Age in years", ge=0, le=120)
    Ethnicity: int = Field(..., description="Ethnicity code", ge=0)
    Education: int = Field(..., description="Education level code", ge=0)
    Occupation: int = Field(..., description="Occupation code", ge=0)
    Marital_status: int = Field(..., description="Marital status code", ge=0)
    Transmission_category: int = Field(..., description="Transmission category code", ge=0)
    Baseline_CD4: float = Field(..., description="Baseline CD4+ T-cell count (cells/μL)", ge=0)
    Baseline_VL: float = Field(..., description="Baseline HIV Viral Load (copies/mL)", ge=0)
    ART_duration: float = Field(..., description="ART duration in months", ge=0)
    HIV_1YX: str = Field(..., description="HIV-1 subtype (e.g., 'CRF07_BC', 'CRF01_AE')")
    Initial_ART_regimen: str = Field(..., description="Initial ART regimen (e.g., '2NRTIs+NNRTIs')")
    PI_MU_Count: int = Field(..., description="PI mutation count", ge=0)
    NRTI_MU_Count: int = Field(..., description="NRTI mutation count", ge=0)
    NNRTI_MU_Count: int = Field(..., description="NNRTI mutation count", ge=0)
    
    # Additional optional fields for Firebase
    patientId: Optional[str] = Field(default="UNKNOWN", description="Patient ID")
    testDate: Optional[str] = Field(default=None, description="Test date")

    class Config:
        json_schema_extra = {
            "example": {
                "SEX": 1,
                "YEAR": 45,
                "Ethnicity": 1,
                "Education": 3,
                "Occupation": 4,
                "Marital_status": 2,
                "Transmission_category": 3,
                "Baseline_CD4": 120.0,
                "Baseline_VL": 100000.0,
                "ART_duration": 36.0,
                "HIV_1YX": "CRF07_BC",
                "Initial_ART_regimen": "2NRTIs+NNRTIs",
                "PI_MU_Count": 0,
                "NRTI_MU_Count": 2,
                "NNRTI_MU_Count": 1,
                "patientId": "P12345"
            }
        }

# Define output schema
class PredictionResponse(BaseModel):
    predicted_resistance_level: str
    probability_susceptible: float
    all_probabilities: Dict[str, float]
    recommendation: str
    explanation: str
    risk_category: str
    total_mutations: int
    firebase_doc_id: Optional[str] = None

def optimize_treatment(patient_dict: dict, threshold_S: float = 0.8):
    """
    Make prediction using trained ML model
    """
    try:
        # Convert input to match training feature names
        patient_features = {
            'SEX': patient_dict['SEX'],
            'YEAR': patient_dict['YEAR'],
            'Ethnicity': patient_dict['Ethnicity'],
            'Education': patient_dict['Education'],
            'Occupation': patient_dict['Occupation'],
            'Marital status': patient_dict['Marital_status'],  # Note: space not underscore
            'Transmission category': patient_dict['Transmission_category'],  # Note: space
            'Baseline CD4+T-cell count(cells/μL)': patient_dict['Baseline_CD4'],
            'log_VL': np.log1p(patient_dict['Baseline_VL']),  # Log transform
            'ART duration': patient_dict['ART_duration'],
            'HIV-1YX': patient_dict['HIV_1YX'],
            'Initial ART regimen': patient_dict['Initial_ART_regimen'],
            'PI_MU_Count': patient_dict['PI_MU_Count'],
            'NRTI_MU_Count': patient_dict['NRTI_MU_Count'],
            'NNRTI_MU_Count': patient_dict['NNRTI_MU_Count']
        }
        
        print(f"🔬 Processing prediction for patient: {patient_dict.get('patientId', 'Unknown')}")
        
        # Create DataFrame
        patient_df = pd.DataFrame(patient_features, index=[0])
        
        # Preprocess
        patient_processed = preprocessor.transform(patient_df)
        patient_scaled = scaler.transform(patient_processed)
        
        # Predict
        probs = best_model.predict_proba(patient_scaled)[0]
        pred_class = np.argmax(probs)
        pred_label = label_encoder.inverse_transform([pred_class])[0]
        
        print(f"🎯 Prediction: {pred_label} (confidence: {probs[pred_class]:.1%})")
        
        # Get probability for each class
        prob_dict = {
            label: float(prob) 
            for label, prob in zip(label_encoder.classes_, probs)
        }
        
        prob_S = prob_dict.get('S', 0)
        
        # Calculate total mutations
        total_mutations = (patient_dict['PI_MU_Count'] + 
                          patient_dict['NRTI_MU_Count'] + 
                          patient_dict['NNRTI_MU_Count'])
        
        # Determine risk category and recommendation
        if pred_label in ['S', 'L', 'P'] or prob_S >= threshold_S:
            recommendation = "CONTINUE CURRENT ART"
            explanation = f"Low resistance risk detected. Model predicts '{pred_label}' with {prob_S:.1%} probability of susceptibility. Current treatment is likely effective."
            risk_category = "LOW"
        elif pred_label == 'I':
            recommendation = "MONITOR CLOSELY"
            explanation = f"Intermediate resistance detected. Model predicts '{pred_label}' with {probs[pred_class]:.1%} confidence. Continue current regimen but monitor viral load regularly every 3-6 months."
            risk_category = "MODERATE"
        else:  # High resistance
            recommendation = "CONSIDER TREATMENT MODIFICATION"
            explanation = f"High resistance risk detected. Model predicts '{pred_label}' with {probs[pred_class]:.1%} confidence. Consider switching to alternative regimens such as zidovudine, abacavir, or dolutegravir-based combinations."
            risk_category = "HIGH"
        
        return {
            'predicted_resistance_level': pred_label,
            'probability_susceptible': prob_S,
            'all_probabilities': prob_dict,
            'recommendation': recommendation,
            'explanation': explanation,
            'risk_category': risk_category,
            'total_mutations': total_mutations
        }
        
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# API Endpoints

@app.get("/")
def read_root():
    """Root endpoint - API information"""
    return {
        "message": "HIV Care Optimizer API",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": best_model is not None,
        "firebase_enabled": FIREBASE_ENABLED,
        "endpoints": {
            "/predict": "POST - Make prediction (saves to Firebase)",
            "/predict-batch": "POST - Batch predictions",
            "/predictions/{id}": "GET - Get prediction by ID",
            "/patient/{id}/predictions": "GET - Get patient history",
            "/predictions": "GET - Get all predictions",
            "/health": "GET - Health check",
            "/model-info": "GET - Model information"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": best_model is not None,
        "firebase_enabled": FIREBASE_ENABLED
    }

@app.get("/model-info")
def get_model_info():
    """Get model information"""
    return {
        "model_type": model_package.get('best_model_name', 'Random Forest'),
        "resistance_classes": list(label_encoder.classes_),
        "features_count": len(feature_columns),
        "features": feature_columns,
        "performance": model_package.get('performance', {})
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(patient: PatientData):
    """
    Make TDF resistance prediction and save to Firebase
    
    - **Input**: Patient clinical and demographic data
    - **Output**: Resistance prediction, probabilities, and treatment recommendation
    - **Firebase**: Saves both input and output data
    """
    try:
        print("\n" + "="*60)
        print("📥 NEW PREDICTION REQUEST")
        print("="*60)
        
        # Convert Pydantic model to dict
        patient_dict = patient.dict()
        
        # Get prediction from ML model
        print("🤖 Running ML model...")
        result = optimize_treatment(patient_dict)
        
        # Prepare patient data for Firebase
        patient_data = {
            'patientId': patient_dict.get('patientId', 'UNKNOWN'),
            'age': patient_dict.get('YEAR'),
            'sex': 'Male' if patient_dict.get('SEX') == 1 else 'Female',
            'ethnicity': patient_dict.get('Ethnicity'),
            'education': patient_dict.get('Education'),
            'maritalStatus': patient_dict.get('Marital_status'),
            'hivSubtype': patient_dict.get('HIV_1YX'),
            'artRegimen': patient_dict.get('Initial_ART_regimen'),
            'artDuration': patient_dict.get('ART_duration'),
            'viralLoad': patient_dict.get('Baseline_VL'),
            'cd4Count': patient_dict.get('Baseline_CD4'),
            'PI_MU_Count': patient_dict.get('PI_MU_Count'),
            'NRTI_MU_Count': patient_dict.get('NRTI_MU_Count'),
            'NNRTI_MU_Count': patient_dict.get('NNRTI_MU_Count'),
            'testDate': patient_dict.get('testDate', None)
        }
        
        # Save to Firebase
        if FIREBASE_ENABLED:
            try:
                print("💾 Saving to Firebase...")
                doc_id = firebase_service.save_prediction(
                    patient_data=patient_data,
                    model_input=patient_dict,  # Save original input
                    model_output=result         # Save prediction output
                )
                result['firebase_doc_id'] = doc_id
                print(f"✅ Data saved to Firebase with ID: {doc_id}")
            except Exception as firebase_error:
                print(f"⚠️ Firebase save failed: {str(firebase_error)}")
                print(traceback.format_exc())
                # Continue anyway - don't fail the prediction
        else:
            print("⚠️ Firebase not enabled - skipping save")
        
        print("="*60 + "\n")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in prediction endpoint: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-batch")
def predict_batch(patients: List[PatientData]):
    """
    Make predictions for multiple patients
    Each prediction is saved to Firebase individually
    """
    try:
        print(f"\n📦 Batch prediction request for {len(patients)} patients")
        results = []
        
        for i, patient in enumerate(patients, 1):
            print(f"\n--- Processing patient {i}/{len(patients)} ---")
            patient_dict = patient.dict()
            
            # Get prediction
            result = optimize_treatment(patient_dict)
            
            # Save to Firebase if enabled
            if FIREBASE_ENABLED:
                try:
                    patient_data = {
                        'patientId': patient_dict.get('patientId', f'BATCH_{i}'),
                        'age': patient_dict.get('YEAR'),
                        'sex': 'Male' if patient_dict.get('SEX') == 1 else 'Female',
                        'ethnicity': patient_dict.get('Ethnicity'),
                        'education': patient_dict.get('Education'),
                        'maritalStatus': patient_dict.get('Marital_status'),
                        'hivSubtype': patient_dict.get('HIV_1YX'),
                        'artRegimen': patient_dict.get('Initial_ART_regimen'),
                        'artDuration': patient_dict.get('ART_duration'),
                        'viralLoad': patient_dict.get('Baseline_VL'),
                        'cd4Count': patient_dict.get('Baseline_CD4'),
                        'PI_MU_Count': patient_dict.get('PI_MU_Count'),
                        'NRTI_MU_Count': patient_dict.get('NRTI_MU_Count'),
                        'NNRTI_MU_Count': patient_dict.get('NNRTI_MU_Count')
                    }
                    
                    doc_id = firebase_service.save_prediction(
                        patient_data=patient_data,
                        model_input=patient_dict,
                        model_output=result
                    )
                    result['firebase_doc_id'] = doc_id
                except Exception as e:
                    print(f"⚠️ Firebase save failed for patient {i}: {e}")
            
            results.append(result)
        
        print(f"\n✅ Batch prediction complete: {len(results)} predictions")
        return {
            "predictions": results,
            "count": len(results)
        }
        
    except Exception as e:
        print(f"❌ Batch prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Firebase data retrieval endpoints
@app.get("/predictions/{prediction_id}")
def get_prediction(prediction_id: str):
    """Get a specific prediction by ID from Firebase"""
    if not FIREBASE_ENABLED:
        raise HTTPException(status_code=503, detail="Firebase not enabled")
    
    try:
        prediction = firebase_service.get_prediction(prediction_id)
        if prediction:
            return prediction
        raise HTTPException(status_code=404, detail="Prediction not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patient/{patient_id}/predictions")
def get_patient_history(patient_id: str, limit: int = 10):
    """Get all predictions for a specific patient from Firebase"""
    if not FIREBASE_ENABLED:
        raise HTTPException(status_code=503, detail="Firebase not enabled")
    
    try:
        predictions = firebase_service.get_patient_predictions(patient_id, limit)
        return {
            "patient_id": patient_id,
            "predictions": predictions,
            "count": len(predictions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions")
def get_all_predictions(limit: int = 50):
    """Get recent predictions from Firebase"""
    if not FIREBASE_ENABLED:
        raise HTTPException(status_code=503, detail="Firebase not enabled")
    
    try:
        predictions = firebase_service.get_all_predictions(limit)
        return {
            "predictions": predictions,
            "count": len(predictions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run the application
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 STARTING HIV CARE OPTIMIZER API")
    print("="*60)
    print(f"✅ Model: Loaded")
    print(f"{'✅' if FIREBASE_ENABLED else '⚠️'} Firebase: {'Enabled' if FIREBASE_ENABLED else 'Disabled'}")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)