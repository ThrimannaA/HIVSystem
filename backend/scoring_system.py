"""
Transparent Scoring System - EXACT replica of create_target() function
"""
import json
import os
from typing import Dict, List, Tuple, Any, Optional
import pandas as pd


class ClinicalRiskScorer:
    """EXACT replica of your create_target() scoring logic"""

    FEATURE_KEY_MAP = {
    # Sexual behavior / exposure
    'QN56': 'q12',
    'QN57': 'q13',
    'QN58': 'q14',
    'QN59': 'q15',
    'QN60': 'q16',
    'QN61': 'q17',
    'QN62': 'q18',
    'QN63': 'q63',  # sexual contact
    'QN64': 'q64',  # sexual orientation / identity

    # Substance use
    'QN43': 'q43',  # binge drinking
    'QN46': 'q46',  # marijuana ever
    'QN48': 'q48',  # marijuana use
    'QN52': 'q52',  # heroin use
    'QN55': 'q55',  # injection drug use

    # Birth control / contraception
    'QN62': 'q62',

    # Mental health
    'QN26': 'q26',
    'QN27': 'q27',
    'QN29': 'q29',
    'QN30': 'q30',
    'QN84': 'q84',
    'QN85': 'q85',
    'QN106': 'QN106',  # cognitive difficulties

    # Demographics
    'q1': 'q1',  # age
    'raceeth': 'raceeth',

    # Violence / coercion
    'q19': 'q19',
    'q20': 'q20',
    'q21': 'q21',
    'q22': 'q22',

    # Social / protective
    'q76': 'q76',  # physical activity
    'q78': 'q78',  # community involvement
    'q80': 'q80',  # social media
    'q81': 'q81',  # HIV negative test
    'q82': 'q82',  # STD testing
    'q86': 'q86',  # housing instability
    'QN102': 'QN102', # family incarceration
    'q103': 'q103', # community connection
    'q104': 'q104', # safety awareness

    # Diet
    'q69': 'q69',
    'q70': 'q70',
    'q71': 'q71',
    'q72': 'q72',
    'q73': 'q73',
    'q74': 'q74',

    # Weight / body
    'q65': 'q65',
    'q66': 'q66',

    # Sexual health
    'q61': 'q61',  # no condom last sex
}

    
    def __init__(self, feature_dict_path: str = None):
        print("🔧 Initializing Clinical Risk Scorer...")

        # Load feature dictionary for readable explanations
        if feature_dict_path:
            with open(feature_dict_path, 'r', encoding='utf-8') as f:
                self.feature_info = json.load(f)['feature_definitions']
        else:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            path = os.path.join(base_dir, 'data', 'feature_dictionary.json')
            with open(path, 'r', encoding='utf-8') as f:
                self.feature_info = json.load(f)['feature_definitions']

        print("✅ Clinical Risk Scorer initialized!")

    def calculate_risk_score(self, user_input: Dict) -> Tuple[float, int, List[Dict]]:
        """Calculate risk score and explanations from user input"""
        print(f"🔍 DEBUG: Starting scoring for {len(user_input)} features")
        row = {}
        for key, value in user_input.items():
            try:
                if value is None:
                    row[key] = None
                else:
                    row[key] = int(value)
            except:
                row[key] = value

        score, explanations = self._create_target_exact(row)
        print(f"🔍 DEBUG: Final score = {score}")
        print(f"🔍 DEBUG: Number of explanations = {len(explanations)}")
        return float(score), explanations

    def _create_target_exact(self, row: Dict) -> Tuple[float, int, List[Dict]]:
        """Exact replica of create_target with corrections"""
        score = 0.0
        explanations: List[Dict] = []

        def get_num(key):
            val = row.get(key)
            if val is None or pd.isna(val):
                return None
            try:
                return int(val)
            except:
                return None
        
        # ===========================================
        # STAGE 3 TRIGGERS FIRST (HIGHEST PRIORITY)
        # ===========================================
        
        # Automatic Stage 3 for high-risk injection patterns
        if get_num('q55') == 3 and get_num('q52') >= 2:
            explanations.append({
                'feature': 'q55_q52_combination',
                'points': 999,
                'reason': 'Injected 2+ times AND used heroin (SSP/PrEP criteria)',
                'priority': 'CRITICAL',
                'user_value': f'q55={get_num("q55")}, q52={get_num("q52")}'
            })
            return 999, 3, explanations
        
        # Injection drug use 2+ times
        q55_val = get_num('q55')
        if pd.notna(q55_val) and q55_val >= 3:
            explanations.append({
                'feature': 'q55',
                'points': 999,
                'reason': 'Injection drug use 2+ times',
                'priority': 'CRITICAL',
                'user_value': q55_val
            })
            return 999, 3, explanations
        
        # ===========================================
        # STAGE 0 TRIGGERS (NEVER HAD SEX)
        # ===========================================
        
        # Check if never had sex
        never_had_sex = False
        if get_num('QN56') == 2:
            never_had_sex = True
        if get_num('q58') == 1:
            never_had_sex = True
        if get_num('q63') == 1:
            never_had_sex = True
        if get_num('q62') == 1:
            never_had_sex = True
        if get_num('q60') == 1:
            never_had_sex = True
        if get_num('q61') == 1:
            never_had_sex = True
        if get_num('q59') == 1:
            never_had_sex = True
        
        if never_had_sex:
            explanations.append({
                'feature': 'never_had_sex',
                'points': 0,
                'reason': 'Never had sexual intercourse',
                'priority': 'LOW',
                'user_value': None
            })
        
        # ===========================================
        # REGULAR SCORING - EXACT COPY
        # ===========================================
        
        # 1. Core Sexual Exposure (QN56–QN62) — Binary
        score = self._add_points('QN56', 1, 5, row, score, explanations, 'Had sexual intercourse')
        score = self._add_points('QN57', 1, 8, row, score, explanations, 'Sexual intercourse before age 18')
        score = self._add_points('QN58', 1, 15, row, score, explanations, '4+ sexual partners')
        score = self._add_points('QN59', 1, 5, row, score, explanations, 'Currently sexually active')
        score = self._add_points('QN60', 1, 10, row, score, explanations, 'Substances before last sex')
        score = self._add_points('QN62', 1, 5, row, score, explanations, 'Used birth control pills')
        
        # 2. Sexual Identity & Contacts — Graduated
        q63_val = get_num('q63')
        if pd.notna(q63_val) and q63_val in [2, 3, 4]:
            score += 8
            explanations.append({
                'feature': 'q63',
                'points': 8,
                'reason': 'Has had sexual contact with others',
                'priority': 'MEDIUM',
                'user_value': q63_val
            })
        
        q64_val = get_num('q64')
        if pd.notna(q64_val):
            if q64_val in [2, 3]:
                score += 8
                explanations.append({
                    'feature': 'q64',
                    'points': 8,
                    'reason': 'Gay/Lesbian or Bisexual',
                    'priority': 'MEDIUM',
                    'user_value': q64_val
                })
            elif q64_val in [4, 5]:
                score += 6
                explanations.append({
                    'feature': 'q64',
                    'points': 6,
                    'reason': 'Other or Questioning',
                    'priority': 'MEDIUM',
                    'user_value': q64_val
                })
        
        # 3. Raw Sexual Behavior — FULL GRADUATED
        score = self._add_points('q60', 2, 10, row, score, explanations, 'Substances before last sex')
        
        q58_val = get_num('q58')
        if pd.notna(q58_val):
            if q58_val == 7:
                score += 20
                explanations.append({
                    'feature': 'q58',
                    'points': 20,
                    'reason': '6+ lifetime partners',
                    'priority': 'HIGH',
                    'user_value': q58_val
                })
            elif q58_val >= 5:
                score += 15
                explanations.append({
                    'feature': 'q58',
                    'points': 15,
                    'reason': '4-5 lifetime partners',
                    'priority': 'HIGH',
                    'user_value': q58_val
                })
            elif q58_val >= 3:
                score += 10
                explanations.append({
                    'feature': 'q58',
                    'points': 10,
                    'reason': '2-3 lifetime partners',
                    'priority': 'MEDIUM',
                    'user_value': q58_val
                })
            elif q58_val == 2:
                score += 4
                explanations.append({
                    'feature': 'q58',
                    'points': 4,
                    'reason': '1 lifetime partner',
                    'priority': 'LOW',
                    'user_value': q58_val
                })
        
        q59_val = get_num('q59')
        if pd.notna(q59_val) and q59_val >= 4:
            score += 8
            explanations.append({
                'feature': 'q59',
                'points': 8,
                'reason': '2+ recent partners',
                'priority': 'MEDIUM',
                'user_value': q59_val
            })
        
        score = self._add_points('q61', 3, 12, row, score, explanations, 'No condom last sex')
        
        q62_val = get_num('q62')
        if pd.notna(q62_val) and q62_val in [2, 3, 5, 6, 7, 8]:
            score += 8
            explanations.append({
                'feature': 'q62',
                'points': 8,
                'reason': 'Used contraception',
                'priority': 'MEDIUM',
                'user_value': q62_val
            })
        
        # 4. Substance Use — FULL GRADUATED
        score = self._add_points('QN43', 1, 7, row, score, explanations, 'Binge drinking')
        score = self._add_points('QN48', 1, 5, row, score, explanations, 'Marijuana use')
        score = self._add_points('QN46', 1, 4, row, score, explanations, 'Ever used marijuana')
        
        q52_val = get_num('q52')
        if pd.notna(q52_val):
            if q52_val >= 3:
                score += 20
                explanations.append({
                    'feature': 'q52',
                    'points': 20,
                    'reason': '10+ times heroin use',
                    'priority': 'CRITICAL',
                    'user_value': q52_val
                })
            elif q52_val == 2:
                score += 15
                explanations.append({
                    'feature': 'q52',
                    'points': 15,
                    'reason': '1-9 times heroin use',
                    'priority': 'HIGH',
                    'user_value': q52_val
                })
        
        q44_val = get_num('q44')
        if pd.notna(q44_val) and q44_val >= 6:
            score += 10
            explanations.append({
                'feature': 'q44',
                'points': 10,
                'reason': 'Heavy episodic drinking',
                'priority': 'MEDIUM',
                'user_value': q44_val
            })
        
        # 5. Demographics — Graduated
        q1_val = get_num('q1')
        if pd.notna(q1_val) and q1_val >= 5:
            score += 4
            explanations.append({
                'feature': 'q1',
                'points': 4,
                'reason': 'Age 35+ years',
                'priority': 'LOW',
                'user_value': q1_val
            })
        
        raceeth_val = get_num('raceeth')
        if pd.notna(raceeth_val):
            raceeth_str = str(int(raceeth_val))
            if raceeth_str in ['3', '6', '7']:
                score += 3
                explanations.append({
                    'feature': 'raceeth',
                    'points': 3,
                    'reason': 'Race/ethnicity disparities',
                    'priority': 'LOW',
                    'user_value': raceeth_val
                })
        
        # 6. Violence & Coercion — FULL GRADUATED
        q21_val = get_num('q21')
        if pd.notna(q21_val):
            if q21_val >= 4:
                score += 12
                explanations.append({
                    'feature': 'q21',
                    'points': 12,
                    'reason': '2+ times sexual coercion',
                    'priority': 'HIGH',
                    'user_value': q21_val
                })
            elif q21_val >= 3:
                score += 6
                explanations.append({
                    'feature': 'q21',
                    'points': 6,
                    'reason': '1 time sexual coercion',
                    'priority': 'MEDIUM',
                    'user_value': q21_val
                })
        
        q20_val = get_num('q20')
        if pd.notna(q20_val):
            if q20_val >= 3:
                score += 14
                explanations.append({
                    'feature': 'q20',
                    'points': 14,
                    'reason': '2+ times forced sex',
                    'priority': 'HIGH',
                    'user_value': q20_val
                })
            elif q20_val >= 2:
                score += 8
                explanations.append({
                    'feature': 'q20',
                    'points': 8,
                    'reason': '1 time forced sex',
                    'priority': 'MEDIUM',
                    'user_value': q20_val
                })
        
        q22_val = get_num('q22')
        if pd.notna(q22_val):
            if q22_val >= 4:
                score += 11
                explanations.append({
                    'feature': 'q22',
                    'points': 11,
                    'reason': '2+ times physical violence',
                    'priority': 'HIGH',
                    'user_value': q22_val
                })
            elif q22_val >= 3:
                score += 6
                explanations.append({
                    'feature': 'q22',
                    'points': 6,
                    'reason': '1 time physical violence',
                    'priority': 'MEDIUM',
                    'user_value': q22_val
                })
        
        score = self._add_points('q19', 1, 35, row, score, explanations, 'Forced sex')
        
        # 7. Mental Health & Co-Factors — FULL GRADUATED
        score = self._add_points('q26', 1, 6, row, score, explanations, 'Depression symptoms')
        score = self._add_points('q27', 1, 10, row, score, explanations, 'Suicidal thoughts')
        
        q29_val = get_num('q29')
        if pd.notna(q29_val):
            if q29_val >= 4:
                score += 15
                explanations.append({
                    'feature': 'q29',
                    'points': 15,
                    'reason': '4+ suicide attempts',
                    'priority': 'CRITICAL',
                    'user_value': q29_val
                })
            elif q29_val >= 2:
                score += 10
                explanations.append({
                    'feature': 'q29',
                    'points': 10,
                    'reason': '1-3 suicide attempts',
                    'priority': 'HIGH',
                    'user_value': q29_val
                })
        
        score = self._add_points('q30', 2, 18, row, score, explanations, 'Suicide attempt with treatment')
        
        q89_val = get_num('q89')
        if pd.notna(q89_val) and q89_val >= 4:
            score += 8
            explanations.append({
                'feature': 'q89',
                'points': 8,
                'reason': 'Often disrespected',
                'priority': 'MEDIUM',
                'user_value': q89_val
            })
        
        q84_val = get_num('q84')
        if pd.notna(q84_val) and q84_val >= 4:
            score += 10
            explanations.append({
                'feature': 'q84',
                'points': 10,
                'reason': 'Poor mental health',
                'priority': 'HIGH',
                'user_value': q84_val
            })
        
        q85_val = get_num('q85')
        if pd.notna(q85_val) and q85_val <= 3:
            score += 5
            explanations.append({
                'feature': 'q85',
                'points': 5,
                'reason': 'Inadequate sleep',
                'priority': 'LOW',
                'user_value': q85_val
            })
        
        score = self._add_points('QN106', 1, 8, row, score, explanations, 'Cognitive difficulties')
        
        # 8. Social & Protective — Graduated
        q80_val = get_num('q80')
        if pd.notna(q80_val) and q80_val >= 6:
            score += 3
            explanations.append({
                'feature': 'q80',
                'points': 3,
                'reason': 'Heavy social media use',
                'priority': 'LOW',
                'user_value': q80_val
            })
        
        q86_val = get_num('q86')
        if pd.notna(q86_val) and q86_val >= 2:
            score += 7
            explanations.append({
                'feature': 'q86',
                'points': 7,
                'reason': 'Housing instability',
                'priority': 'MEDIUM',
                'user_value': q86_val
            })
        
        score = self._add_points('QN102', 1, 6, row, score, explanations, 'Family incarceration')
        
        # PROTECTIVE FACTORS (negative points)
        score = self._add_points('q81', 1, -12, row, score, explanations, 'HIV negative test')
        
        q103_val = get_num('q103')
        if pd.notna(q103_val) and q103_val <= 2:
            score -= 8
            explanations.append({
                'feature': 'q103',
                'points': -8,
                'reason': 'Community connection (protective)',
                'priority': 'PROTECTIVE',
                'user_value': q103_val
            })
        
        q104_val = get_num('q104')
        if pd.notna(q104_val) and q104_val >= 4:
            score -= 8
            explanations.append({
                'feature': 'q104',
                'points': -8,
                'reason': 'Safety awareness (protective)',
                'priority': 'PROTECTIVE',
                'user_value': q104_val
            })
        
        q78_val = get_num('q78')
        if pd.notna(q78_val) and q78_val >= 2:
            score -= 5
            explanations.append({
                'feature': 'q78',
                'points': -5,
                'reason': 'Community involvement (protective)',
                'priority': 'PROTECTIVE',
                'user_value': q78_val
            })
        
        q76_val = get_num('q76')
        if pd.notna(q76_val) and q76_val >= 5:
            score -= 4
            explanations.append({
                'feature': 'q76',
                'points': -4,
                'reason': 'Physical activity (protective)',
                'priority': 'PROTECTIVE',
                'user_value': q76_val
            })
        
        # 9. Other Co-Factors
        score = self._add_points('q82', 1, 8, row, score, explanations, 'STD testing')
        
        q66_val = get_num('q66')
        if pd.notna(q66_val):
            if q66_val == 1:
                score += 7
                explanations.append({
                    'feature': 'q66',
                    'points': 7,
                    'reason': 'Very underweight',
                    'priority': 'MEDIUM',
                    'user_value': q66_val
                })
            elif q66_val == 2:
                score += 5
                explanations.append({
                    'feature': 'q66',
                    'points': 5,
                    'reason': 'Slightly underweight',
                    'priority': 'LOW',
                    'user_value': q66_val
                })
            elif q66_val >= 4:
                score += 3
                explanations.append({
                    'feature': 'q66',
                    'points': 3,
                    'reason': 'Overweight',
                    'priority': 'LOW',
                    'user_value': q66_val
                })
        
        score = self._add_points('q65', 2, 6, row, score, explanations, 'Transgender')
        
        # 10. Diet (q69–q74) — Graduated
        for q in ['q69', 'q70', 'q71', 'q72', 'q73']:
            val = get_num(q)
            if pd.notna(val) and val == 1:
                score += 2
                explanations.append({
                    'feature': q,
                    'points': 2,
                    'reason': f'Poor diet ({q})',
                    'priority': 'LOW',
                    'user_value': val
                })
        
        q74_val = get_num('q74')
        if pd.notna(q74_val) and q74_val == 1:
            score -= 2
            explanations.append({
                'feature': 'q74',
                'points': -2,
                'reason': 'No soda (protective)',
                'priority': 'PROTECTIVE',
                'user_value': q74_val
            })
        
        # Injection drug use - graduated (1 time)
        q55_val = get_num('q55')
        if pd.notna(q55_val) and q55_val == 2:
            score += 30
            explanations.append({
                'feature': 'q55',
                'points': 30,
                'reason': 'Injection drug use (1 time)',
                'priority': 'CRITICAL',
                'user_value': q55_val
            })
        
        # Forced sex - major risk factor
        if get_num('q19') == 1:
            score += 35  # Already added above, but your code adds it again
        
        # Further Combinations
        if get_num('q82') == 1 and get_num('q61') == 3:
            score += 25
            explanations.append({
                'feature': 'q82_q61_combo',
                'points': 25,
                'reason': 'STD testing + no condom',
                'priority': 'HIGH',
                'user_value': f'q82={get_num("q82")}, q61={get_num("q61")}'
            })
        
        # More combinations
        if (get_num('q19') == 1 and get_num('q86') >= 2 and 
            (get_num('q55') >= 2 or get_num('q52') >= 2)):
            score += 40
            explanations.append({
                'feature': 'q19_q86_substance_combo',
                'points': 40,
                'reason': 'Forced sex + housing + substance',
                'priority': 'CRITICAL',
                'user_value': f'q19={get_num("q19")}'
            })
        
        if get_num('q59') >= 3 and get_num('q60') == 2 and get_num('q62') in [2, 8]:
            score += 30
            explanations.append({
                'feature': 'q59_q60_q62_combo',
                'points': 30,
                'reason': 'Multiple partners + substance + no contraception',
                'priority': 'HIGH',
                'user_value': f'q59={get_num("q59")}'
            })
        
        if get_num('q29') >= 2 and (get_num('q44') >= 5 or get_num('q52') >= 2):
            score += 25
            explanations.append({
                'feature': 'q29_substance_combo',
                'points': 25,
                'reason': 'Suicide attempts + substance',
                'priority': 'HIGH',
                'user_value': f'q29={get_num("q29")}'
            })
        
        # ===========================================
        # FINAL STAGE BINNING
        # ===========================================
        # if score <= 25:
        #     stage = 0
        #     stage_reason = "Low Risk (score ≤ 25)"
        # elif score <= 60:
        #     stage = 1
        #     stage_reason = "Moderate Risk (score 26-60)"
        # elif score <= 100:
        #     stage = 2
        #     stage_reason = "High Risk (score 61-100)"
        # else:
        #     stage = 3
        #     stage_reason = "Very High Risk (score > 100)"
        
        explanations.append({
            'feature': 'stage_summary',
            'points': score,
            'reason': f'Total Risk Score: {score:.1f}',
            'priority': 'SUMMARY'
        })
        
        return score, explanations
    
    def _add_points(self, feature, trigger_value, points, row, score, explanations, reason):
        """Add points for a feature with mapping and type conversion"""
        key = self.FEATURE_KEY_MAP.get(feature, feature)
        val = row.get(key)

        if val is not None:
            try:
                if int(val) == int(trigger_value):
                    score += points
                    explanations.append({
                        'feature': feature,
                        'points': points,
                        'reason': reason,
                        'priority': self._get_priority(points),
                        'user_value': val
                    })
            except:
                pass
        return score

    def _get_priority(self, points: float) -> str:
        """
        Determine priority with CORRECT handling of protective factors
        RISK factors: Positive points → address urgently
        PROTECTIVE factors: Negative points → maintain/strengthen
        """
        
        if points > 0:  # RISK FACTOR (needs reduction)
            if points >= 20:
                return 'CRITICAL_RISK'    # 🚨 Address IMMEDIATELY (Weeks 1-2)
            elif points >= 10:
                return 'HIGH_RISK'        # 🔴 Address SOON (Weeks 3-4)
            elif points >= 5:
                return 'MEDIUM_RISK'      # 🟡 Address LATER (Weeks 5-6)
            else:
                return 'LOW_RISK'         # ⚪ Monitor (Weeks 7-8)
        
        elif points < 0:  # PROTECTIVE FACTOR (needs maintenance)
            abs_points = abs(points)
            if abs_points >= 10:
                return 'STRONG_PROTECTIVE'   # 🟢 MAINTAIN STRONGLY (All weeks)
            elif abs_points >= 5:
                return 'MODERATE_PROTECTIVE' # 🟢 MAINTAIN (Most weeks)
            else:
                return 'WEAK_PROTECTIVE'     # 🟢 ENCOURAGE (Some weeks)
        
        else:  # points == 0
            return 'NEUTRAL'  # No action needed

    def get_top_risk_factors(self, explanations: List[Dict], top_n: int = 5) -> List[Dict]:
        """Get top N risk factors"""
        risk_factors = [
            e for e in explanations
            if e.get('points', 0) > 0 and e.get('priority') not in ['PROTECTIVE', 'SUMMARY'] and 'combo' not in e.get('feature', '')
        ]
        risk_factors.sort(key=lambda x: x['points'], reverse=True)
        for factor in risk_factors[:top_n]:
            feature = factor.get('feature')
            if feature in self.feature_info:
                factor['question'] = self.feature_info[feature].get('question', feature)
                factor['category'] = self.feature_info[feature].get('category', 'unknown')
        return risk_factors[:top_n]

    def get_feature_question(self, feature: str) -> str:
        """Return the human-readable question for a feature."""
        info = self.feature_info.get(feature)
        if info and 'question' in info:
            return info['question']
        return feature

    def get_feature_category(self, feature: str) -> str:
        """Return the category for a feature."""
        info = self.feature_info.get(feature)
        if info and 'category' in info:
            return info['category']
        return 'unknown'
    
    def get_readable_value(self, feature: str, value: Any) -> str:
        """Convert numeric to readable text"""
        if feature in self.feature_info:
            options = self.feature_info[feature].get('options', {})
            if isinstance(options, dict) and value is not None:
                str_val = str(int(value))
                return options.get(str_val, f"Value {value}")
        return f"Value {value}"
