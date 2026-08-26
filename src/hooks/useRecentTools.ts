import { useState, useEffect, useCallback } from 'react';
import { 
  Bot, 
  ImageIcon, 
  Youtube, 
  BarChart3, 
  Video, 
  Sparkles, 
  FileText, 
  Crop, 
  Palette, 
  Type, 
  History, 
  FolderSync,
  Music,
  Key,
  Pin,
  Film,
  LucideIcon
} from 'lucide-react';

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  category: 'ai' | 'youtube' | 'design' | 'utility';
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  features?: string[];
  gradient: string;
}

export const KNOWN_TOOLS: Record<string, ToolDefinition> = {
  'reels': {
    id: 'reels',
    title: 'Reels & Prompts Feed',
    description: 'Clean 9:16 video player with zero clutter and 1-click prompt copying.',
    category: 'ai',
    href: '/reels',
    icon: Film,
    badge: 'NEW 🔥',
    badgeColor: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    gradient: 'from-cyan-500/15 via-blue-500/10 to-transparent'
  },
  'smart-bot': {
    id: 'smart-bot',
    title: 'Smart AI Bot & Hub',
    description: 'Auto-detects YouTube links, converts images, and executes Gemini AI tasks in chat.',
    category: 'ai',
    href: '/smart-bot',
    icon: Bot,
    badge: 'BOT ⚡',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    gradient: 'from-emerald-500/15 via-teal-500/10 to-transparent'
  },
  'image-cropper': {
    id: 'image-cropper',
    title: 'Image Cropper',
    description: 'Crop images to 1:1, 4:3, 16:9 or custom ratios with zoom, rotate & flip.',
    category: 'design',
    href: '/image-cropper',
    icon: Crop,
    badge: 'CROP ✂️',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    gradient: 'from-emerald-500/15 via-green-500/10 to-transparent'
  },
  'thumbnail-downloader': {
    id: 'thumbnail-downloader',
    title: 'Thumbnail Downloader',
    description: 'Extract and download Ultra HD 4K, 1080p, and HD YouTube thumbnails.',
    category: 'youtube',
    href: '/thumbnail-downloader',
    icon: Youtube,
    badge: '4K HD',
    badgeColor: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
    gradient: 'from-red-500/15 via-orange-500/10 to-transparent'
  },
  'pinterest-downloader': {
    id: 'pinterest-downloader',
    title: 'Pinterest Downloader',
    description: 'Download Pinterest videos, reels, stories, or images in premium quality and extract audio.',
    category: 'youtube',
    href: '/pinterest-downloader',
    icon: Pin,
    badge: 'NEW HD 🚀',
    badgeColor: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
    gradient: 'from-red-500/15 via-pink-500/10 to-transparent'
  },
  'image-compressor': {
    id: 'image-compressor',
    title: 'Image Compressor',
    description: 'Compress PNG, JPG, WebP images in-browser up to 10MB with quality slider.',
    category: 'design',
    href: '/image-compressor',
    icon: ImageIcon,
    badge: '10MB ⚡',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    gradient: 'from-emerald-500/15 via-teal-500/10 to-transparent'
  },
  'channel-analyzer': {
    id: 'channel-analyzer',
    title: 'Channel Analyzer',
    description: 'Track YouTube channel stats, growth projections, and Gemini AI audits.',
    category: 'youtube',
    href: '/channel-analyzer',
    icon: BarChart3,
    badge: 'AUDIT 🤖',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
    gradient: 'from-blue-500/15 via-cyan-500/10 to-transparent'
  },
  'video-analyzer': {
    id: 'video-analyzer',
    title: 'Video & SEO Inspector',
    description: 'Extract hidden YouTube tags, calculate engagement rates, and optimize SEO.',
    category: 'youtube',
    href: '/video-analyzer',
    icon: Video,
    badge: 'SEO',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    gradient: 'from-emerald-500/15 via-teal-500/10 to-transparent'
  },
  'title-generator': {
    id: 'title-generator',
    title: 'AI Title Generator',
    description: 'Generate high CTR, click-worthy video titles with viral formulas.',
    category: 'ai',
    href: '/title-generator',
    icon: Sparkles,
    badge: 'HIGH CTR',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    gradient: 'from-amber-500/15 via-yellow-500/10 to-transparent'
  },
  'description-generator': {
    id: 'description-generator',
    title: 'AI Description Generator',
    description: 'Generate SEO rich descriptions with timestamps and social templates.',
    category: 'ai',
    href: '/description-generator',
    icon: FileText,
    badge: 'SEO',
    badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    gradient: 'from-indigo-500/15 via-purple-500/10 to-transparent'
  },
  'image-converter': {
    id: 'image-converter',
    title: 'Image Converter',
    description: 'Convert between PNG, JPG, WebP, AVIF, and BMP formats instantly.',
    category: 'design',
    href: '/image-converter',
    icon: FolderSync,
    badge: '5 FORMATS',
    badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20',
    gradient: 'from-teal-500/15 via-cyan-500/10 to-transparent'
  },
  'favicon-generator': {
    id: 'favicon-generator',
    title: 'Favicon Generator',
    description: 'Generate multi-resolution favicon packages and HTML icons.',
    category: 'design',
    href: '/favicon-generator',
    icon: Palette,
    badge: 'ICONS',
    badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
    gradient: 'from-rose-500/15 via-pink-500/10 to-transparent'
  },
  'text-tools': {
    id: 'text-tools',
    title: 'Text Utilities',
    description: 'Convert case, generate URL slugs, and count words & reading time.',
    category: 'utility',
    href: '/text-tools',
    icon: Type,
    badge: 'TEXT',
    badgeColor: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20',
    gradient: 'from-slate-500/15 via-gray-500/10 to-transparent'
  },
  'sound-effects': {
    id: 'sound-effects',
    title: 'SFX & Audio Studio',
    description: 'Explore 60+ royalty-free studio audio effects, risers, and WAV downloads.',
    category: 'utility',
    href: '/sound-effects',
    icon: Music,
    badge: '60+ SFX',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    gradient: 'from-amber-500/15 via-purple-500/10 to-transparent'
  },
  'api-keys': {
    id: 'api-keys',
    title: 'Developer API Hub',
    description: 'Generate private API keys, inspect rate limits, and access live REST APIs.',
    category: 'utility',
    href: '/api-keys',
    icon: Key,
    badge: 'REST v1',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
    gradient: 'from-blue-500/15 via-indigo-500/10 to-transparent'
  },
  'history': {
    id: 'history',
    title: 'Activity History',
    description: 'Review your analyzed videos, downloaded media, and action logs.',
    category: 'utility',
    href: '/history',
    icon: History,
    badge: 'HISTORY',
    badgeColor: 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
    gradient: 'from-neutral-500/15 via-stone-500/10 to-transparent'
  }
};

