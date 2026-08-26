export type ReelMediaType = 'video' | 'photo' | 'live_photo';

export interface ReelPost {
  id: string;
  title: string;
  tiktok_url: string;
  media_type: ReelMediaType;
  stream_url: string;
  cover_url?: string;
  images?: string[];
  category: string;
  prompt_text?: string;
  description?: string;
  copy_count: number;
  likes_count: number;
  tiktok_likes?: number;
  website_likes?: number;
  author_name?: string;
  author_id?: string;
  author_avatar?: string;
  created_at: string;
  duration?: number;
  music_title?: string;
  music_url?: string;
  aspect_ratio?: '9:16' | '16:9' | '1:1' | 'auto';
}

export type MainReelTab = 'video_edit' | 'prompt' | 'explore';

export const REELS_CATEGORIES = [
  'All',
  'AI Prompts',
  'Video Editing',
  'CapCut Templates',
  'Viral Songs & Audio',
  'Cinematic & VFX',
  'Photography',
  '3D & Blender',
  'Color Grading'
] as const;

export type ReelCategory = typeof REELS_CATEGORIES[number];
