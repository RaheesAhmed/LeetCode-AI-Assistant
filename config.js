// Default configuration for the extension
const DEFAULT_CONFIG = {
  // Default AI provider
  aiProvider: 'openai',
  
  // Default assistance type
  assistanceType: 'hint',
  
  // OpenAI settings
  openai: {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2000
  },
  
  // Google Gemini settings
  gemini: {
    model: 'gemini-2.0-flash-thinking-exp-01-21',
    temperature: 0.7,
    maxOutputTokens: 2000
  }
};

// Export the configuration
if (typeof module !== 'undefined') {
  module.exports = { DEFAULT_CONFIG };
}
