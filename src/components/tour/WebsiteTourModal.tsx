import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'wouter';
import { 
  Sparkles, 
  Bot, 
  Film, 
  Youtube, 
  Image as ImageIcon, 
  Music, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Wand2, 
  Minimize2, 
  Zap, 
  ShieldCheck, 
  Compass, 
  RotateCcw,
  Play,
  Copy,
  Download
} from 'lucide-react';
import { sound } from '@/lib/sound';

export interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  highlights: string[];
  route?: string;
  previewType?: 'overview' | 'bot' | 'reels' | 'downloaders' | 'image' | 'sfx';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Prachurjo Studio!',
    subtitle: 'All-in-One Web Utilities & AI Content Hub',
    badge: 'Step 1 • Overview',
    badgeColor: 'bg-primary/20 text-primary border-primary/30',
    icon: Sparkles,
    route: '/',
    description: 'Prachurjo is a supercharged web utilities and AI studio suite. Everything processes 100% locally in your browser with zero server delays, high security, and ultra-fast performance.',
    highlights: [
      '100% Browser Local Processing (Zero Privacy Risk)',
      'Smart AI Bot with Multimodal Chat & Image Generation',
      'TikTok-Style Reels & AI Prompt Library (PTCopy)',
      'High-Speed Image Compressor, Converter & Downloader Tools'
    ],
    previewType: 'overview'
  },
  {
    id: 'smart-bot',
    title: 'Smart AI Bot Mode',
    subtitle: 'Multimodal AI Assistant & Smart Downloader',
    badge: 'Step 2 • AI Assistant',
    badgeColor: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    icon: Bot,
    route: '/smart-bot',
    description: 'Our Smart AI Bot is ready to help! Chat seamlessly, generate stunning AI artwork, search live web data, analyze YouTube/TikTok links, and crop images directly inside the chat.',
    highlights: [
      'Instant Image Generation & Editing in Chat',
      'TikTok & YouTube Media Extraction in 1 Click',
      'Interactive In-Chat Image Cropper & Filters',
      'Persistent Local Memory for Your Workspace'
    ],
    previewType: 'bot'
  },
  {
    id: 'reels-feed',
    title: 'Reels & AI Prompts Feed',
    subtitle: 'TikTok-Style Vertical Feed & PTCopy',
    badge: 'Step 3 • Trending Prompts',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    icon: Film,
    route: '/reels',
    description: 'Watch viral AI video reels in vertical 9:16 format with seamless auto-play on scroll. Copy exact Midjourney & ChatGPT prompts in 1-Click with PTCopy!',
    highlights: [
      'Auto-Playing 9:16 Vertical Video & Photo Player',
      '1-Click PTCopy (Prompt Copy) with Live Stats',
      'Duplicate URL Prevention for Fresh Content',
      'Category Filters: Cinematic, Anime, Realism & Art'
    ],
    previewType: 'reels'
  },
  {
    id: 'youtube-downloaders',
    title: 'YouTube & TikTok Downloaders',
    subtitle: 'No Watermark Video & 4K Thumbnail Extractor',
    badge: 'Step 4 • Media Extractors',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    icon: Youtube,
    route: '/tiktok-downloader',
    description: 'Download TikTok videos without watermark in HD, extract MP3 audio, grab 4K YouTube thumbnails, analyze channel stats, and generate viral titles.',
    highlights: [
      'TikTok Downloader with NO Watermark (1080p)',
      'YouTube HD & 4K Thumbnail Grabber',
      'YouTube Channel & Video AI Analyzer',
      'AI Title & Description Generators'
    ],
    previewType: 'downloaders'
  },
  {
    id: 'image-utilities',
    title: 'High-Speed Image Utilities',
    subtitle: 'Compressor, Cropper & Format Converter',
    badge: 'Step 5 • Image Suite',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: Minimize2,
    route: '/image-compressor',
    description: 'Optimize your images for web speed! Compress images up to 90% with custom quality control, crop with exact aspect ratios, convert to WebP/AVIF, and create Favicons.',
    highlights: [
      'Image Compressor with Multi-Level Lossless Control',
      'Image Format Converter (PNG, WebP, AVIF, JPG)',
      'Precision Crop Tool with Presets & Freehand',
      'Favicon Generator for Web Developers'
    ],
    previewType: 'image'
  },
  {
    id: 'sfx-apis',
    title: '60+ SFX Library & Developer APIs',
    subtitle: 'Studio Sound Effects & REST API Keys',
    badge: 'Step 6 • SFX & Developers',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Music,
    route: '/sound-effects',
    description: 'Access 60+ Studio Sound Effects for video editing & creators, generate free REST API keys for developers, and customize dark/light theme & sound feedback.',
    highlights: [
      '60+ High-Quality SFX Audio Collection (WAV/MP3)',
      'Developer API Keys for External Integration',
      'Action History & Universal Search Directory',
      'Custom Dark/Light Themes & Sound Controllers'
    ],
    previewType: 'sfx'
  }
];

