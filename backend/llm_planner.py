"""
LLM-Based Intervention Planner
"""
import json
from datetime import datetime
from typing import Dict, List, Any
import google.generativeai as genai
import os

class LLMInterventionPlanner:
    """Stage 2: Gemini 2.5 Flash-based plan generation"""
    
    def __init__(self, api_key: str = None):
        """
        Initialize Gemini client
        """
        print("🔧 Initializing Gemini 2.5 Flash Planner...")
        
        # Load API key (prefer environment variable)
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("Gemini API key not provided. Set GEMINI_API_KEY environment variable or pass api_key parameter.")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        print("   ✅ Gemini 2.5 Flash initialized successfully!")
        
        # System prompt template (adjust based on your needs)
#         self.system_prompt = """You are an expert public health advisor specializing in HIV prevention for adolescents and young adults.

# YOUR TASK:
# Generate a personalized, evidence-based, and actionable HIV prevention plan.

# CRITICAL CONSTRAINTS:
# 1. DO NOT select from a pre-defined list of interventions.
# 2. DO NOT use generic intervention names like "Harm Reduction Strategies" or "Counseling".
# 3. CREATE specific, tailored recommendations based EXACTLY on the user's risk factors.
# 4. Focus on BEHAVIORAL interventions only (education, skills, communication, goal-setting).
# 5. Structure the plan as a clear timeline with weekly phases.

