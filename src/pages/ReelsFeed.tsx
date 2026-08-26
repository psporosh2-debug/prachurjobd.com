import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft,
  Sparkles, 
  Film, 
  Music2,
  X,
  SlidersHorizontal,
  Flame,
  Volume2,
  VolumeX,
  Layers,
  Wand2,
  Compass,
  Video,
  RefreshCw
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { ReelPost, MainReelTab, ReelCategory, REELS_CATEGORIES } from '@/types/reels';
import { ReelCustomPlayer } from '@/components/reels/ReelCustomPlayer';
import { ReelSideActions } from '@/components/reels/ReelSideActions';
import { ReelInfoModal } from '@/components/reels/ReelInfoModal';
import { UploadReelModal } from '@/components/reels/UploadReelModal';
import { deduplicateReelsList } from '@/lib/reelsDeduplication';
import { extractTikTokVideo } from '@/api/tiktokApi';
import { supabase } from '@/lib/supabase';
import { soundEffects } from '@/lib/sound';
import { useToast } from '@/hooks/use-toast';

export default function ReelsFeed() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [reels, setReels] = useState<ReelPost[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [swipeDirection, setSwipeDirection] = useState<'next' | 'prev'>('next');
  const [activeTab, setActiveTab] = useState<MainReelTab>('explore');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedDescription, setExpandedDescription] = useState<boolean>(false);

  // Modals (No auth requirement for uploading)
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [infoReel, setInfoReel] = useState<ReelPost | null>(null);

  // Touch & Swipe tracking
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const isNavigatingRef = useRef<boolean>(false);

  // 1. Load ONLY Real Data directly from Supabase reels_posts table
  const loadReels = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('reels_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase reels_posts query error:', error);
        toast({
          title: 'Database connection issue',
          description: error.message || 'Could not fetch reels from database',
          variant: 'destructive',
        });
        setReels([]);
      } else if (data) {
        // Render purely real database records
        const unique = deduplicateReelsList(data as ReelPost[]);
        setReels(unique);

        // Async background sync of original TikTok likes count and photo audio/music if unpopulated
        unique.forEach(async (reel) => {
          const needsLikesSync = (reel.tiktok_likes === undefined || reel.tiktok_likes === null || reel.tiktok_likes === 0) && reel.tiktok_url;
          const isPhoto = reel.media_type === 'photo' || (Array.isArray(reel.images) && reel.images.length > 0);
          const needsMusicSync = (isPhoto || !reel.music_url) && reel.tiktok_url;

          if (needsLikesSync || needsMusicSync) {
            try {
              const res = await extractTikTokVideo(reel.tiktok_url);
              if (res.success && res.data) {
                const originalLikes = res.data.stats?.diggCount || reel.tiktok_likes || 0;
                const totalLikesNew = originalLikes + (reel.website_likes || 0);
                const fetchedAudioUrl = res.data.audioUrl || reel.music_url || '';
                const fetchedMusicTitle = res.data.musicInfo?.title || reel.music_title || '';
                const fetchedImages = res.data.images || reel.images || [];
                const fetchedMediaType = (res.data.isSlideShow || fetchedImages.length > 0) ? 'photo' : (reel.media_type || 'video');

                setReels(prev => prev.map(r => r.id === reel.id ? { 
                  ...r, 
                  tiktok_likes: originalLikes, 
                  likes_count: totalLikesNew,
                  music_url: r.music_url || fetchedAudioUrl,
                  music_title: r.music_title || fetchedMusicTitle,
                  media_type: fetchedMediaType,
                  images: (r.images && r.images.length > 0) ? r.images : fetchedImages
                } : r));

                await supabase.from('reels_posts').update({ 
                  tiktok_likes: originalLikes,
                  likes_count: totalLikesNew,
                  music_url: reel.music_url || fetchedAudioUrl || null,
                  music_title: reel.music_title || fetchedMusicTitle || null,
                  media_type: fetchedMediaType,
                  images: (reel.images && reel.images.length > 0) ? reel.images : fetchedImages
                }).eq('id', reel.id);
              }
            } catch {
              // Ignore background sync errors
            }
          }
        });
      }
    } catch (err: any) {
      console.error('Error fetching reels_posts:', err);
      setReels([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadReels();

    // Supabase real-time updates for reels_posts table
    const channel = supabase
      .channel('realtime_reels_posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reels_posts' },
        (payload) => {
          console.log('Realtime reels_posts update:', payload);
          loadReels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadReels]);

  // 2. Filtered Reels by Top Tab & Search
  const filteredReels = useMemo(() => {
    return reels.filter((reel) => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === 'video_edit') {
        matchesTab =
          (reel.category && (
            reel.category.toLowerCase().includes('video') ||
            reel.category.toLowerCase().includes('capcut') ||
            reel.category.toLowerCase().includes('vfx') ||
            reel.category.toLowerCase().includes('color')
          )) || false;
      } else if (activeTab === 'prompt') {
        matchesTab =
          (reel.category && (
            reel.category.toLowerCase().includes('prompt') ||
            reel.category.toLowerCase().includes('photo') ||
            reel.category.toLowerCase().includes('blender') ||
            reel.category.toLowerCase().includes('3d')
          )) || false;
      }

      // Sub-category filter (if not 'All')
      const matchesSubCat =
        selectedSubCategory === 'All' ||
        (reel.category && reel.category.toLowerCase() === selectedSubCategory.toLowerCase());

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (reel.title && reel.title.toLowerCase().includes(q)) ||
        (reel.prompt_text && reel.prompt_text.toLowerCase().includes(q)) ||
        (reel.category && reel.category.toLowerCase().includes(q)) ||
        (reel.author_name && reel.author_name.toLowerCase().includes(q));

      return matchesTab && matchesSubCat && matchesSearch;
    });
  }, [reels, activeTab, selectedSubCategory, searchQuery]);

  // Reset index if filtered list shrinks
  useEffect(() => {
    if (currentIndex >= filteredReels.length && filteredReels.length > 0) {
      setCurrentIndex(0);
    }
  }, [filteredReels.length, currentIndex]);

  // Next / Prev Reel Handlers
  const handleNextReel = useCallback(() => {
    if (isNavigatingRef.current) return;
    if (currentIndex < filteredReels.length - 1) {
      isNavigatingRef.current = true;
      setSwipeDirection('next');
      setCurrentIndex((prev) => prev + 1);
      setExpandedDescription(false);
      soundEffects.play('tick');
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 350);
    }
  }, [currentIndex, filteredReels.length]);

  const handlePrevReel = useCallback(() => {
    if (isNavigatingRef.current) return;
    if (currentIndex > 0) {
      isNavigatingRef.current = true;
      setSwipeDirection('prev');
      setCurrentIndex((prev) => prev - 1);
      setExpandedDescription(false);
      soundEffects.play('tick');
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 350);
    }
  }, [currentIndex]);

  // Keyboard navigation (ArrowUp, ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        handleNextReel();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        handlePrevReel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextReel, handlePrevReel]);

  // Touch Swipe Handling (TikTok mobile feel with overscroll prevention)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
    // Prevent browser pull-to-refresh on mobile Chrome
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartY.current || !touchEndY.current) return;
    const distance = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped UP -> Next Reel
      handleNextReel();
    } else if (distance < -minSwipeDistance) {
      // Swiped DOWN -> Prev Reel
      handlePrevReel();
    }

    touchStartY.current = null;
    touchEndY.current = null;
  };

  // Mouse Wheel Handling
  const wheelLockRef = useRef<boolean>(false);
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelLockRef.current) return;

    if (e.deltaY > 35) {
      wheelLockRef.current = true;
      handleNextReel();
      setTimeout(() => {
        wheelLockRef.current = false;
      }, 500);
    } else if (e.deltaY < -35) {
      wheelLockRef.current = true;
      handlePrevReel();
      setTimeout(() => {
        wheelLockRef.current = false;
      }, 500);
    }
  };

  // Live Copy Sync
  const handleCopySuccess = async (reelId: string, newCount: number) => {
    setReels((prev) =>
      prev.map((r) => (r.id === reelId ? { ...r, copy_count: newCount } : r))
    );
    try {
      await supabase.from('reels_posts').update({ copy_count: newCount }).eq('id', reelId);
    } catch (err) {
      console.warn('Could not update copy_count on reels_posts:', err);
    }
  };

  // Live Like Sync
  const handleLikeToggle = async (reelId: string, newCount: number) => {
    setReels((prev) =>
      prev.map((r) => (r.id === reelId ? { ...r, likes_count: newCount } : r))
    );
    try {
      await supabase.from('reels_posts').update({ likes_count: newCount }).eq('id', reelId);
    } catch (err) {
      console.warn('Could not update likes_count on reels_posts:', err);
    }
  };

  const handleReelAdded = (newReel: ReelPost) => {
    setReels((prev) => [newReel, ...prev.filter(r => r.id !== newReel.id)]);
    setActiveTab('explore');
    setSelectedSubCategory('All');
    setCurrentIndex(0);
  };

  const activeReel = filteredReels[currentIndex];

  return (
    <div 
      className="fixed inset-0 w-full h-full h-[100dvh] bg-black text-white overflow-hidden flex items-center justify-center select-none touch-none overscroll-none z-30"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. TOP OVERLAY HEADER (Back Button + Middle Tabs + Upload & Search) */}
      <div className="absolute top-0 inset-x-0 pt-3 pb-6 px-3 sm:px-6 bg-gradient-to-b from-black/85 via-black/40 to-transparent z-40 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
          {/* Top Left: Back Icon (<) to Home */}
          <Link
            href="/"
            onClick={() => soundEffects.play('click')}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
            title="Back to Home Hub"
          >
            <ChevronLeft className="w-6 h-6 -translate-x-0.5" />
          </Link>

          {/* Top Middle: Tabs (Video Edit | Prompt | Explore) */}
          <div className="flex items-center gap-4 sm:gap-6 text-sm sm:text-base font-bold">
            {/* Video Edit Tab */}
            <button
              onClick={() => {
                setActiveTab('video_edit');
                setCurrentIndex(0);
                soundEffects.play('tab');
              }}
              className={`relative py-1 transition-all flex items-center gap-1.5 ${
                activeTab === 'video_edit'
                  ? 'text-white font-extrabold scale-105'
                  : 'text-white/60 hover:text-white/90 font-semibold'
              }`}
            >
              <span>Video Edit</span>
              {activeTab === 'video_edit' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              )}
            </button>

            {/* Prompt Tab */}
            <button
              onClick={() => {
                setActiveTab('prompt');
                setCurrentIndex(0);
                soundEffects.play('tab');
              }}
              className={`relative py-1 transition-all flex items-center gap-1.5 ${
                activeTab === 'prompt'
                  ? 'text-white font-extrabold scale-105'
                  : 'text-white/60 hover:text-white/90 font-semibold'
              }`}
            >
              <span>Prompt</span>
              {activeTab === 'prompt' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              )}
            </button>

            {/* Explore Tab */}
            <button
              onClick={() => {
                setActiveTab('explore');
                setCurrentIndex(0);
                soundEffects.play('tab');
              }}
              className={`relative py-1 transition-all flex items-center gap-1.5 ${
                activeTab === 'explore'
                  ? 'text-white font-extrabold scale-105'
                  : 'text-white/60 hover:text-white/90 font-semibold'
              }`}
            >
              <span>Explore</span>
              {activeTab === 'explore' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              )}
            </button>
          </div>

          {/* Top Right: Refresh, Search & Upload (+) Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEffects.play('click');
                loadReels();
              }}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
              title="Refresh database reels"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                soundEffects.play('click');
              }}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
              title="Search Prompts & Creators"
            >
              {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* Upload (+) Button - No auth requirement! */}
            <button
              onClick={() => {
                soundEffects.play('click');
                setLocation('/reels/upload');
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border border-white/20"
              title="Upload New Reel (No login required)"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {isSearchOpen && (
          <div className="w-full max-w-md mx-auto pt-1 animate-scale-fade-out">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                autoFocus
                placeholder="Search prompt, FLUX, CapCut, Samurai..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentIndex(0);
                }}
                className="w-full pl-10 pr-10 py-2 rounded-full bg-black/70 backdrop-blur-xl border border-white/25 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 shadow-2xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. MAIN FULL-SCREEN VIDEO PLAYER CONTAINER */}
      <div className="relative w-full h-full max-w-md sm:max-w-lg md:max-w-xl mx-auto flex items-center justify-center bg-black">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-white/80 animate-pulse">
            <Film className="w-10 h-10 text-cyan-400 animate-bounce" />
            <span className="text-xs font-mono tracking-wider">Loading Database Reels...</span>
          </div>
        ) : filteredReels.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center gap-4 bg-zinc-950/80 border border-white/10 rounded-3xl backdrop-blur-md max-w-xs mx-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white/80">
              <Film className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">No Reels in Database</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                {reels.length === 0 
                  ? 'No posts in reels_posts table yet. Be the first to create one!' 
                  : 'No reels match the selected category or search filter.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-bold text-white transition-all shadow-lg hover:opacity-90 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Create New Reel
              </button>
              {reels.length > 0 && (
                <button
                  onClick={() => {
                    setActiveTab('explore');
                    setSearchQuery('');
                    setSelectedSubCategory('All');
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all border border-white/15"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : activeReel ? (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeReel.id}
              initial={{ opacity: 0.85, y: swipeDirection === 'next' ? 60 : -60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0.85, y: swipeDirection === 'next' ? -60 : 60 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
            >
              {/* Custom Responsive Player */}
              <ReelCustomPlayer
                key={activeReel.id}
                reel={activeReel}
                isActive={true}
                onDoubleTapLike={() => handleLikeToggle(activeReel.id, (activeReel.likes_count || 0) + 1)}
              />

              {/* 3. BOTTOM-LEFT INFO OVERLAY (Real data from reels_posts) */}
              <div className="absolute left-4 bottom-8 sm:bottom-12 max-w-[72%] sm:max-w-[78%] z-30 pointer-events-auto flex flex-col gap-1.5 select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {/* Creator Handle */}
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-white tracking-tight hover:underline cursor-pointer">
                    @{activeReel.author_name || 'Anonymous'}
                  </span>
                  {activeReel.category && (
                    <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-semibold text-white/90 border border-white/20">
                      {activeReel.category}
                    </span>
                  )}
                </div>

                {/* Title & Prompt Text Snippet */}
                <div className="text-xs sm:text-sm text-white/95 leading-snug">
                  <p className="font-semibold line-clamp-2">
                    {activeReel.title}
                  </p>
                  {activeReel.prompt_text && (
                    <div className="mt-1">
                      <p className={`text-xs text-cyan-200/90 font-mono ${expandedDescription ? '' : 'line-clamp-2'}`}>
                        {activeReel.prompt_text}
                      </p>
                      {activeReel.prompt_text.length > 80 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDescription(!expandedDescription);
                          }}
                          className="text-[11px] font-bold text-white/80 hover:text-white underline mt-0.5 cursor-pointer"
                        >
                          {expandedDescription ? '...less' : '...more'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Audio Marquee Ticker */}
                <div className="flex items-center gap-2 mt-1 text-xs text-white/80 overflow-hidden w-full">
                  <Music2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <div className="overflow-hidden whitespace-nowrap w-full">
                    <div className="animate-marquee text-[11px] font-medium font-mono text-white/90">
                      <span>{activeReel.music_title || 'Original Audio - Trending Reel'}</span>
                      <span className="mx-6">•</span>
                      <span>{activeReel.music_title || 'Original Audio - Trending Reel'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. RIGHT-SIDE ACTIONS (1-Click PTCopy, Like, Info, Share, Vinyl) */}
              <ReelSideActions
                reel={activeReel}
                onCopySuccess={(newCount) => handleCopySuccess(activeReel.id, newCount)}
                onLikeToggle={(newCount) => handleLikeToggle(activeReel.id, newCount)}
                onOpenInfoModal={() => setInfoReel(activeReel)}
              />
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>

      {/* 5. FLOATING DESKTOP VERTICAL NAVIGATION BUTTONS (Next / Prev) */}
      <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-3 z-40">
        <button
          onClick={handlePrevReel}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white flex items-center justify-center border border-white/15 shadow-2xl transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          title="Previous Reel (Up Arrow)"
        >
          <ChevronUp className="w-6 h-6" />
        </button>

        <div className="text-center font-mono text-xs text-white/70 py-1">
          {filteredReels.length > 0 ? `${currentIndex + 1} / ${filteredReels.length}` : '0 / 0'}
        </div>

        <button
          onClick={handleNextReel}
          disabled={currentIndex >= filteredReels.length - 1}
          className="w-12 h-12 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white flex items-center justify-center border border-white/15 shadow-2xl transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          title="Next Reel (Down Arrow)"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* 6. MODALS */}
      {/* Upload Modal (No login requirement) */}
      <UploadReelModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onReelCreated={handleReelAdded}
      />

      {/* Detailed Prompt & Description Info Modal */}
      {infoReel && (
        <ReelInfoModal
          reel={infoReel}
          isOpen={!!infoReel}
          onClose={() => setInfoReel(null)}
          onCopySuccess={(newCount) => handleCopySuccess(infoReel.id, newCount)}
        />
      )}
    </div>
  );
}