export interface RecentToolEntry {
  toolId: string;
  lastUsed: number;
  count: number;
}

export interface ResolvedRecentTool extends ToolDefinition {
  lastUsed: number;
  timeAgo: string;
  count: number;
}

const STORAGE_KEY = 'prachurjo_recent_tools';
const MAX_RECENT_TOOLS = 8;

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function useRecentTools() {
  const [recentEntries, setRecentEntries] = useState<RecentToolEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to read recent tools from storage', e);
    }
    return [];
  });

  // Keep state in sync across tabs and re-renders
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setRecentEntries(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const recordToolUsage = useCallback((toolIdOrHref: string) => {
    let cleanId = toolIdOrHref.replace(/^\//, '').split('/')[0];
    if (cleanId === 'crop-image') cleanId = 'image-cropper';
    if (cleanId === 'compress-image') cleanId = 'image-compressor';
    if (cleanId === 'sfx' || cleanId === 'sounds') cleanId = 'sound-effects';
    if (cleanId === 'tools' || cleanId === 'menu') return;

    if (!KNOWN_TOOLS[cleanId]) return;

    setRecentEntries((prev) => {
      const existingIdx = prev.findIndex((entry) => entry.toolId === cleanId);
      let updated: RecentToolEntry[];

      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const newEntry: RecentToolEntry = {
          toolId: cleanId,
          lastUsed: Date.now(),
          count: (existing.count || 1) + 1,
        };
        updated = [newEntry, ...prev.filter((_, idx) => idx !== existingIdx)].slice(0, MAX_RECENT_TOOLS);
      } else {
        const newEntry: RecentToolEntry = {
          toolId: cleanId,
          lastUsed: Date.now(),
          count: 1,
        };
        updated = [newEntry, ...prev].slice(0, MAX_RECENT_TOOLS);
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save recent tools', e);
      }
      return updated;
    });
  }, []);

  const removeRecentTool = useCallback((toolId: string) => {
    setRecentEntries((prev) => {
      const filtered = prev.filter((item) => item.toolId !== toolId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {
        console.error('Failed to update recent tools', e);
      }
      return filtered;
    });
  }, []);

  const clearRecentTools = useCallback(() => {
    setRecentEntries([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear recent tools', e);
    }
  }, []);

  // Resolve entries into full tool objects with metadata
  const recentTools: ResolvedRecentTool[] = recentEntries
    .filter((entry) => Boolean(KNOWN_TOOLS[entry.toolId]))
    .map((entry) => {
      const def = KNOWN_TOOLS[entry.toolId];
      return {
        ...def,
        lastUsed: entry.lastUsed,
        timeAgo: formatTimeAgo(entry.lastUsed),
        count: entry.count || 1,
      };
    });

  return {
    recentTools,
    recentEntries,
    recordToolUsage,
    removeRecentTool,
    clearRecentTools,
  };
}
