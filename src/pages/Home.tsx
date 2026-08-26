import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { 
  Sparkles, 
  Youtube, 
  Image as ImageIcon, 
  BarChart3, 
  Video, 
  FileText, 
  Palette, 
  Type, 
  History, 
  Search, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  Bot,
  Crop,
  Sliders,
  X,
  Layers,
  Music,
  Key,
  Pin,
  Instagram,
  Film
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { sound } from '@/lib/sound';
import { RecentlyUsedTools } from '@/components/RecentlyUsedTools';
import { useRecentTools } from '@/hooks/useRecentTools';
import { SmartBotTour, TourReplayButton } from '@/components/SmartBotTour';

interface ToolItem {
  id: string;
  title: string;
  description: string;
  category: 'ai' | 'youtube' | 'design' | 'utility';
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeType?: 'primary' | 'red' | 'purple' | 'emerald' | 'amber' | 'neutral';
  tags: string[];
}

const TOOLS_LIST: ToolItem[] = [
  {
    id: 'reels-feed',
    title: 'TikTok Reels & Prompts Feed',
    description: 'Clean 9:16 video player with zero clutter, direct video stream, and 1-Click Prompt / Formula Copying.',
    category: 'ai',
    href: '/reels',
    icon: Film,
    badge: 'NEW 🔥',
    badgeType: 'purple',
    tags: ['Clean 9:16 Player', '1-Click Copy', 'AI & Video Edit']
  },
  {
    id: 'smart-bot',
    title: 'Smart AI Bot & Automation',
    description: 'Auto-detects YouTube links for tags & thumbnails, converts images, and answers with persistent memory.',
    category: 'ai',
    href: '/smart-bot',
    icon: Bot,
    badge: 'AI BOT ⚡',
    badgeType: 'emerald',
    tags: ['YouTube Link Detect', 'Image Converter', 'Memory']
  },
  {
    id: 'tiktok-downloader',
    title: 'TikTok Video Downloader (No Watermark)',
    description: 'Download TikTok videos without watermark in Full HD, extract MP3 background music and HD cover photos.',
    category: 'youtube',
    href: '/tiktok-downloader',
    icon: Video,
    badge: 'HOT 🔥',
    badgeType: 'emerald',
    tags: ['No Watermark', 'HD MP4 & MP3', 'Photo Slideshows']
  },
  {
    id: 'thumbnail-downloader',
    title: 'YouTube Thumbnail Downloader',
    description: 'Download MaxRes 4K, 1080p, and HD thumbnails from any YouTube video or Shorts link.',
    category: 'youtube',
    href: '/thumbnail-downloader',
    icon: Youtube,
    badge: 'POPULAR',
    badgeType: 'red',
    tags: ['4K Ultra HD', 'Shorts & Videos', '1-Click Save']
  },
  {
    id: 'channel-analyzer',
    title: 'Channel Analyzer & AI Audit',
    description: 'Analyze YouTube channel subscribers, views, video uploads, and get Gemini AI growth audits.',
    category: 'youtube',
    href: '/channel-analyzer',
    icon: BarChart3,
    badge: 'AI AUDIT',
    badgeType: 'primary',
    tags: ['Live Analytics', 'Gemini AI Tips', 'Competitor Check']
  },
  {
    id: 'video-analyzer',
    title: 'YouTube Video & SEO Inspector',
    description: 'Extract hidden search tags, engagement metrics, SEO scores, and optimize ranking metadata.',
    category: 'youtube',
    href: '/video-analyzer',
    icon: Video,
    tags: ['Hidden Tags', 'SEO Ranking', 'Metadata']
  },
  {
    id: 'title-generator',
    title: 'AI YouTube Title Generator',
    description: 'Generate high-converting, viral video titles designed to maximize CTR and impressions.',
    category: 'ai',
    href: '/title-generator',
    icon: Sparkles,
    badge: 'HIGH CTR',
    badgeType: 'amber',
    tags: ['5+ Formulas', 'Click Triggers', 'Multi-Language']
  },
  {
    id: 'description-generator',
    title: 'AI Video Description Generator',
    description: 'Create complete SEO descriptions with auto-generated timestamps, tags, and affiliate formats.',
    category: 'ai',
    href: '/description-generator',
    icon: FileText,
    tags: ['Timestamps', 'Keywords', 'Social Templates']
  },
  {
    id: 'image-cropper',
    title: 'Image Cropper (ইমেজ ক্রপ)',
    description: 'Crop images with free-form or preset ratios (1:1, 4:3, 16:9, 9:16) with zoom and rotate.',
    category: 'design',
    href: '/image-cropper',
    icon: Crop,
    badge: 'EASY CROP',
    badgeType: 'emerald',
    tags: ['Aspect Presets', 'Zoom & Rotate', 'Instant Export']
  },
  {
    id: 'image-compressor',
    title: 'Image Compressor & Optimizer',
    description: 'Compress PNG, JPG, and WebP files up to 10MB in browser while keeping visual clarity.',
    category: 'design',
    href: '/image-compressor',
    icon: ImageIcon,
    tags: ['Quality Slider', 'Fast Resizing', '10MB Limit']
  },
  {
    id: 'image-converter',
    title: 'Image Format Converter',
    description: 'Convert between PNG, JPG, WebP, AVIF, and BMP formats instantly in your browser.',
    category: 'design',
    href: '/image-converter',
    icon: ImageIcon,
    tags: ['WebP & AVIF', 'High Fidelity', 'Lossless Mode']
  },
  {
    id: 'favicon-generator',
    title: 'Favicon & App Icon Generator',
    description: 'Generate multi-resolution favicon packages (16x16 to 512x512) and HTML header code.',
    category: 'design',
    href: '/favicon-generator',
    icon: Palette,
    tags: ['Multi-Res ZIP', 'Apple Touch', 'HTML Snippet']
  },
  {
    id: 'text-tools',
    title: 'Text & String Utilities',
    description: 'Case converter (Title, Camel, Upper), clean URL slug generator, and live word counter.',
    category: 'utility',
    href: '/text-tools',
    icon: Type,
    tags: ['Word Counter', 'Case Convert', 'Slug Generator']
  },
  {
    id: 'sound-effects',
    title: 'SFX & Audio Studio (SFX 50+ Pack)',
    description: 'Explore 60+ royalty-free studio audio effects, risers, sub-bass hits, sci-fi zaps & 1-click WAV downloads.',
    category: 'utility',
    href: '/sound-effects',
    icon: Music,
    badge: '60+ SFX',
    badgeType: 'purple',
    tags: ['SFX 50+ Pack', '1-Click Preview', 'Free WAV Download']
  },
  {
    id: 'api-keys',
    title: 'Developer API & Keys Hub',
    description: 'Generate secure API keys, test endpoints in interactive sandbox, and integrate Prachurjo APIs into your apps.',
    category: 'utility',
    href: '/api-keys',
    icon: Key,
    badge: 'REST v1',
    badgeType: 'purple',
    tags: ['Secret Keys', 'Live Sandbox', 'Python/JS SDK']
  },
  {
    id: 'history',
    title: 'Activity & History Tracker',
    description: 'Review your recent analysis, downloaded media, and tool usage logs privately.',
    category: 'utility',
    href: '/history',
    icon: History,
    tags: ['Private Logs', '1-Click Reopen', 'Local Storage']
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Tools', icon: Layers },
  { id: 'ai', label: 'AI Tools', icon: Sparkles },
  { id: 'youtube', label: 'YouTube & SEO', icon: Youtube },
  { id: 'design', label: 'Image & Design', icon: ImageIcon },
  { id: 'utility', label: 'Utilities', icon: Sliders },
] as const;

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'ai' | 'youtube' | 'design' | 'utility'>('all');
  const [isTourManualOpen, setIsTourManualOpen] = useState(false);
  const { recordToolUsage } = useRecentTools();

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return TOOLS_LIST.filter(tool => {
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      if (!matchesCategory) return false;
      if (!query) return true;
      return (
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.tags.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, activeCategory]);

  const getBadgeClass = (type?: string) => {
    switch (type) {
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'red':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'primary':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getIconColor = (category: string) => {
    switch (category) {
      case 'youtube':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'ai':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'design':
        return 'text-teal-500 bg-teal-500/10 border-teal-500/20';
      default:
        return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-4 space-y-6 pb-12">
      
      {/* ─── 1. MINIMAL & COMPACT HERO HEADER ──────────────────────────── */}
      <div className="p-5 sm:p-7 rounded-2xl bg-card border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Prachurjo Studio
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                100% Free
              </span>
              <TourReplayButton onClick={() => setIsTourManualOpen(true)} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Fast, lightweight creator tools for YouTube, media automation, and graphics.
            </p>
          </div>

          {/* Quick Smart Bot Launcher Button */}
          <Link
            id="hero-smart-bot-btn"
            href="/smart-bot"
            onClick={() => sound.click()}
            className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold transition-colors shadow-xs"
          >
            <Bot className="w-4 h-4 text-emerald-500" />
            <span>Open Smart AI Bot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Minimal Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tools (e.g. thumbnail, tiktok, crop, tags, title)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                sound.clear();
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── 2. RECENTLY USED TOOLS (COMPACT) ─────────────────────────── */}
      <RecentlyUsedTools />

      {/* ─── 3. CLEAN CATEGORY FILTER CHIPS ───────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            const count = cat.id === 'all' 
              ? TOOLS_LIST.length 
              : TOOLS_LIST.filter(t => t.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  sound.click();
                  setActiveCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-foreground text-background shadow-xs'
                    : 'bg-card border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isActive ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-muted-foreground">
          Showing <b className="text-foreground">{filteredTools.length}</b> tools
        </span>
      </div>

      {/* ─── 4. SIMPLE, FAST-LOADING TOOLS GRID ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              id={`tool-${tool.id}`}
              href={tool.href}
              onClick={() => {
                sound.click();
                recordToolUsage(tool.id);
              }}
              className="group block p-4 rounded-xl bg-card border hover:border-primary/40 hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${getIconColor(tool.category)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {tool.badge && (
                  <Badge variant="outline" className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${getBadgeClass(tool.badgeType)}`}>
                    {tool.badge}
                  </Badge>
                )}
              </div>

              <h2 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                <span>{tool.title}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary shrink-0 ml-1" />
              </h2>

              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {tool.description}
              </p>

              {/* Minimal Tag Pills */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-border/50">
                {tool.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty Search State */}
      {filteredTools.length === 0 && (
        <div className="p-8 rounded-2xl border border-dashed text-center bg-card space-y-3">
          <p className="text-sm font-semibold text-foreground">No tools found matching "{searchQuery}"</p>
          <p className="text-xs text-muted-foreground">Try typing a different keyword or reset filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ─── 5. MINIMAL TRUST & FAST INFO FOOTER ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-card border flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Instant In-Browser</p>
            <p className="text-[11px] text-muted-foreground truncate">0 waiting queues or lag</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">100% Free & Private</p>
            <p className="text-[11px] text-muted-foreground truncate">No sign-up required</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-card border col-span-2 sm:col-span-1 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Gemini 3.7 Intelligence</p>
            <p className="text-[11px] text-muted-foreground truncate">Smart audits & automation</p>
          </div>
        </div>
      </div>

      {/* ─── 6. INTERACTIVE ONBOARDING TOUR FOR SMART BOT ──────────────── */}
      <SmartBotTour 
        forceOpen={isTourManualOpen} 
        onClose={() => setIsTourManualOpen(false)} 
      />

    </div>
  );
}
