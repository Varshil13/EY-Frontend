// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    CHAT: '/chat',
    RECOMMENDATIONS: '/recommendations',
    CLEAR_RECOMMENDATIONS: '/clear-recommendations',
    APPLY: '/apply',
    APPLIED_LOANS: '/applied-loans',
    UPDATE_PROFILE: '/update-profile',
    USERS: '/users'
  }
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: string): string => {
  const baseUrl = API_CONFIG.BASE_URL;
  const fullEndpoint = params ? `${endpoint}/${params}` : endpoint;
  return `${baseUrl}${fullEndpoint}`;
};