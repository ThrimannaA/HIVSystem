# from firebase_config import db
# from datetime import datetime
# from typing import Dict, Any, Optional
# import uuid

# class FirebaseService:
#     def __init__(self):
#         self.db = db
#         self.predictions_collection = 'predictions'
#         self.patients_collection = 'patients'
    
#     def save_prediction(self, patient_data: Dict[str, Any], 
#                        model_input: Dict[str, Any], 
#                        model_output: Dict[str, Any]) -> str:
#         """
#         Save prediction data to Firebase
        
#         Args:
#             patient_data: Patient information
#             model_input: Data sent to ML model
#             model_output: Prediction results from model
            
#         Returns:
#             Document ID of saved prediction
#         """
#         try:
#             # Generate unique ID
#             doc_id = str(uuid.uuid4())
            
#             # Prepare document data
#             prediction_doc = {
#                 'prediction_id': doc_id,
#                 'patient_id': patient_data.get('patientId'),
#                 'timestamp': datetime.utcnow(),
                
#                 # Patient Information
#                 'patient_info': {
#                     'patient_id': patient_data.get('patientId'),
#                     'age': patient_data.get('age'),
#                     'sex': patient_data.get('sex'),
#                     'ethnicity': patient_data.get('ethnicity'),
#                     'education': patient_data.get('education'),
#                     'marital_status': patient_data.get('maritalStatus'),
#                     'hiv_subtype': patient_data.get('hivSubtype'),
#                     'art_regimen': patient_data.get('artRegimen'),
#                     'art_duration': patient_data.get('artDuration')
#                 },
                
#                 # Clinical Data
#                 'clinical_data': {
#                     'viral_load': patient_data.get('viralLoad'),
#                     'cd4_count': patient_data.get('cd4Count'),
#                     'test_date': patient_data.get('testDate')
#                 },
                
#                 # Mutation Data
#                 'mutations': {
#                     'PI_MU_Count': patient_data.get('PI_MU_Count', 0),
#                     'NRTI_MU_Count': patient_data.get('NRTI_MU_Count', 0),
#                     'NNRTI_MU_Count': patient_data.get('NNRTI_MU_Count', 0),
#                     'total_mutations': model_output.get('total_mutations', 0)
#                 },
                
#                 # Model Input (what was sent to API)
#                 'model_input': model_input,
                
#                 # Model Output (prediction results)
#                 'model_output': {
#                     'predicted_resistance_level': model_output.get('predicted_resistance_level'),
#                     'probability_susceptible': model_output.get('probability_susceptible'),
#                     'all_probabilities': model_output.get('all_probabilities', {}),
#                     'recommendation': model_output.get('recommendation'),
#                     'explanation': model_output.get('explanation'),
#                     'risk_category': model_output.get('risk_category'),
#                     'total_mutations': model_output.get('total_mutations')
#                 },
                
#                 # Metadata
#                 'metadata': {
#                     'created_at': datetime.utcnow(),
#                     'analysis_version': '1.0.0',
#                     'model_version': 'v1'
#                 }
#             }
            
#             # Save to Firestore
#             self.db.collection(self.predictions_collection).document(doc_id).set(prediction_doc)
            
#             print(f"✅ Prediction saved with ID: {doc_id}")
#             return doc_id
            
#         except Exception as e:
#             print(f"❌ Error saving prediction: {str(e)}")
#             raise e
    
#     def get_prediction(self, prediction_id: str) -> Optional[Dict[str, Any]]:
#         """Retrieve a prediction by ID"""
#         try:
#             doc = self.db.collection(self.predictions_collection).document(prediction_id).get()
#             if doc.exists:
#                 return doc.to_dict()
#             return None
#         except Exception as e:
#             print(f"❌ Error retrieving prediction: {str(e)}")
#             return None
    
#     def get_patient_predictions(self, patient_id: str, limit: int = 10) -> list:
#         """Get all predictions for a specific patient"""
#         try:
#             predictions = (
#                 self.db.collection(self.predictions_collection)
#                 .where('patient_id', '==', patient_id)
#                 .order_by('timestamp', direction=firestore.Query.DESCENDING)
#                 .limit(limit)
#                 .stream()
#             )
            
#             return [doc.to_dict() for doc in predictions]
#         except Exception as e:
#             print(f"❌ Error retrieving patient predictions: {str(e)}")
#             return []
    
