"""
HIV Prevention Backend - True Personalization Engine
"""

import numpy as np
import pandas as pd
import joblib
import pickle
import json
import shap
from datetime import datetime
from typing import Dict, List, Any, Tuple
import random
import os
from .llm_planner import LLMInterventionPlanner
from .plan_adaptor import PlanAdaptor

# # fallback planner used when GEMINI_API_KEY is not set--> OLD VERSION AND NOT USED ACTUALLY
# class _FallbackPlanner:
#     """Rule-based fallback used when GEMINI_API_KEY is not set."""
#     def __init__(self):
#         pass

#     def create_plan(self, risk_prediction: Dict, user_input: Dict = None) -> Dict:
#         risk_stage = risk_prediction["risk_stage"]
#         items = [
#             {
#                 "id": "GEN_EDU", "name": "HIV Risk Education",
#                 "description": "Education on risk factors and safer practices.",
#                 "duration_weeks": 2, "intensity": "low", "format": "group_education",
#                 "category": "general", "target_features": [], "expected_risk_reduction": 0.10,
#                 "evidence_level": "medium"
#             },
#             {
#                 "id": "GEN_TEST", "name": "Testing Access Support",
#                 "description": "Help with finding and scheduling HIV tests.",
#                 "duration_weeks": 3, "intensity": "medium", "format": "individual_counseling",
#                 "category": "testing", "target_features": [], "expected_risk_reduction": 0.15,
#                 "evidence_level": "high"
#             },
#             {
#                 "id": "GEN_CONS", "name": "Personal Risk Counseling",
#                 "description": "One-on-one session to address specific behaviors.",
#                 "duration_weeks": 4, "intensity": "high", "format": "individual_counseling",
#                 "category": "behavior_change", "target_features": [], "expected_risk_reduction": 0.20,
#                 "evidence_level": "high"
#             },
#         ]
#         # Simple sequencing for create timeline
#         seq = [] # Empty list for scheduled interventions
#         week = 1 # Start from week 1
#         for it in items:
#             s = dict(it) # Copy: {"id": "GEN_EDU", "name": "HIV Risk Education", ...}
#             s["start_week"] = week
#             s["end_week"] = week + it["duration_weeks"] - 1 # 1 + 2 - 1 = 2 → end_week = 2
#             s["current_status"] = "pending" # Not started yet
#             seq.append(s) # Add to sequence
#             # Update week for next intervention
#             week += it["duration_weeks"] if it["intensity"] == "high" else max(1, it["duration_weeks"] - 1) # if intensity low, use max(1, 2-1) = max(1, 1) = 1 ----> # week = 1 + 1 = 2
#             # result:- Education: Weeks 1-2 | Next starts at week 2

#         # calculate total weeks and other stuff
#         total_weeks = max(i["end_week"] for i in seq) # ex:- Education ends: Week 2, Testing ends: Week 4, Counseling ends: Week 7 → total_weeks = 7
#         expected_reduction = min(0.8, sum(i["expected_risk_reduction"] for i in seq))
#         if expected_reduction >= 0.6:
#             final_stage = max(0, risk_stage - 2)
#         elif expected_reduction >= 0.3:
#             final_stage = max(0, risk_stage - 1)
#         else:
#             final_stage = risk_stage # Result: Stage 3 → Stage 2 (reduced by 1 level) / Stage 0 → Stage 0 (no reduction needed)

#         # Same for everyone
#         explanations = [
#             {
#                 "intervention": i["name"],
#                 "reason": "Baseline prevention support",
#                 "matched_factors": [],
#                 "expected_benefit": f"Expected to reduce risk by {i['expected_risk_reduction']*100:.0f}%",
#             }
#             for i in seq
#         ]

#         return {
#             "risk_stage": risk_stage,
#             "user_specific_profile": {},
#             "personalized_plan": seq,
#             "expected_outcomes": {
#                 "total_weeks": total_weeks,
#                 "expected_risk_reduction": expected_reduction,
#                 "expected_final_stage": final_stage,
#                 "intervention_count": len(seq),
#                 "completion_timeline": f"{total_weeks} weeks",
#             },
#             "explanations": explanations,
#             "plan_summary": {
#                 "total_interventions": len(seq),
#                 "intensity_distribution": {
#                     "low": 1, "medium": 1, "high": 1
#                 },
#                 "formats": list({i["format"] for i in seq}),
#                 "focus_areas": list({i.get("category", "general") for i in seq}),
#             },
#             "uniqueness_score": 50.0,
#         }


