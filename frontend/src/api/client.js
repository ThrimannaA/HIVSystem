// Change this to your API URL
// const API_BASE_URL = 'http://10.193.236.14:8000';
const API_BASE_URL = 'https://keely-unresourceful-streamingly.ngrok-free.dev';

export const HIVApi = {
  /**
   * Fetches the feature definitions to build the questionnaire
   */
  getSchema: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/schema`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch schema:', error);
      throw error;
    }
  },

  /**
   * Sends user answers to the Python backend for risk assessment
   * @param {Object} userData - Key-value pairs of feature names and numeric answers
   * @param {string} language - 'en', 'si', or 'ta'
   * @param {string} culture - The cultural context string
   */
  assessRisk: async (
    userData,
    language = 'en',
    culture = 'English-speaking',
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        // Matches the UserInput Pydantic model in your api.py
        body: JSON.stringify({
          data: userData,
          preferred_language: language,
          preferred_culture: culture,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.detail || 'Assessment failed');
      }

      return json.result; // Returns the processed result from backend.process_user()
    } catch (error) {
      console.error('Assessment Error:', error);
      throw error;
    }
  },
  saveAssessment: async (userId, riskScore, riskLevel, factors) => {
    try {
      const response = await fetch(`${API_BASE_URL}/save_assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          score: riskScore,
          level: riskLevel,
          factors: factors,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error saving assessment:', error);
    }
  },

  getHistory: async userId => {
    try {
      const response = await fetch(`${API_BASE_URL}/history/${userId}`);
      if (!response.ok) return []; // Return empty array if request fails
      const data = await response.json();
      return Array.isArray(data) ? data : []; // Force return an array
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  },
};