#     def get_all_predictions(self, limit: int = 50) -> list:
#         """Get recent predictions"""
#         try:
#             predictions = (
#                 self.db.collection(self.predictions_collection)
#                 .order_by('timestamp', direction=firestore.Query.DESCENDING)
#                 .limit(limit)
#                 .stream()
#             )
            
#             return [doc.to_dict() for doc in predictions]
#         except Exception as e:
#             print(f"❌ Error retrieving predictions: {str(e)}")
#             return []
    
#     def update_prediction(self, prediction_id: str, updates: Dict[str, Any]) -> bool:
#         """Update a prediction document"""
#         try:
#             self.db.collection(self.predictions_collection).document(prediction_id).update(updates)
#             print(f"✅ Prediction {prediction_id} updated")
#             return True
#         except Exception as e:
#             print(f"❌ Error updating prediction: {str(e)}")
#             return False
    
#     def delete_prediction(self, prediction_id: str) -> bool:
#         """Delete a prediction"""
#         try:
#             self.db.collection(self.predictions_collection).document(prediction_id).delete()
#             print(f"✅ Prediction {prediction_id} deleted")
#             return True
#         except Exception as e:
#             print(f"❌ Error deleting prediction: {str(e)}")
#             return False

# # Create service instance
# firebase_service = FirebaseService()



from firebase_config import db
from firebase_admin import firestore
from datetime import datetime
from typing import Dict, Any, Optional
import uuid

