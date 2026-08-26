// Centralized TypeScript Type Definitions for Prachurjo Tools

export interface NavigationItem {
  name: string;
  href: string;
  icon?: string;
  description?: string;
}

export interface ThumbnailItem {
  quality: string;
  url: string;
  width: string;
  height: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ApiConfig {
  geminiApiKey?: string;
  youtubeApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface ChannelAnalysisData {
  id: string;
  title: string;
  handle: string;
  description: string;
  customUrl: string;
  directUrl: string;
  publishedAt: string;
  accountAge: string;
  country: string;
  defaultLanguage: string;
  bannerUrl: string;
  logoUrl: string;
  subscribersCount: number;
  videoCount: number;
  viewCount: number;
  avgViewsPerVideo: number;
  keywords: string[];
  socialLinks: { title?: string; url: string; domain: string }[];
  topicCategories: string[];
  unsubscribedTrailerId?: string;
  trailerUrl?: string;
  madeForKids: boolean;
  privacyStatus: string;
  successRate: number; // calculated percentage 0-100%
  isActive: boolean; // recent video within 30-60 days
  lastActivityDate?: string;
  topVideos: {
    id: string;
    title: string;
    thumbnail: string;
    viewCount: number;
    publishedAt: string;
    url: string;
  }[];
  fromCache?: boolean;
  cachedAt?: string;
}

export interface VideoAnalysisData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  thumbnails: ThumbnailItem[];
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
  channelId: string;
  channelTitle: string;
  categoryId: string;
  categoryName: string;
  duration: string;
  durationISO: string;
  definition: string;
  dimension: string;
  caption: string;
  licensedContent: boolean;
  defaultAudioLanguage: string;
  defaultLanguage: string;
  tags: string[];
  hashtags: string[];
  keywords: string[];
  extractedLinks: { title?: string; url: string; domain: string }[];
  topicCategories: string[];
  embeddable: boolean;
  privacyStatus: string;
  fromCache?: boolean;
  cachedAt?: string;
}