interface WebsiteTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoStarted?: boolean;
}

export function WebsiteTourModal({ isOpen, onClose, autoStarted = false }: WebsiteTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [, setLocation] = useLocation();

  const step = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  // Handle keyboard arrow keys
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      sound.tab();
      setCurrentStepIndex((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1));
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      sound.tab();
      setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleComplete = () => {
    sound.powerUp();
    if (typeof window !== 'undefined') {
      localStorage.setItem('prachurjo_tour_completed', 'true');
    }
    onClose();
  };

  const handleVisitRoute = () => {
    if (step.route) {
      sound.launch();
      setLocation(step.route);
      handleComplete();
    }
  };

  if (!isOpen) return null;

  const StepIcon = step.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
        {/* Backdrop Overlay with Ambient Glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleComplete}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-50 w-full max-w-2xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col"
        >
          {/* Top Header Bar */}
          <div className="p-4 md:p-5 border-b border-border/60 bg-muted/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-foreground leading-tight flex items-center gap-2">
                  Interactive Website Tour
                  {autoStarted && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                      Welcome Guide
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Explore Prachurjo tools, features, and capabilities in seconds
                </p>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Close Tour (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Progress Bar */}
          <div className="w-full bg-muted/40 h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-indigo-500 to-cyan-400"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Modal Body Content */}
          <div className="p-5 md:p-7 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
            {/* Step Header Badge & Step Number */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${step.badgeColor}`}>
                <StepIcon className="w-3.5 h-3.5" />
                {step.badge}
              </span>

              <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
                {currentStepIndex + 1} / {TOUR_STEPS.length} Steps
              </span>
            </div>

            {/* Step Title & Subtitle */}
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
                {step.title}
              </h2>
              <p className="text-xs md:text-sm text-primary font-medium">
                {step.subtitle}
              </p>
            </div>

            {/* Step Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {step.highlights.map((highlight, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-2xl bg-muted/30 border border-border/50 flex items-start gap-2.5 hover:bg-muted/50 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-xs text-foreground/90 font-medium leading-snug">
                    {highlight}
                  </span>
                </div>
              ))}
            </div>

            {/* Custom Mini Visual Preview Widget */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-muted/40 via-muted/20 to-card border border-border/60 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Feature Spotlight Preview</span>
                </div>
                {step.route && (
                  <button
                    onClick={handleVisitRoute}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Open Page <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Preview Content based on Step */}
              {step.previewType === 'overview' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> All-in-One Studio
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> 100% Private
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> High Speed
                  </span>
                </div>
              )}

              {step.previewType === 'bot' && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-card border border-border/60 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-muted-foreground">User: "Generate a futuristic cyberpunk city image"</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-medium flex items-center justify-between">
                    <span>✨ AI Image Generated (1080p WebP)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 font-mono">2.1s</span>
                  </div>
                </div>
              )}

              {step.previewType === 'reels' && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/60 text-xs">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-foreground">Cyberpunk Neon Samurai</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-[11px] flex items-center gap-1">
                    <Copy className="w-3 h-3" /> 1-Click PTCopy
                  </span>
                </div>
              )}

              {step.previewType === 'downloaders' && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/60 text-xs">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-rose-500" />
                    <span className="font-bold text-foreground">TikTok Video Downloader</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                    NO WATERMARK ⚡
                  </span>
                </div>
              )}

              {step.previewType === 'image' && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/60 text-xs">
                  <div className="flex items-center gap-2">
                    <Minimize2 className="w-4 h-4 text-purple-400" />
                    <span className="text-muted-foreground">Original: 4.8MB → Compressed: 520KB</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    -89% Saved
                  </span>
                </div>
              )}

              {step.previewType === 'sfx' && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/60 text-xs">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-foreground">60+ Studio SFX Library</span>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                    Free WAV / MP3
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 md:p-5 border-t border-border/60 bg-muted/30 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleComplete}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1.5 transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 transition-all active:scale-95"
              >
                {isLast ? (
                  <>
                    <span>Finish Tour 🎉</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Next Step</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
