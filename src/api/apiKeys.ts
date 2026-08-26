// Centralized API Keys and Integration Configurations
// Hardcoded primary keys so website deployments (static hosting, Vercel, Netlify, GitHub Pages) work seamlessly without .env dependency.

export const API_CONFIG = {
  // Primary YouTube Data API v3 Key
  youtubeApiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_YOUTUBE_API_KEY)
    ? import.meta.env.VITE_YOUTUBE_API_KEY
    : 'AIzaSyAg9E9e1UEg8PEGCSqU7l1nI5pzCmlLWvg',

  // Gemini AI Key (Environment configuration)
  geminiApiKey: (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY)
    ? process.env.GEMINI_API_KEY
    : (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY || '' : ''),
  
  // Supabase Configuration
  supabaseUrl: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL || '' : '',
  supabaseAnonKey: typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY || '' : '',
};

export const getApiKeyStatus = () => {
  return {
    hasYoutubeKey: Boolean(API_CONFIG.youtubeApiKey),
    hasGeminiKey: Boolean(API_CONFIG.geminiApiKey),
    hasSupabaseUrl: Boolean(API_CONFIG.supabaseUrl),
  };
};