class FirebaseService:
    def __init__(self):
        self.db = db
        self.predictions_collection = 'predictions'
        self.patients_collection = 'patients'
    
    def save_prediction(self, patient_data: Dict[str, Any], 
                       model_input: Dict[str, Any], 
                       model_output: Dict[str, Any]) -> str:
        """
        Save prediction data to Firebase
        
        Args:
            patient_data: Patient information
            model_input: Data sent to ML model (original input)
            model_output: Prediction results from model (actual output)
            
        Returns:
            Document ID of saved prediction
        """
        try:
            # Generate unique ID
            doc_id = str(uuid.uuid4())
            
            # Prepare document data
            prediction_doc = {
                'prediction_id': doc_id,
                'patient_id': patient_data.get('patientId'),
                'timestamp': datetime.utcnow(),
                
                # Patient Information
                'patient_info': {
                    'patient_id': patient_data.get('patientId'),
                    'age': patient_data.get('age'),
                    'sex': patient_data.get('sex'),
                    'ethnicity': patient_data.get('ethnicity'),
                    'education': patient_data.get('education'),
                    'marital_status': patient_data.get('maritalStatus'),
                    'hiv_subtype': patient_data.get('hivSubtype'),
                    'art_regimen': patient_data.get('artRegimen'),
                    'art_duration': patient_data.get('artDuration')
                },
                
                # Clinical Data
                'clinical_data': {
                    'viral_load': patient_data.get('viralLoad'),
                    'cd4_count': patient_data.get('cd4Count'),
                    'test_date': patient_data.get('testDate')
                },
                
                # Mutation Data
                'mutations': {
                    'PI_MU_Count': patient_data.get('PI_MU_Count', 0),
                    'NRTI_MU_Count': patient_data.get('NRTI_MU_Count', 0),
                    'NNRTI_MU_Count': patient_data.get('NNRTI_MU_Count', 0),
                    'total_mutations': model_output.get('total_mutations', 0)
                },
                
                # Model Input (what was sent to API) - COMPLETE ORIGINAL INPUT
                'model_input': {
                    'SEX': model_input.get('SEX'),
                    'YEAR': model_input.get('YEAR'),
                    'Ethnicity': model_input.get('Ethnicity'),
                    'Education': model_input.get('Education'),
                    'Occupation': model_input.get('Occupation'),
                    'Marital_status': model_input.get('Marital_status'),
                    'Transmission_category': model_input.get('Transmission_category'),
                    'Baseline_CD4': model_input.get('Baseline_CD4'),
                    'Baseline_VL': model_input.get('Baseline_VL'),
                    'ART_duration': model_input.get('ART_duration'),
                    'HIV_1YX': model_input.get('HIV_1YX'),
                    'Initial_ART_regimen': model_input.get('Initial_ART_regimen'),
                    'PI_MU_Count': model_input.get('PI_MU_Count'),
                    'NRTI_MU_Count': model_input.get('NRTI_MU_Count'),
                    'NNRTI_MU_Count': model_input.get('NNRTI_MU_Count'),
                    'patientId': model_input.get('patientId'),
                    'testDate': model_input.get('testDate')
                },
                
                # Model Output (prediction results) - COMPLETE ACTUAL OUTPUT
                'model_output': {
                    'predicted_resistance_level': model_output.get('predicted_resistance_level'),
                    'probability_susceptible': model_output.get('probability_susceptible'),
                    'all_probabilities': model_output.get('all_probabilities', {}),
                    'recommendation': model_output.get('recommendation'),
                    'explanation': model_output.get('explanation'),
                    'risk_category': model_output.get('risk_category'),
                    'total_mutations': model_output.get('total_mutations')
                },
                
                # Metadata
                'metadata': {
                    'created_at': datetime.utcnow(),
                    'analysis_version': '1.0.0',
                    'model_version': 'v1',
                    'saved_successfully': True
                }
            }
            
            # Save to Firestore
            self.db.collection(self.predictions_collection).document(doc_id).set(prediction_doc)
            
            print(f"✅ Prediction saved to Firebase with ID: {doc_id}")
            print(f"   📊 Predicted: {model_output.get('predicted_resistance_level')} ({model_output.get('risk_category')})")
            
            return doc_id
            
        except Exception as e:
            print(f"❌ Error saving prediction to Firebase: {str(e)}")
            raise e
    
    def get_prediction(self, prediction_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a prediction by ID"""
        try:
            doc = self.db.collection(self.predictions_collection).document(prediction_id).get()
            if doc.exists:
                data = doc.to_dict()
                print(f"✅ Retrieved prediction: {prediction_id}")
                return data
            print(f"⚠️ Prediction not found: {prediction_id}")
            return None
        except Exception as e:
            print(f"❌ Error retrieving prediction: {str(e)}")
            return None
    
    def get_patient_predictions(self, patient_id: str, limit: int = 10) -> list:
        """Get all predictions for a specific patient"""
        try:
            predictions = (
                self.db.collection(self.predictions_collection)
                .where('patient_id', '==', patient_id)
                .order_by('timestamp', direction=firestore.Query.DESCENDING)
                .limit(limit)
                .stream()
            )
            
            results = [doc.to_dict() for doc in predictions]
            print(f"✅ Retrieved {len(results)} predictions for patient: {patient_id}")
            return results
            
        except Exception as e:
            print(f"❌ Error retrieving patient predictions: {str(e)}")
            return []
    
    def get_all_predictions(self, limit: int = 50) -> list:
        """Get recent predictions"""
        try:
            predictions = (
                self.db.collection(self.predictions_collection)
                .order_by('timestamp', direction=firestore.Query.DESCENDING)
                .limit(limit)
                .stream()
            )
            
            results = [doc.to_dict() for doc in predictions]
            print(f"✅ Retrieved {len(results)} recent predictions")
            return results
            
        except Exception as e:
            print(f"❌ Error retrieving predictions: {str(e)}")
            return []
    
    def update_prediction(self, prediction_id: str, updates: Dict[str, Any]) -> bool:
        """Update a prediction document"""
        try:
            updates['metadata.updated_at'] = datetime.utcnow()
            self.db.collection(self.predictions_collection).document(prediction_id).update(updates)
            print(f"✅ Prediction {prediction_id} updated")
            return True
        except Exception as e:
            print(f"❌ Error updating prediction: {str(e)}")
            return False
    
    def delete_prediction(self, prediction_id: str) -> bool:
        """Delete a prediction"""
        try:
            self.db.collection(self.predictions_collection).document(prediction_id).delete()
            print(f"✅ Prediction {prediction_id} deleted")
            return True
        except Exception as e:
            print(f"❌ Error deleting prediction: {str(e)}")
            return False
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about predictions"""
        try:
            # Get all predictions
            predictions = self.get_all_predictions(limit=1000)
            
            if not predictions:
                return {"error": "No predictions found"}
            
            # Calculate statistics
            total = len(predictions)
            risk_categories = {}
            resistance_levels = {}
            
            for pred in predictions:
                output = pred.get('model_output', {})
                risk = output.get('risk_category', 'UNKNOWN')
                level = output.get('predicted_resistance_level', 'UNKNOWN')
                
                risk_categories[risk] = risk_categories.get(risk, 0) + 1
                resistance_levels[level] = resistance_levels.get(level, 0) + 1
            
            return {
                'total_predictions': total,
                'risk_distribution': risk_categories,
                'resistance_distribution': resistance_levels,
                'last_updated': datetime.utcnow()
            }
            
        except Exception as e:
            print(f"❌ Error calculating statistics: {str(e)}")
            return {"error": str(e)}

# Create service instance
firebase_service = FirebaseService()
