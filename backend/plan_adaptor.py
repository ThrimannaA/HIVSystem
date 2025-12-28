"""
plan_adaptor.py - Culturally adapts personalized plans for different languages.
"""

import google.generativeai as genai
from typing import Dict, List, Any
import json

class PlanAdaptor:
    """Culturally adapts the user-facing text in a generated plan for a target language/culture."""

    def __init__(self, api_key: str):
        """Initialize with the same Gemini API key."""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def culturally_adapt_plan(self, original_plan: Dict, target_language: str, target_culture: str = None) -> Dict:
        """
        Culturally adapts all user-facing text in the plan.
        Returns a new dictionary with adapted expressions while keeping the same meaning.
        """
        # Extract the structure and content
        plan_content = self._extract_plan_content(original_plan)
        
        # Create a prompt for CULTURAL ADAPTATION (not just translation)
        adaptation_prompt = self._create_adaptation_prompt(
            plan_content, 
            target_language, 
            target_culture or target_language
        )

        try:
            # Call Gemini for cultural adaptation
            response = self.model.generate_content(adaptation_prompt)
            adapted_content = self._parse_adaptation_response(response.text)
            
            # Apply the adapted content back to the original structure
            culturally_adapted_plan = self._apply_adaptations(original_plan, adapted_content)
            
            # Add metadata
            culturally_adapted_plan['adaptation_metadata'] = {
                'original_language': 'en',
                'target_language': target_language,
                'target_culture': target_culture or target_language,
                'is_culturally_adapted': True,
                'adaptation_type': 'cultural_rewrite'
            }
            
            return culturally_adapted_plan
            
        except Exception as e:
            print(f"⚠️  Cultural adaptation failed: {e}. Returning original plan.")
            return original_plan

    def _extract_plan_content(self, plan: Dict) -> Dict:
        """Extract the meaningful content that needs cultural adaptation."""
        content = {
            'plan_overview': {
                'main_goal': plan.get('plan_summary', {}).get('your_main_focus', ''),
                'success_tip': plan.get('plan_summary', {}).get('key_to_success', '')
            },
            'phases': []
        }
        
        for phase in plan.get('personalized_plan', []):
            phase_content = {
                'phase_number': len(content['phases']) + 1,
                'original_title': phase.get('name', ''),
                'core_behavioral_goal': phase.get('description', ''),  # The main habit
                'why_this_matters': phase.get('rationale', ''),  # Personal relevance
                'weekly_tasks': phase.get('simple_steps', []),  # Concrete actions
                'duration_weeks': phase.get('duration_weeks', 2),
                'intensity': phase.get('intensity', 'medium')
            }
            content['phases'].append(phase_content)
            
        return content

    def _create_adaptation_prompt(self, plan_content: Dict, target_language: str, target_culture: str) -> str:
        """Creates a prompt for CULTURAL ADAPTATION (not direct translation)."""
        prompt = f"""
        ROLE: You are a cultural adaptation expert for health and wellness programs.
        
        TASK: Take this behavioral intervention plan and REWRITE it appropriately for someone from {target_culture} culture who speaks {target_language}.
        
        IMPORTANT GUIDELINES:
        1. DO NOT directly translate word-for-word. Instead, EXPRESS THE SAME MEANING using natural, colloquial expressions from {target_language}.
        2. Use culturally relevant examples, metaphors, and phrasing that would feel natural to a {target_culture} speaker.
        3. Maintain the SUPPORTIVE, PRACTICAL tone of the original plan.
        4. Keep ALL behavioral goals, weekly tasks, and health messages exactly the same in meaning.
        5. Structure should remain identical: same phases, same weekly tasks, same duration.
        6. Make it feel like this plan was originally written in {target_language} by someone from {target_culture}.
        
        ADAPTATION EXAMPLES:
        - Instead of "Building a foundation" → Use a culturally relevant metaphor for starting something strong
        - Instead of "Talk to a trusted adult" → Suggest culturally appropriate confidants (e.g., elder sibling, community leader, etc.)
        - Instead of "Practice saying no" → Use culturally appropriate ways of setting boundaries
        - Health concepts should use locally understood terms
        
        ORIGINAL PLAN CONTENT (in English):
        {json.dumps(plan_content, indent=2, ensure_ascii=False)}
        
        Return ONLY a JSON object with this exact structure:
        {{
            "plan_overview": {{
                "adapted_main_goal": "Culturally adapted version of the main goal",
                "adapted_success_tip": "Culturally adapted success tip"
            }},
            "phases": [
                {{
                    "phase_number": 1,
                    "adapted_title": "Culturally adapted phase title",
                    "adapted_goal": "Culturally adapted behavioral goal",
                    "adapted_rationale": "Culturally adapted 'why this matters'",
                    "adapted_weekly_tasks": ["Task 1 adapted", "Task 2 adapted"]
                }}
            ]
        }}
        """
        return prompt

    def _parse_adaptation_response(self, response_text: str) -> Dict:
        """Parse Gemini's adaptation response."""
        try:
            clean_text = response_text.strip()
            if '```json' in clean_text:
                clean_text = clean_text.split('```json')[1].split('```')[0].strip()
            elif '```' in clean_text:
                clean_text = clean_text.split('```')[1].strip()
            
            return json.loads(clean_text)
        except json.JSONDecodeError as e:
            print(f"⚠️  Failed to parse adaptation: {e}")
            raise

    def _apply_adaptations(self, original_plan: Dict, adapted_content: Dict) -> Dict:
        """Apply culturally adapted content back to the plan structure."""
        import copy
        adapted_plan = copy.deepcopy(original_plan)
        
        # Apply overview adaptations
        if 'plan_summary' in adapted_plan and 'plan_overview' in adapted_content:
            adapted_plan['plan_summary']['your_main_focus'] = \
                adapted_content['plan_overview']['adapted_main_goal']
            adapted_plan['plan_summary']['key_to_success'] = \
                adapted_content['plan_overview']['adapted_success_tip']
        
        # Apply phase adaptations
        for i, phase in enumerate(adapted_plan.get('personalized_plan', [])):
            if i < len(adapted_content['phases']):
                adapted_phase = adapted_content['phases'][i]
                phase['name'] = adapted_phase['adapted_title']
                phase['description'] = adapted_phase['adapted_goal']
                phase['rationale'] = adapted_phase['adapted_rationale']
                phase['simple_steps'] = adapted_phase['adapted_weekly_tasks']
        
        return adapted_plan