# RESPONSE FORMAT (use exactly this structure):
# {
#   "personalized_plan": [
#     {
#       "phase_title": "Specific title for this phase",
#       "week_range": "Weeks X-Y",
#       "goals": ["Goal 1", "Goal 2"],
#       "activities": ["Specific activity 1", "Specific activity 2"],
#       "rationale": "Explain why this phase addresses the user's specific risk factors"
#     }
#   ],
#   "plan_summary": {
#     "total_weeks": N,
#     "primary_focus": "Main focus area",
#     "key_behavioral_targets": ["Target 1", "Target 2"]
#   }
# }"""

        self.system_prompt = """ROLE: You are a Sri Lankan HIV prevention public health advisor for the Sri Lankan National STD/AIDS Control Programme.
        You are a supportive, practical coach helping adults build safer, healthier habits to protect their future well-being.Your task is to create a practical, step-by-step action plan for the user does NOT have HIV but wants to stay that way.

        CRITICAL TONE & FORMAT RULES:
        1.  **Tone:** Supportive, encouraging, and collaborative. Use "you" and "we." Avoid clinical jargon.
        2.  **Language:** Use simple, clear English only. This English plan will be culturally adapted later for Sinhala or Tamil speakers by a separate system. Write for any adult (ages 13-65+). Use short sentences and actionable verbs."
        3.  **Focus on Behavior:** Every activity must be a concrete, doable behavior the user can practice in their daily life.Focus on actions users can take themselves - never prescribe medication or clinical treatment.
        4.  **Format for Clarity:** Structure each phase as a simple, pleasant weekly guide.
        5.  **AGE-NEUTRAL LANGUAGE:** This plan is for users aged 13-65+. Use language appropriate for ALL adults. 
            - DO NOT use terms like "trusted adult," "parent," "teacher," or "counselor" unless specifically relevant.
            - INSTEAD use: "healthcare provider," "support professional," "clinic," "helpline," "support group," "trusted friend/family member."
            - Assume users are autonomous adults who make their own healthcare decisions.
            - Activities should be practical for ANY adult age (e.g., "Schedule an appointment" not "Ask an adult to help you").
        6.  **Cultural Relevance:** Use culturally appropriate examples, metaphors, and phrasing that would feel natural to a Sri Lankan adult (Sinhala, Tamil, or English speaker). Use Sri Lankan examples, services (Gov. clinics, Lanka Hospitals, 1926 helpline), and social structures (family, community).
        7.  **Maintain Meaning:** Keep ALL behavioral goals, weekly tasks, and health messages exactly the same in meaning as the original plan.

        RESPONSE FORMAT (JSON):
        {
        "personalized_plan": [
            {
            "phase_title": "A simple, encouraging title focused on behavioral change",
            "week_range": "Weeks X-Y",
            "core_habit": "ONE clear, main behavioral goal for this phase",
            "weekly_activities": [
                "Week X: [Concrete, practical task using Sri Lankan context]",
                "Week Y: [Next practical task appropriate for Sri Lankan adults]"
            ],
            "why_this_matters_for_you": "A 1-sentence explanation connecting this directly to the user's specific risk factors"
            }
        ],
        "plan_summary": {
            "total_weeks": N,
            "your_main_focus": "e.g., 'Building safer habits for long-term wellbeing'",
            "key_to_success": "One simple, culturally relevant mindset tip (e.g., 'Small, consistent steps')"
        }
        }"""

    def _calculate_timeline_from_interventions(self, personalized_factors: List[Dict]) -> tuple:
        """
        Calculate timeline based on HOW MANY and WHAT KIND of interventions are needed.
        Professional model for prevention systems.
        Returns: (suggested_total_weeks, phase_duration_guide)
        """
        # Step 1: Categorize and count the critical interventions needed
        intervention_categories = set()
        high_impact_count = 0
        
        for factor in personalized_factors:
            points = factor.get('scoring_impact', 0)
            if points > 0:  # Only look at risk factors
                category = factor.get('category', 'general')
                intervention_categories.add(category)
                
                # Count high impact factors
                if points >= 10:
                    high_impact_count += 1
        
        # Step 2: Define time estimates per category (Evidence-based)
        category_time_estimate = {
            'sexual_behavior': 4,      # e.g., partner reduction, condom skills
            'substance_use': 3,        # e.g., harm reduction counseling
            'violence': 6,             # e.g., trauma support - takes longer
            'mental_health': 4,        # e.g., coping strategies
            'social_factors': 3,       # e.g., housing support connections
            'protective': 2,           # e.g., maintain protective factors
            'general': 2,              # e.g., basic education
            'unknown': 2
        }
        
        # Step 3: Calculate base timeline from categories
        base_weeks = 2  # Minimum engagement period
        
        for category in intervention_categories:
            base_weeks += category_time_estimate.get(category, 2)
        
        # Step 4: Adjust for number of major factors
        if high_impact_count >= 3:
            base_weeks += 2  # More complex case needs integration time
        elif high_impact_count == 0 and len(intervention_categories) > 0:
            base_weeks = max(4, base_weeks)  # Ensure minimum plan
        
        # Step 5: Cap at reasonable bounds
        total_weeks = min(max(base_weeks, 4), 16)  # 4-16 weeks range
        
        # Create guide for Gemini
        if intervention_categories:
            categories_str = ', '.join(sorted(intervention_categories))
        else:
            categories_str = "general risk education"
        
        phase_guide = f"""STRUCTURE THE PLAN AS FOLLOWS:
        - Total duration: {total_weeks} weeks
        - Focus areas: {categories_str}
        - High-impact factors to address: {high_impact_count}
        - Format: Create sequential phases, each focusing on one primary area.
        - First phase should address the highest-scoring risk factor."""
        
        return total_weeks, phase_guide, len(intervention_categories)

    def create_plan(self, risk_prediction: Dict, user_input: Dict) -> Dict:
        """
        Generate a truly personalized plan using Gemini
        """
        risk_stage = risk_prediction["risk_stage"]
        risk_score = risk_prediction.get("risk_score", 0) 
        personalized_factors = risk_prediction["personalized_factors"]
        
        # ADD DEBUG LOGGING HERE
        print(f"   🔍 DEBUG: Risk Stage = {risk_stage}")
        print(f"   🔍 DEBUG: Top 3 SHAP Factors:")
        for i, factor in enumerate(personalized_factors[:3]):
            print(f"     {i+1}. {factor['feature']}: {factor['interpretation']}")
        print(f"   🔍 DEBUG: User Input keys: {list(user_input.keys())[:3]}...")
    
        print(f"🧬 Gemini generating plan for Stage {risk_stage} (Score: {risk_score})...")

        # Calculate timeline based on interventions ===
        total_weeks, phase_guide, num_categories = self._calculate_timeline_from_interventions(
            personalized_factors
        )
        
        print(f"   📅 Calculated Timeline: {total_weeks} weeks for {num_categories} focus areas")

        # 1. Prepare user context from SHAP factors
        user_context = self._prepare_user_context(personalized_factors, user_input)

        progression_guidance = f"""
        CURRENT STAGE: {risk_stage} (Score: {risk_score})
        TARGET PROGRESSION: Stage {risk_stage} → Stage {max(0, risk_stage-1)} → Stage {max(0, risk_stage-2)}
        
        Each phase should show how behavioral changes reduce specific risk factors.
        """

        # 2. Generate plan with enhanced prompt
        risk_levels = ["Low", "Moderate", "High", "Very High"]

        # ENHANCED PROMPT WITH TIMELINE GUIDANCE
        enhanced_prompt = f"""{self.system_prompt}

    CLINICAL GUIDANCE FOR PLAN STRUCTURE:
    {phase_guide}

    RISK LEVEL: {risk_levels[risk_stage]}

    {user_context}

    Generate the personalized plan now. Respond ONLY with valid JSON in the specified format:"""
        
        # 3. Generate plan with Gemini
        llm_response = self._generate_with_gemini(enhanced_prompt + progression_guidance, risk_stage)
        
        # 4. Parse and structure the response
        parsed_plan = self._parse_llm_response(llm_response)
        
        # 5. Add metadata and expected outcomes
        enriched_plan = self._enrich_plan_with_timeline(
            parsed_plan, risk_stage, personalized_factors, total_weeks, num_categories
        )           
        
        return enriched_plan
    
    def _prepare_user_context(self, personalized_factors, user_input, risk_score=None):
        """Create detailed context with scoring-based priorities"""
        
        # Load feature dictionary
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        feature_dict_path = os.path.join(base_dir, 'data/feature_dictionary.json')
        with open(feature_dict_path, 'r') as f:
            feature_data = json.load(f)['feature_definitions']
        
        context = "USER'S RISK PROFILE WITH SCORING PRIORITIES:\n"
        context += "=" * 60 + "\n"
        context += f"Total Risk Score: {risk_score}\n\n"
        
        # Group factors by category for better intervention planning
        categories = {}
        for factor in personalized_factors:
            category = factor.get('category', 'unknown')
            if category not in categories:
                categories[category] = []
            categories[category].append(factor)
        
        # Present by category (helps Gemini create structured interventions)
        for category, factors in categories.items():
            context += f"\n{category.upper().replace('_', ' ')}:\n"
            context += "-" * 40 + "\n"
            
            for factor in factors[:3]:  # Top 3 per category
                question = factor.get('question', factor['feature'])
                points = factor.get('scoring_impact', 0)
                readable_value = self._get_readable_value(
                    factor['feature'], 
                    factor.get('user_value', 'N/A'), 
                    feature_data
                )
                
                context += f"• {question}\n"
                context += f"  Answer: {readable_value}\n"
                context += f"  Risk Points: {points}\n"
                context += f"  Priority: {'HIGH' if points >= 10 else 'MEDIUM' if points >= 5 else 'LOW'}\n\n"
        
        # Add intervention sequencing guidance
        context += "\nINTERVENTION PRIORITY GUIDANCE:\n"
        context += "=" * 60 + "\n"
        context += """Based on clinical guidelines, address in this order:
        1. CRITICAL (20+ points): Injection drug use, forced sex
        2. HIGH (10-19 points): No HIV testing, 4+ partners, substance use before sex
        3. MEDIUM (5-9 points): Multiple partners, no condom use, depression
        4. LOW (1-4 points): Other factors
        
        Create behavioral interventions that:
        - Are specific and actionable
        - Address the highest point factors first
        - Show progression from current stage to lower stages
        - Include weekly goals and activities"""
        
        return context

    def _get_readable_value(self, feature_name, numeric_value, feature_data):
        """Convert numeric response to human-readable label"""
        if feature_name in feature_data:
            info = feature_data[feature_name]
            options = info.get("options", {})
            
            # Try to map numeric value to option label
            str_val = str(int(numeric_value))
            if str_val in options:
                return options[str_val]
        
        # Fallback
        return f"Response level: {numeric_value}"
    
    def _generate_with_gemini(self, user_context: str, risk_stage: int) -> str:
        """Call Gemini API with the prepared prompt"""
        risk_levels = ["Low", "Moderate", "High", "Very High"]
        
        full_prompt = f"""{self.system_prompt}

RISK LEVEL: {risk_levels[risk_stage]}

{user_context}

Generate the personalized plan now. Respond ONLY with valid JSON in the specified format:"""
        
        try:
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"   ❌ Gemini API error: {e}")
            # Return a fallback plan
            return self._get_fallback_plan(risk_stage)
    
    def _parse_llm_response(self, llm_response: str) -> Dict:
        """Parse Gemini's JSON response"""
        try:
            # Clean response (remove markdown, extra text)
            clean_response = llm_response.strip()
            if "```json" in clean_response:
                clean_response = clean_response.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_response:
                clean_response = clean_response.split("```")[1].strip()
            
            parsed = json.loads(clean_response)
            return parsed
        except json.JSONDecodeError as e:
            print(f"   ⚠️ Failed to parse LLM response: {e}")
            print(f"   Raw response: {llm_response[:200]}...")
            return self._get_fallback_plan(2)  # Default to High Risk plan
    
    # Function responsible for building the final plan. It takes Gemini's raw response (which includes week_range for each phase), calculates the duration, and sets the start_week and end_week for each activity sequentially.
    def _enrich_plan_with_timeline(self, parsed_plan: Dict, risk_stage: int, 
                                personalized_factors: List[Dict], 
                                total_weeks: int, num_categories: int) -> Dict:
        """Enrich plan with timeline-based metadata"""
        
        # Convert Gemini's phases to your app's format
        sequenced_plan = []
        current_week = 1
        
        for i, phase in enumerate(parsed_plan.get("personalized_plan", []), 1):
            # Parse week range from Gemini or use calculated distribution
            week_range = phase.get("week_range", "")
            
            # Distribute weeks proportionally if Gemini didn't specify
            if not week_range or "-" not in week_range:
                # Smart distribution: give more weeks to earlier phases
                if i == 1:  # First phase gets more time
                    duration = min(4, max(2, total_weeks // 3))
                else:
                    remaining_weeks = total_weeks - current_week + 1
                    phases_left = len(parsed_plan.get("personalized_plan", [])) - i + 1
                    duration = max(2, remaining_weeks // phases_left)
            else:
                # Parse from Gemini's response
                try:
                    weeks = week_range.replace("Weeks", "").replace("Week", "").strip().split("-")
                    duration = int(weeks[1]) - int(weeks[0]) + 1
                except:
                    duration = 2
            
            end_week = current_week + duration - 1
            
            sequenced_plan.append({
                # "id": f"PHASE_{i}",
                # "name": phase.get("phase_title", f"Phase {i}"),
                # "description": "\n".join(phase.get("activities", [])),
                # "duration_weeks": duration,
                # "intensity": self._determine_intensity(risk_stage, i),
                # "format": "personalized",
                # "target_features": [f["feature"] for f in personalized_factors[:3]],
                # "expected_risk_reduction": self._estimate_reduction(risk_stage, i),
                # "start_week": current_week,
                # "end_week": end_week,
                # "current_status": "pending",
                # "goals": phase.get("goals", []),
                # "rationale": phase.get("rationale", "")

                "id": f"PHASE_{i}",
                "name": phase.get("phase_title", f"Step {i}"),
                "description": phase.get("core_habit", ""),  # New: main goal
                "simple_steps": phase.get("weekly_activities", []),  # New: practical tasks
                "user_rationale": phase.get("why_this_matters_for_you", ""),  # New: personal link
                "duration_weeks": duration,
                "intensity": self._determine_intensity(risk_stage, i),
                "format": "practical_guide",
                "target_features": [f["feature"] for f in personalized_factors[:3]],
                "expected_risk_reduction": self._estimate_reduction(risk_stage, i),  # KEEP THIS LINE
                "start_week": current_week,
                "end_week": end_week,
                "current_status": "pending",
                "goals": phase.get("goals", []),
                "rationale": phase.get("rationale", "")              
            })
            
            current_week = end_week + 1
        
        # Recalculate total weeks based on actual distribution
        actual_total_weeks = max([p["end_week"] for p in sequenced_plan]) if sequenced_plan else total_weeks
        total_reduction = sum(p["expected_risk_reduction"] for p in sequenced_plan)
        
        # Generate explanations
        explanations = []
        for intervention in sequenced_plan:
            explanations.append({
                "intervention": intervention["name"],
                "reason": intervention.get("rationale", "Generated based on your risk profile"),
                "matched_factors": [{
                    "factor": f["feature"],
                    "impact": f["scoring_impact"],
                    "interpretation": f["interpretation"]
                } for f in personalized_factors[:2] if f["feature"] in intervention["target_features"]],
                "expected_benefit": f"Expected duration: {intervention['duration_weeks']} weeks"
            })
        
        # Get categories for display
        categories = set()
        for factor in personalized_factors[:3]:
            cat = factor.get('category', 'unknown')
            if cat != 'unknown':
                categories.add(cat.replace('_', ' ').title())
        
        return {
            "risk_stage": risk_stage,
            "personalized_plan": sequenced_plan,
            "expected_outcomes": {
                "total_weeks": actual_total_weeks,
                "expected_risk_reduction": min(0.8, total_reduction),
                "expected_final_stage": max(0, risk_stage - (1 if total_reduction > 0.3 else 0)),
                "intervention_count": len(sequenced_plan),
                "completion_timeline": f"{actual_total_weeks} weeks",
                "focus_areas_count": num_categories,
                "calculated_basis": "intervention_count_model"
            },
            "explanations": explanations,
            "plan_summary": {
                "total_interventions": len(sequenced_plan),
                "focus_areas": list(categories)[:3] if categories else ["Behavioral Risk Reduction"],
                "timeline_calculation": f"Based on {num_categories} key risk areas",
                "weekly_intensity": "Progressive (increases then tapers)"
            },
            "uniqueness_score": self._calculate_uniqueness(sequenced_plan),
            "algorithm": "Intervention-Count_Based_Timeline"
        }
    
    def _determine_intensity(self, risk_stage: int, phase_num: int) -> str:
        """Determine intervention intensity based on risk and phase"""
        if risk_stage >= 2:  # High or Very High
            return "high" if phase_num == 1 else "medium"
        elif risk_stage == 1:  # Moderate
            return "medium" if phase_num <= 2 else "low"
        else:  # Low
            return "low"
    
    def _estimate_reduction(self, risk_stage: int, phase_num: int) -> float:
        """Estimate risk reduction per phase"""
        base = {0: 0.1, 1: 0.15, 2: 0.2, 3: 0.25}
        return min(0.3, base.get(risk_stage, 0.15) * (1.5 if phase_num == 1 else 1.0))
    
    def _calculate_uniqueness(self, plan: List[Dict]) -> float:
        """Calculate plan uniqueness score"""
        unique_elements = len(set(p["name"] for p in plan))
        return min(100, unique_elements * 25)


    def _get_fallback_plan(self, risk_stage: int) -> str:
        """Fallback if Gemini fails"""
        fallback = {
            "personalized_plan": [
                {
                    "phase_title": "Personalized Risk Awareness",
                    "week_range": "Weeks 1-2",
                    "goals": ["Understand personal risk factors", "Set safety goals"],
                    "activities": ["Daily risk reflection journal", "Weekly safety planning session"],
                    "rationale": "Building awareness of your specific risk patterns"
                }
            ],
            "plan_summary": {
                "total_weeks": 4,
                "primary_focus": "risk_awareness",
                "key_behavioral_targets": ["self_monitoring", "goal_setting"]
            }
        }
        return json.dumps(fallback)