# fallback planner used when GEMINI_API_KEY is missing--> Uses one
class PersonalizedInterventionPlanner:
    """Rule-based fallback intervention planner.
    Produces a simple but structured plan compatible with the frontend.
    """
    def __init__(self):
        pass

    def create_plan(self, risk_prediction: Dict, user_input: Dict = None) -> Dict:
        risk_stage = risk_prediction["risk_stage"]
        color = risk_prediction.get("color", "#3b82f6")

        # Minimal generic interventions (3 items)
        catalog = [
            {
                "id": "GEN_EDU",
                "name": "HIV Risk Education",
                "description": "Education on risk factors and safer practices.",
                "duration_weeks": 2,
                "intensity": "low",
                "format": "group_education",
                "category": "general",
                "target_features": [],
                "expected_risk_reduction": 0.10,
                "evidence_level": "medium",
            },
            {
                "id": "GEN_TEST",
                "name": "Testing Access Support",
                "description": "Assistance with finding and scheduling HIV tests.",
                "duration_weeks": 3,
                "intensity": "medium",
                "format": "individual_counseling",
                "category": "testing",
                "target_features": [],
                "expected_risk_reduction": 0.15,
                "evidence_level": "high",
            },
            {
                "id": "GEN_CONS",
                "name": "Personal Risk Counseling",
                "description": "One-on-one counseling to address specific behaviors.",
                "duration_weeks": 4,
                "intensity": "high",
                "format": "individual_counseling",
                "category": "behavior_change",
                "target_features": [],
                "expected_risk_reduction": 0.20,
                "evidence_level": "high",
            },
        ]

        # Simple sequencing (allowing slight overlap for non-high)
        sequenced = [] # Empty list for scheduled interventions
        week = 1 # Start from week 1
        for item in catalog:
            seq = dict(item) # Copy: {"id": "GEN_EDU", "name": "HIV Risk Education", ...}
            seq["start_week"] = week
            seq["end_week"] = week + item["duration_weeks"] - 1 # 1 + 2 - 1 = 2 → end_week = 2
            seq["current_status"] = "pending"  # Not started yet
            sequenced.append(seq) # Add to sequence
            # Update week for next intervention
            if item["intensity"] == "high":
                week += item["duration_weeks"]
            else:
                week += max(1, item["duration_weeks"] - 1) # if intensity low, use max(1, 2-1) = max(1, 1) = 1 ----> # week = 1 + 1 = 2
            # So, result:- Education: Weeks 1-2 | Next starts at week 2

        # Calculate total weeks and other summary info
        total_weeks = max(i["end_week"] for i in sequenced) # ex:- Education ends: Week 2, Testing ends: Week 4, Counseling ends: Week 7 → total_weeks = 7
        expected_reduction = min(0.8, sum(i["expected_risk_reduction"] for i in sequenced))
        if expected_reduction >= 0.6:
            final_stage = max(0, risk_stage - 2)
        elif expected_reduction >= 0.3:
            final_stage = max(0, risk_stage - 1)
        else:
            final_stage = risk_stage # Result: Stage 3 → Stage 2 (reduced by 1 level) / Stage 0 → Stage 0 (no reduction needed)

        # Same for everyone
        plan_summary = {
            "total_interventions": len(sequenced),
            # Counts how many interventions are Low/Medium/High intensity
            "intensity_distribution": {
                "low": 1,  # Always says 1 low, 1 medium, 1 high as hardcoded
                "medium": 1,
                "high": 1,
            },
            # Gets unique delivery formats from interventions and converts set to list --> Ex: All interventions have "format": "individual_counseling"
            "formats": list({i["format"] for i in sequenced}),
            # Gets unique categories from interventions |  Gets category, defaults to "general" if missing and converts set to list --> Ex: ["general", "testing", "behavior_change"]
            "focus_areas": list({i.get("category", "general") for i in sequenced}),
        }

        explanations = [
            {
                "intervention": i["name"],
                "reason": "Selected as part of baseline prevention support", # UI shows under: "Why this phase:"--> But no displays when Gemini API is missing!
                "matched_factors": [],
                "expected_benefit": f"Expected to reduce risk by {i['expected_risk_reduction']*100:.0f}%",
            }
            for i in sequenced
        ]

        return {
            "risk_stage": risk_stage,
            "user_specific_profile": {"color": color},
            "personalized_plan": sequenced,
            "expected_outcomes": {
                "total_weeks": total_weeks,
                "expected_risk_reduction": expected_reduction,
                "expected_final_stage": final_stage,
                "intervention_count": len(sequenced),
                "completion_timeline": f"{total_weeks} weeks",
            },
            "explanations": explanations,
            "plan_summary": plan_summary,
            "uniqueness_score": 50.0, # hardcoded the personalized score to 50%
        }

