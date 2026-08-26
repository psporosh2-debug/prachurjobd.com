import { createClient } from '@supabase/supabase-js';

// Direct Supabase API Configuration
export const SUPABASE_URL = 'https://lnnybhnislyikisbxtza.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_ntKb2CWpUxxW6a02AO1hSQ_blhIH3g5';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface PromptItem {
  id: string;
  title: string;
  prompt: string;
  negative_prompt?: string;
  category: string;
  image_url: string;
  model?: string;
  aspect_ratio?: string;
  tags?: string[];
  likes_count: number;
  created_at: string;
  author_name?: string;
  author_id?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  twitter_url?: string;
  instagram_url?: string;
  github_url?: string;
  website_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const PROMPT_CATEGORIES = [
  'All',
  'Anime',
  'Realistic',
  'Cartoon',
  'Art & Painting',
  '3D Render',
  'Fantasy',
  'Cyberpunk',
  'Photography',
  'Sci-Fi'
];