class HIVRiskPredictor:
    """Stage 1: Risk Prediction with XGBoost + Clinical Scoring"""
    
    def __init__(self, model_path: str, scoring_system, features_path: str):
        print("🔧 Loading HIV Risk Predictor...")
        
        # Load model
        self.model = joblib.load(model_path)
        print(f"   ✅ Model loaded: {type(self.model).__name__}")
        
        # Load scoring system (REPLACES SHAP)
        self.scoring_system = scoring_system
        print("   ✅ Clinical scoring system loaded")
        
        # Load feature names
        with open(features_path, 'rb') as f:
            self.feature_names = pickle.load(f)
        print(f"   ✅ {len(self.feature_names)} features loaded")
        
        self.scoring_system = scoring_system

        # Risk stage definitions
        self.risk_definitions = {
            0: {"name": "Low Risk", "color": "#10B981", "description": "Minimal HIV risk factors present"},
            1: {"name": "Moderate Risk", "color": "#F59E0B", "description": "Some concerning behaviors identified"},
            2: {"name": "High Risk", "color": "#EF4444", "description": "Multiple high-risk behaviors present"},
            3: {"name": "Very High Risk", "color": "#DC2626", "description": "Immediate intervention recommended"}
        }
        
        print("   ✅ HIV Risk Predictor initialized successfully!")
    
    def predict(self, user_input: Dict) -> Dict:
        """
        Make personalized prediction for a user
        KEEP XGBoost prediction for stage, use scoring only for explanations
        """
        # 1. Get XGBoost prediction (UNCHANGED - keep your original)
        features_array = self._prepare_features(user_input)
        raw_pred = self.model.predict(features_array)
        risk_stage = int(np.ravel(raw_pred)[0])  # KEEP XGBoost stage
        probabilities = np.asarray(self.model.predict_proba(features_array)[0], dtype=float)
        confidence = probabilities[int(risk_stage)]
        
        # 2. Get clinical scoring ONLY for explanations (not for stage)
        # score, scoring_stage, scoring_explanations = self.scoring_system.calculate_risk_score(user_input)
        score, scoring_explanations = self.scoring_system.calculate_risk_score(user_input)
        scoring_stage = 0 
        
        # 3. Get personalized factors from scoring (for explanations only)
        personalized_factors = self._get_personalized_factors_from_scoring(
            scoring_explanations, user_input, score
        )
        
        # 4. Verify scoring matches XGBoost (just for debugging)
        if risk_stage != scoring_stage:
            print(f"⚠️  Note: XGBoost predicts stage {risk_stage}, scoring gives stage {scoring_stage}")
            # Still use XGBoost stage - it's our primary predictor
        
        # Get risk stage info based on XGBoost prediction
        risk_info = self.risk_definitions[risk_stage]  # Use XGBoost stage
        
        return {
            "risk_stage": risk_stage,  # KEEP XGBoost prediction
            "xgb_stage": risk_stage,   # For clarity
            "scoring_stage": scoring_stage,  # Just for reference
            "risk_score": score,  # From scoring system
            "risk_level": risk_info["name"],
            "confidence": float(confidence),
            "confidence_percentage": f"{confidence*100:.1f}%",
            "description": risk_info["description"],
            "color": risk_info["color"],
            "all_probabilities": {
                f"stage_{i}": float(prob) for i, prob in enumerate(probabilities)
            },
            "personalized_factors": personalized_factors,  # From scoring system
            "scoring_explanations": scoring_explanations,
            "timestamp": datetime.now().isoformat()
        }
    
    def _get_personalized_factors_from_scoring(self, explanations, user_input, score):
        """
        Convert scoring explanations to personalized factors
        """
        # Get top risk factors from scoring system
        top_factors = self.scoring_system.get_top_risk_factors(explanations, top_n=5)
        
        personalized_factors = []
        for i, factor in enumerate(top_factors, 1):
            feature = factor.get('feature')
            points = factor.get('points', 0)
            reason = factor.get('reason', '')
            
            # Get interpretation based on points (CLINICALLY CORRECT!)
            if points > 0:
                if points >= 20:
                    intensity = "CRITICALLY"
                elif points >= 10:
                    intensity = "STRONGLY"
                elif points >= 5:
                    intensity = "MODERATELY"
                else:
                    intensity = "SLIGHTLY"
                interpretation = f"{intensity} increases your risk"
            elif points < 0:
                interpretation = "PROTECTIVE factor - decreases your risk"
            else:
                interpretation = "Neutral impact"
            
            # Get user value
            user_value = factor.get('user_value')
            if user_value is None:
                user_value = user_input.get(feature, 'N/A')
            
            # Get readable value
            readable_value = self.scoring_system.get_readable_value(feature, user_value)
            
            personalized_factors.append({
                "rank": i,
                "feature": feature,
                "user_value": user_value,
                "scoring_impact": points,
                "shap_impact": float(points),
                "interpretation": interpretation,
                "question": self.scoring_system.get_feature_question(feature),
                "category": self.scoring_system.get_feature_category(feature),
                "absolute_impact": abs(points),
                "reason": reason,
                "readable_value": readable_value
            })
        
        return personalized_factors
        
    def _interpret_from_scoring(self, explanation):
        """
        Create interpretation from scoring (clinically correct!)
        """
        points = explanation.get('points', 0)
        
        if points >= 20:
            intensity = "CRITICALLY"
        elif points >= 10:
            intensity = "STRONGLY"
        elif points >= 5:
            intensity = "MODERATELY"
        else:
            intensity = "SLIGHTLY"
        
        return f"{intensity} increases your risk (+{points} points)"
    
    # Feature Preparation
    def _prepare_features(self, user_input: Dict) -> np.ndarray:
        """
        Convert user input to model-ready features
        USE EXACT VALUES FROM TRAINING DATA
        """
        # Mapping of what values were used in training when data was missing
        #is ONLY for ORIGINAL features, NOT missing indicators 
        MISSING_VALUE_MAP = {
            'q89': 1.0,     # if q89_missing=1, q89 assumes as selected the option 1
            'q82': 2.0,     # When q82_missing=1, q82 assumes as selected the option 2
            'QN102': 2.0,   # When QN102_missing=1, QN102 assumes as selected the option 2
            'q66': 3.0,     # When q66_missing=1, q66 was 3
            'QN106': 2.0,   # When QN106_missing=1, QN106 was 2
            'q103': 2.0,    # When q103_missing=1, q103 was 2
            'q104': 5.0,    # When q104_missing=1, q104 was 5 --> HIGHEST risk for this question
            'q78': 1.0,     # When q78_missing=1, q78 was 1
        }
        features = []
        
        # loop through all feature_names -> ['q1', 'q2', 'q89', 'q89_missing', ...]
        for feature_name in self.feature_names:
            # check q89_missing type features
            if feature_name.endswith('_missing'):
                # Handle missing indicators Ex: q89_missing → replace('_missing', '') → q89
                original_feature = feature_name.replace('_missing', '')
                
                # Check if user answered for the original feature
                if original_feature in user_input:
                    value = user_input[original_feature] # value = 99 (user's answer)
                    # Check if value is 99 (Prefer not to answer)
                    if value == 99:
                        # User selected "Prefer not to answer" → missing = 1--> So, added 1.0 to features list; but not a risk factor; So, not impact for risk stage
                        features.append(1.0)
                    else:
                        # User answered normally → missing = 0--> So, added 0.0 to features list; but not a risk factor; So, not impact for risk stage
                        features.append(0.0)
                else:
                    # User didn't answer at all → missing = 1;added 1.0 to list; but not a risk factor; So, not impact for risk stage
                    features.append(1.0)
            else:
                # Regular feature (not a missing indicator)
                if feature_name in user_input:
                    value = user_input[feature_name]
                    # Check if value = 99 (Prefer not to answer)
                    if value == 99:
                        # CRITICAL FIX: Use the EXACT value from training
                        # When data was missing in MISSING_VALUE_MAP, uses as default as 2.0 as the training_value
                        training_value = MISSING_VALUE_MAP.get(feature_name, 2.0)
                        features.append(training_value)
                    else:
                        features.append(float(value)) # if User answers q44 = 8 --> features.append(8.0)--> INCREASES risk stage
                else:
                    # Feature not provided → use training's missing value
                    training_value = MISSING_VALUE_MAP.get(feature_name, 2.0)
                    features.append(training_value) # EX: features.append(2.0) → features = [4.0, 1.0, 1.0, 2.0, 0.0, 2.0]

        
        return np.array(features).reshape(1, -1) 
    
    
    # def _get_personalized_factors(self, features_array: np.ndarray, 
    #                              shap_values: Any, risk_stage: int) -> List[Dict]:
    #     """
    #     Extract personalized risk factors using SHAP values
    #     """
    #     # Normalize risk_stage for indexing
    #     risk_stage = int(np.ravel([risk_stage])[0])
        
    #     # SAFETY CHECK 1: Ensure risk_stage is valid (0-3)
    #     if risk_stage < 0 or risk_stage > 3:
    #         print(f"⚠️  WARNING: Invalid risk_stage {risk_stage}, clamping to valid range")
    #         risk_stage = max(0, min(3, risk_stage))  # Clamp to 0-3

    #     # Get SHAP values for predicted class WITH BOUNDS CHECKING
    #     if isinstance(shap_values, list):
    #         # SAFETY CHECK 2: Ensure list has enough elements
    #         if risk_stage >= len(shap_values):
    #             print(f"⚠️  WARNING: risk_stage {risk_stage} out of SHAP list bounds (len={len(shap_values)}), using class 0")
    #             class_shap = shap_values[0][0]  # Use first class
    #         else:
    #             class_shap = shap_values[risk_stage][0]
    #     else:
    #         # SHAP returned ndarray
    #         shap_arr = np.asarray(shap_values)
            
    #         # DEBUG: Check shape
    #         print(f"DEBUG: shap_arr.shape = {shap_arr.shape}, ndim = {shap_arr.ndim}")
            
    #         if shap_arr.ndim == 3:           # (samples, classes, features)
    #             # SAFETY CHECK 3: Ensure we have enough classes
    #             if risk_stage >= shap_arr.shape[1]:
    #                 print(f"⚠️  WARNING: risk_stage {risk_stage} out of array bounds (shape[1]={shap_arr.shape[1]}), using class 0")
    #                 class_shap = shap_arr[0, 0]  # Use first class
    #             else:
    #                 class_shap = shap_arr[0, risk_stage]
    #         elif shap_arr.ndim == 2:         # (samples, features)
    #             # Already aggregated across classes
    #             class_shap = shap_arr[0]
    #         else:                            # fallback
    #             print(f"⚠️  WARNING: Unexpected SHAP array ndim={shap_arr.ndim}")
    #             # Create dummy array with correct length
    #             class_shap = np.zeros(len(self.feature_names))
        
    #     # DEBUG: Check class_shap
    #     print(f"DEBUG: class_shap shape = {class_shap.shape if hasattr(class_shap, 'shape') else 'scalar'}")
    #     print(f"DEBUG: class_shap type = {type(class_shap)}")
        
    #     # Ensure class_shap is 1D array with correct length
    #     if not hasattr(class_shap, 'shape') or len(class_shap.shape) == 0:
    #         # It's a scalar, convert to array
    #         class_shap = np.array([class_shap])
    #     elif len(class_shap.shape) > 1:
    #         # Flatten to 1D
    #         class_shap = class_shap.flatten()
        
    #     # Check if class_shap length matches feature_names
    #     if len(class_shap) != len(self.feature_names):
    #         print(f"⚠️  CRITICAL: class_shap length {len(class_shap)} != feature_names length {len(self.feature_names)}")
    #         # Pad or truncate to match
    #         if len(class_shap) < len(self.feature_names):
    #             # Pad with zeros
    #             class_shap = np.pad(class_shap, (0, len(self.feature_names) - len(class_shap)))
    #         else:
    #             # Truncate
    #             class_shap = class_shap[:len(self.feature_names)]
        
    #     # STEP 1: Filter out missing indicators and non-actionable features
    #     valid_indices = []
    #     for i, feature_name in enumerate(self.feature_names):
    #         # Skip missing indicators (they're technical, not behavioral)
    #         if feature_name.endswith('_missing'):
    #             continue
    #         # Skip demographic features (harder to change through interventions)
    #         if feature_name in ['q1', 'q2', 'raceeth']:
    #             continue
    #         valid_indices.append(i)
        
    #     # If no valid indices (shouldn't happen), use all except missing indicators
    #     if not valid_indices:
    #         print("⚠️  WARNING: No valid indices after filtering, using all except missing indicators")
    #         valid_indices = [i for i, name in enumerate(self.feature_names) 
    #                        if not name.endswith('_missing')]
        
    #     # STEP 2: Get SHAP values only for valid features
    #     valid_shap = class_shap[valid_indices]
        
    #     # STEP 3: Separate risk and protective factors
    #     risk_indices = []    # Positive SHAP = increases risk
    #     protective_indices = []  # Negative SHAP = decreases risk
        
    #     for i, idx in enumerate(valid_indices):
    #         shap_val = class_shap[idx]
    #         if shap_val > 0:  # Risk factor
    #             risk_indices.append((idx, shap_val))
    #         elif shap_val < 0:  # Protective factor
    #             protective_indices.append((idx, shap_val))
        
    #     # Sort risk indices by SHAP value (highest risk first)
    #     risk_indices.sort(key=lambda x: x[1], reverse=True)
    #     # Sort protective indices by SHAP value (most protective first = most negative)
    #     protective_indices.sort(key=lambda x: x[1])
        
    #     # STEP 4: Select top factors (prioritize risks, fill with protective if needed)
    #     selected_indices = []
        
    #     # Take up to 3 risk factors (prioritize for interventions)
    #     max_risk_factors = min(3, len(risk_indices))
    #     for i in range(max_risk_factors):
    #         selected_indices.append(risk_indices[i][0])
        
    #     # If we have fewer than 5 total, add strongest protective factors
    #     if len(selected_indices) < 5:
    #         remaining = 5 - len(selected_indices)
    #         max_protective = min(remaining, len(protective_indices))
    #         for i in range(max_protective):
    #             selected_indices.append(protective_indices[i][0])
        
    #     # If still fewer than 5, use remaining highest magnitude factors
    #     if len(selected_indices) < 5:
    #         # Get all indices not yet selected
    #         remaining_indices = [i for i in valid_indices if i not in selected_indices]
    #         if remaining_indices:
    #             # Sort by absolute SHAP value
    #             remaining_with_abs = [(i, abs(class_shap[i])) for i in remaining_indices]
    #             remaining_with_abs.sort(key=lambda x: x[1], reverse=True)
                
    #             # Add until we have 5 or run out
    #             needed = 5 - len(selected_indices)
    #             for i in range(min(needed, len(remaining_with_abs))):
    #                 selected_indices.append(remaining_with_abs[i][0])
        
    #     # STEP 5: Build personalized factors from selected indices
    #     personalized_factors = []
        
    #     for rank, idx in enumerate(selected_indices, 1):
    #         feature_name = self.feature_names[idx]
    #         feature_value = features_array[0, idx]
    #         shap_impact = class_shap[idx]
            
    #         # Get feature information
    #         feature_info = self.feature_info.get(feature_name, {})
            
    #         # Create human-readable interpretation
    #         interpretation = self._interpret_factor(
    #             feature_name, feature_value, shap_impact, feature_info
    #         )
            
    #         # Skip if interpretation is None (filtered out)
    #         if interpretation is None:
    #             continue
            
    #         # Get human-readable value
    #         options = feature_info.get("options", {})
    #         if isinstance(options, dict):
    #             try:
    #                 value_int = int(feature_value)
    #                 readable_value = options.get(str(value_int), f"Value {feature_value}")
    #             except:
    #                 readable_value = f"Value {feature_value}"
    #         else:
    #             readable_value = f"Value {feature_value}"
            
    #         # Convert SHAP impact to points scale for frontend compatibility
    #         # SHAP values typically range from -1 to 1, scale to reasonable point range
    #         points = round(shap_impact * 100)  # Scale SHAP to points (-100 to +100)
            
    #         personalized_factors.append({
    #             "rank": rank,
    #             "feature": feature_name,
    #             "user_value": float(feature_value),
    #             "shap_impact": float(shap_impact),
    #             "points": points,  # Add points for frontend compatibility
    #             "interpretation": interpretation,
    #             "question": feature_info.get("question", "Unknown question"),
    #             "category": feature_info.get("category", "unknown"),
    #             "absolute_impact": abs(shap_impact),
    #             "readable_value": readable_value
    #         })
        
    #     # DEBUG: Output what we found
    #     print(f"✅ Found {len(personalized_factors)} personalized factors")
    #     for factor in personalized_factors:
    #         print(f"   - {factor['feature']}: {factor['interpretation']}")
        
    #     return personalized_factors  
      
    # def _interpret_factor(self, feature_name: str, value: float, 
    #                     shap_impact: float, feature_info: Dict) -> str:
    #     """
    #     Create human-readable interpretation using DOMAIN KNOWLEDGE
    #     from feature_dictionary.json
    #     """
    #     # Check if this is a missing indicator
    #     if feature_name.endswith('_missing'):
    #         original_feature = feature_name.replace('_missing', '')
    #         if value == 1.0:
    #             return f"User preferred not to answer '{original_feature}'"
    #         else:
    #             return f"User answered '{original_feature}'"
        
    #     # Get domain knowledge from feature dictionary
    #     expected_direction = feature_info.get("risk_direction", "neutral")
    #     question = feature_info.get("question", feature_name)
        
    #     # Get options if available
    #     options = feature_info.get("options", {})
        
    #     if isinstance(options, dict):
    #         # Get the text value
    #         str_value = options.get(str(int(value)), f"Value {value}")
    #     else:
    #         str_value = f"Value {value}"
        
    #     # Determine impact level
    #     abs_impact = abs(shap_impact)
    #     if abs_impact > 0.1:
    #         intensity = "STRONGLY"
    #     elif abs_impact > 0.05:
    #         intensity = "MODERATELY"
    #     else:
    #         intensity = "SLIGHTLY"
        
    #     # ==== FIXED LOGIC: Use domain knowledge ====
        
    #     if expected_direction == "positive":
    #         # Higher values = more risk (e.g., more sexual partners)
    #         if shap_impact > 0:
    #             # Positive SHAP = increases risk probability (CORRECT)
    #             direction = "increases"
    #             action = "Consider reducing"
    #         else:
    #             # Negative SHAP = decreases risk probability (protective)
    #             direction = "decreases" 
    #             action = "This is protective"
        
    #     elif expected_direction == "negative":
    #         # Higher values = less risk (protective, e.g., parental monitoring)
    #         if shap_impact > 0:
    #             # Positive SHAP = increases risk probability (BAD!)
    #             direction = "increases"
    #             action = "This increases vulnerability"
    #         else:
    #             # Negative SHAP = decreases risk probability (GOOD!)
    #             direction = "decreases"
    #             action = "This is protective"
        
    #     else:  # neutral
    #         if shap_impact > 0:
    #             direction = "increases"
    #         else:
    #             direction = "decreases"
    #         action = "affects"
        
    #     return f"{intensity} {direction} your risk"


class HIVPreventionSystem:
    """Complete HIV Prevention System - Integrates all components"""
    
    def __init__(self):
        print("🚀 Initializing HIV Prevention System...")
        
        # Get the base directory
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Load models
        model_path = os.path.join(base_dir, "models/hiv_risk_model.pkl")
        features_path = os.path.join(base_dir, "models/hiv_risk_model_features.pkl")
        
        # Initialize Clinical Risk Scorer
        from .scoring_system import ClinicalRiskScorer
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        feature_dict_path = os.path.join(base_dir, 'data/feature_dictionary.json')
        scoring_system = ClinicalRiskScorer(feature_dict_path)
        
        # Initialize components
        self.risk_predictor = HIVRiskPredictor(
            model_path=model_path,
            scoring_system=scoring_system,  
            features_path=features_path
        )

        # Attempt to read .env for GEMINI_API_KEY if not present
        env_path = os.path.join(base_dir, '.env')
        if os.getenv("GEMINI_API_KEY") is None and os.path.exists(env_path):
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith('#'):
                            continue
                        if '=' in line:
                            k, v = line.split('=', 1)
                            v = v.strip().strip('"').strip("'")
                            os.environ.setdefault(k.strip(), v)
            except Exception:
                pass

        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            self.intervention_planner = LLMInterventionPlanner(api_key=api_key)
            planner_desc = "Gemini 2.5 Flash LLM"
        else:
            print("⚠️  GEMINI_API_KEY not set. Using fallback rule-based planner.")
            self.intervention_planner = PersonalizedInterventionPlanner()
            planner_desc = "Rule-based planner"

        print("✅ HIV Prevention System initialized successfully!")
        print(f"   Stage 1: XGBoost + SHAP")
        print(f"   Stage 2: {planner_desc}")
        print(f"   Features: {len(self.risk_predictor.feature_names)} risk factors")
    
    def process_user(self, user_input: Dict) -> Dict:
        """
        Complete pipeline for processing a user
        """
        print(f"\n👤 Processing new user...")
        
        # Stage 1: Risk Prediction
        print("   📊 Stage 1: Risk prediction...")
        risk_prediction = self.risk_predictor.predict(user_input)
        
        # Stage 2: LLM-generated Intervention Planning
        print("   🤖 Stage 2: Gemini generating personalized plan...")
        # DEBUG: Check which planner is being used (_FallbackPlanner/PersonalizedInterventionPlanner)
        print(f"   🔍 DEBUG: Planner Type = {type(self.intervention_planner).__name__}")
        print(f"   🔍 DEBUG: Planner Module = {self.intervention_planner.__module__}")
        # FIX: Pass BOTH parameters
        intervention_plan = self.intervention_planner.create_plan(risk_prediction, user_input)
        
        # Combine results
        result = {
            "user_id": self._generate_user_id(user_input),
            "timestamp": datetime.now().isoformat(),
            "risk_prediction": risk_prediction,
            "intervention_plan": intervention_plan,
            "system_metadata": {
                "version": "2.5_flash_Gemini",
                "personalization_score": intervention_plan["uniqueness_score"],
                "explainability_score": self._calculate_explainability(risk_prediction)
            }
        }
        
        print(f"   ✅ Processing complete!")
        print(f"   🎯 Risk Stage: {risk_prediction['risk_level']}")
        print(f"   🧬 Gemini Plan: {len(intervention_plan['personalized_plan'])} unique phases")
        print(f"   📈 Personalization: {intervention_plan['uniqueness_score']}% unique")
        
        user_language = user_input.get('preferred_language', 'en')
        user_culture = user_input.get('preferred_culture', user_language)  # Add this field
        
        if user_language != 'en':
            print(f"   🌐 Culturally adapting plan for {user_culture} ({user_language})...")
            try:
                # Initialize CULTURAL ADAPTOR (not translator)
                cultural_adaptor = PlanAdaptor(api_key=os.getenv("GEMINI_API_KEY"))
                # Culturally adapt the intervention plan
                result['intervention_plan'] = cultural_adaptor.culturally_adapt_plan(
                    result['intervention_plan'],
                    user_language,
                    user_culture
                )
            except Exception as e:
                print(f"   ⚠️  Cultural adaptation skipped: {e}")
        
        return result
    
    def _generate_user_id(self, user_input: Dict) -> str:
        """
        Generate unique user ID
        """
        import hashlib
        input_str = json.dumps(user_input, sort_keys=True)
        return hashlib.md5(input_str.encode()).hexdigest()[:8]
    
    def _calculate_explainability(self, risk_prediction: Dict) -> float:
        """
        Calculate explainability score (0-100%)
        """
        factors = risk_prediction.get("personalized_factors", [])
        
        # Base score + points for each explained factor
        score = 30  # Base score
        
        for factor in factors:
            if factor.get("interpretation"):
                score += 10
            if factor.get("question") != "Unknown question":
                score += 5
        
        return min(100, score)
    
    def batch_process(self, users_data: List[Dict]) -> Dict:
        """
        Process multiple users and compare personalization
        """
        print(f"\n👥 Processing {len(users_data)} users...")
        
        results = []
        comparisons = []
        
        # Process each user
        for user_data in users_data:
            result = self.process_user(user_data)
            results.append(result)
        
        # Compare results
        if len(results) >= 2:
            for i in range(len(results)):
                for j in range(i + 1, len(results)):
                    comparison = self._compare_users(results[i], results[j])
                    comparisons.append(comparison)
        
        return {
            "results": results,
            "comparisons": comparisons,
            "personalization_analysis": self._analyze_personalization(comparisons)
        }
    
    def _compare_users(self, result1: Dict, result2: Dict) -> Dict:
        """
        Compare two users' results
        """
        same_stage = result1["risk_prediction"]["risk_stage"] == result2["risk_prediction"]["risk_stage"]
        
        # Compare interventions
        interventions1 = set([i["name"] for i in result1["intervention_plan"]["personalized_plan"]])
        interventions2 = set([i["name"] for i in result2["intervention_plan"]["personalized_plan"]])
        
        common = len(interventions1.intersection(interventions2))
        different = len(interventions1.symmetric_difference(interventions2))
        
        # Compare risk factors
        factors1 = [f["feature"] for f in result1["risk_prediction"]["personalized_factors"][:3]]
        factors2 = [f["feature"] for f in result2["risk_prediction"]["personalized_factors"][:3]]
        common_factors = len(set(factors1) & set(factors2))
        
        return {
            "user1_id": result1["user_id"],
            "user2_id": result2["user_id"],
            "same_risk_stage": same_stage,
            "common_interventions": common,
            "different_interventions": different,
            "common_risk_factors": common_factors,
            "is_truly_personalized": different > common if same_stage else True
        }
    
    def _analyze_personalization(self, comparisons: List[Dict]) -> Dict:
        """
        Analyze personalization across all comparisons
        """
        if not comparisons:
            return {"analysis": "No comparisons available"}
        
        same_stage_comparisons = [c for c in comparisons if c["same_risk_stage"]]
        truly_personalized = [c for c in same_stage_comparisons if c["is_truly_personalized"]]
        
        return {
            "total_comparisons": len(comparisons),
            "same_stage_comparisons": len(same_stage_comparisons),
            "truly_personalized": len(truly_personalized),
            "personalization_rate": len(truly_personalized) / len(same_stage_comparisons) if same_stage_comparisons else 0,
            "analysis": f"{len(truly_personalized)}/{len(same_stage_comparisons)} same-stage users got different plans"
        }

