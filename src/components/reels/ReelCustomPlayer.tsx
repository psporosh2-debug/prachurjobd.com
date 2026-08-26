import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Flame,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Music2,
  Disc3
} from 'lucide-react';
import { ReelPost } from '@/types/reels';
import { soundEffects } from '@/lib/sound';
import { ImageAudioMediaContainer, isImagePost } from './ImageAudioMediaContainer';

interface ReelCustomPlayerProps {
  reel: ReelPost;
  isActive: boolean;
  onDoubleTapLike?: () => void;
}

export const ReelCustomPlayer: React.FC<ReelCustomPlayerProps> = ({
  reel,
  isActive,
  onDoubleTapLike
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Global sound preference (defaults to unmuted if user previously allowed/unmuted, or tries unmuted)
  const isSoundPreviouslyUnmuted = typeof window !== 'undefined' && localStorage.getItem('prachurjo_reels_sound') === 'unmuted';

  const [isMuted, setIsMuted] = useState<boolean>(!isSoundPreviouslyUnmuted);

  // If post is an image-based post (single photo or slideshow), use specialized ImageAudioMediaContainer
  if (isImagePost(reel)) {
    return (
      <ImageAudioMediaContainer
        reel={reel}
        isActive={isActive}
        isMuted={isMuted}
        onToggleMute={() => {
          const newMuted = !isMuted;
          setIsMuted(newMuted);
          if (typeof window !== 'undefined') {
            localStorage.setItem('prachurjo_reels_sound', newMuted ? 'muted' : 'unmuted');
          }
        }}
        onDoubleTapLike={onDoubleTapLike}
      />
    );
  }

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(reel.duration || 15);
  const [bufferedPercent, setBufferedPercent] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [centerAnimation, setCenterAnimation] = useState<'play' | 'pause' | 'heart' | null>(null);
  const [videoAspect, setVideoAspect] = useState<'portrait' | 'landscape' | 'square'>('portrait');
  
  // Determine if photo mode slideshow
  const isPhotoMode = reel.media_type === 'photo' || (Array.isArray(reel.images) && reel.images.length > 0);

  // Photo Slideshow State
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const slides = isPhotoMode && reel.images && reel.images.length > 0 ? reel.images : [reel.stream_url || reel.cover_url || ''];

  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);

  // Auto hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // Audio stream URL for photo mode
  const photoAudioUrl = reel.music_url || (reel.stream_url && (reel.stream_url.includes('.mp3') || reel.stream_url.includes('/music/')) ? reel.stream_url : '');

  // Robust Auto-Play Function
  const attemptPlay = useCallback(async () => {
    if (!isActive) return;

    if (isPhotoMode) {
      const audio = audioRef.current;
      if (!audio) return;
      try {
        audio.currentTime = 0;
        audio.muted = isMuted;
        await audio.play();
        setIsPlaying(true);
      } catch {
        // Fallback for audio: mute and play if blocked by autoplay policy
        try {
          audio.muted = true;
          setIsMuted(true);
          await audio.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn('Audio auto-play failed:', err);
        }
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    try {
      // First attempt: Try to play with current mute state
      const playPromise = video.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
      }
    } catch {
      // If blocked by browser unmuted autoplay policy: Auto-mute and immediately play
      try {
        video.muted = true;
        setIsMuted(true);
        const retryPromise = video.play();
        if (retryPromise !== undefined) {
          await retryPromise;
          setIsPlaying(true);
        }
      } catch (err) {
        console.warn('Auto-play fallback failed:', err);
      }
    }
  }, [isActive, isPhotoMode, isMuted]);

  // Trigger Playback on mount, active state change, or reel change
  useEffect(() => {
    if (isActive) {
      attemptPlay();
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [isActive, attemptPlay]);

  // Audio stream reload on photoAudioUrl change
  useEffect(() => {
    if (isPhotoMode && audioRef.current && photoAudioUrl) {
      audioRef.current.load();
      if (isActive) {
        attemptPlay();
      }
    }
  }, [photoAudioUrl, isPhotoMode, isActive, attemptPlay]);

  // Auto-advance photo slideshow
  useEffect(() => {
    if (!isPhotoMode || slides.length <= 1 || !isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isPhotoMode, slides.length, isPlaying]);

  // Handle Play/Pause toggle
  const togglePlay = () => {
    if (isPhotoMode) {
      if (!audioRef.current) return;
      if (audioRef.current.paused) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          triggerCenterAnim('play');
        }).catch(() => {});
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
        triggerCenterAnim('pause');
      }
      return;
    }

    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        triggerCenterAnim('play');
      }).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      triggerCenterAnim('pause');
    }
    resetHideTimer();
  };

  const triggerCenterAnim = (type: 'play' | 'pause' | 'heart') => {
    setCenterAnimation(type);
    setTimeout(() => {
      setCenterAnimation(null);
    }, 650);
  };

  // Double tap / Click detection for like
  const handleContainerClick = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      triggerCenterAnim('heart');
      soundEffects.play('pop');
      if (onDoubleTapLike) onDoubleTapLike();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      togglePlay();
    }
  };

  // Video Time Updates & Metadata
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (!duration && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }

    // Buffer percentage
    if (videoRef.current.buffered.length > 0 && videoRef.current.duration > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBufferedPercent((bufferedEnd / videoRef.current.duration) * 100);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  // Detect Video Aspect Ratio on Load
  const handleVideoLoadedMetadata = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    setDuration(v.duration || 15);
    
    if (v.videoWidth && v.videoHeight) {
      const ratio = v.videoWidth / v.videoHeight;
      if (ratio > 1.2) {
        setVideoAspect('landscape'); // 16:9 or widescreen
      } else if (ratio > 0.85 && ratio <= 1.2) {
        setVideoAspect('square'); // 1:1
      } else {
        setVideoAspect('portrait'); // 9:16
      }
    }
  };

  // Progress Bar Seek
  const handleProgressSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    if (reel.media_type === 'video' && videoRef.current) {
      videoRef.current.currentTime = newTime;
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
    resetHideTimer();
  };

  // Volume & Mute Toggle
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (typeof window !== 'undefined') {
      localStorage.setItem('prachurjo_reels_sound', newMuted ? 'muted' : 'unmuted');
    }

    if (videoRef.current) {
      videoRef.current.muted = newMuted;
      if (!newMuted && videoRef.current.paused && isActive) {
        videoRef.current.play().catch(() => {});
      }
    }
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
      if (!newMuted && audioRef.current.paused && isActive) {
        audioRef.current.play().catch(() => {});
      }
    }
    soundEffects.play('click');
    resetHideTimer();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  // Playback Rate
  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.25, 1.5, 2, 0.5];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    if (videoRef.current) videoRef.current.playbackRate = nextRate;
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
    soundEffects.play('tick');
    resetHideTimer();
  };

  // Loop Toggle
  const toggleLoop = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLoop = !isLooping;
    setIsLooping(newLoop);
    if (videoRef.current) videoRef.current.loop = newLoop;
    if (audioRef.current) audioRef.current.loop = newLoop;
    soundEffects.play('tick');
    resetHideTimer();
  };

  // Fullscreen
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
    resetHideTimer();
  };

  // Photo slide navigation
  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    soundEffects.play('click');
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    soundEffects.play('click');
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      id={`reel-player-container-${reel.id}`}
      className="relative w-full h-full bg-black select-none group flex items-center justify-center overflow-hidden"
      onMouseMove={resetHideTimer}
      onClick={handleContainerClick}
    >
      {/* 1. MEDIA DISPLAY (VIDEO OR PHOTO CAROUSEL) */}
      {!isPhotoMode ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
          {/* Subtle Ambient Blurred Background for 16:9 Landscape or Non-9:16 Videos */}
          {videoAspect === 'landscape' && reel.cover_url && (
            <div 
              className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-30 scale-125 pointer-events-none"
              style={{ backgroundImage: `url(${reel.cover_url})` }}
            />
          )}

          {/* Actual Video Element */}
          <video
            ref={videoRef}
            id={`reel-video-element-${reel.id}`}
            src={reel.stream_url || undefined}
            poster={reel.cover_url || undefined}
            playsInline
            autoPlay
            preload="auto"
            loop={isLooping}
            muted={isMuted}
            className={`w-full h-full cursor-pointer pointer-events-auto transition-all ${
              videoAspect === 'landscape' 
                ? 'object-contain max-h-[56.25vw] sm:max-h-[60%] my-auto shadow-2xl' 
                : 'object-cover sm:object-contain'
            }`}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleVideoLoadedMetadata}
            onCanPlay={() => {
              if (isActive && videoRef.current?.paused) {
                attemptPlay();
              }
            }}
            onLoadedData={() => {
              if (isActive && videoRef.current?.paused) {
                attemptPlay();
              }
            }}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => {
              setIsBuffering(false);
              setIsPlaying(true);
            }}
            onEnded={() => {
              if (!isLooping) setIsPlaying(false);
            }}
          />
        </div>
      ) : (
        /* PHOTO / SLIDESHOW CAROUSEL WITH BACKGROUND MUSIC */
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
          {/* Audio Player for Photo Mode */}
          <audio
            ref={audioRef}
            src={photoAudioUrl || undefined}
            autoPlay
            preload="auto"
            loop={isLooping}
            muted={isMuted}
            onTimeUpdate={handleAudioTimeUpdate}
            onCanPlay={() => {
              if (isActive && audioRef.current?.paused) {
                attemptPlay();
              }
            }}
            onEnded={() => {
              if (!isLooping) setIsPlaying(false);
            }}
          />

          {/* Blurred Background for aesthetic photo fill */}
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-110 pointer-events-none"
            style={{ backgroundImage: slides[currentSlideIndex] ? `url(${slides[currentSlideIndex]})` : undefined }}
          />

          {/* Main Photo Image */}
          <img
            src={slides[currentSlideIndex] || undefined}
            alt={reel.title}
            className="relative z-10 w-full h-full object-contain max-h-full transition-all duration-300 drop-shadow-2xl"
          />

          {/* Carousel Controls */}
          {slides.length > 1 && (
            <>
              {/* Slide Counter Dots */}
              <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-lg">
                {slides.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentSlideIndex ? 'w-5 bg-cyan-400' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>

              {/* Prev / Next Slide Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 hover:scale-110 active:scale-95 transition-all z-20 shadow-xl"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 hover:scale-110 active:scale-95 transition-all z-20 shadow-xl"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Quick Floating Unmute / Sound Badge */}
      <button
        onClick={toggleMute}
        className={`absolute top-16 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border transition-all shadow-lg ${
          isMuted
            ? 'bg-rose-500/80 hover:bg-rose-500 text-white border-rose-400/40 animate-pulse'
            : 'bg-black/50 hover:bg-black/80 text-white/90 border-white/20'
        }`}
        title={isMuted ? 'Tap to Unmute' : 'Tap to Mute'}
      >
        {isMuted ? (
          <>
            <VolumeX className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold tracking-tight">Tap for Sound</span>
          </>
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
        )}
      </button>

      {/* 2. BUFFERING SPINNER */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs pointer-events-none z-30">
          <div className="w-12 h-12 rounded-full border-3 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        </div>
      )}

      {/* 3. CENTER POPUP ANIMATIONS (Play / Pause / Double-Tap Heart) */}
      {centerAnimation === 'play' && !isPhotoMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-scale-fade-out">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
            <Play className="w-8 h-8 fill-white translate-x-0.5" />
          </div>
        </div>
      )}

      {!isPlaying && !centerAnimation && !isPhotoMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 shadow-2xl hover:scale-105 transition-transform">
            <Play className="w-8 h-8 fill-white translate-x-0.5" />
          </div>
        </div>
      )}

      {centerAnimation === 'pause' && !isPhotoMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-scale-fade-out">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
            <Pause className="w-8 h-8 fill-white" />
          </div>
        </div>
      )}

      {centerAnimation === 'heart' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-heart-pop">
          <Flame className="w-28 h-28 text-rose-500 fill-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.9)]" />
        </div>
      )}

      {/* 4. SLEEK TIKTOK-STYLE BOTTOM TIMELINE & CONTROLS */}
      <div
        className={`absolute bottom-0 inset-x-0 pt-10 pb-2 px-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-30 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 hover:opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrubber Bar */}
        <div
          ref={progressBarRef}
          onClick={handleProgressSeek}
          className="relative w-full h-1.5 hover:h-2.5 bg-white/25 rounded-full cursor-pointer mb-2 transition-all group/bar overflow-hidden"
        >
          {/* Buffered Progress */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full transition-all"
            style={{ width: `${bufferedPercent}%` }}
          />
          {/* Active Gradient Playhead */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded-full shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Mini Controls Strip */}
        <div className="flex items-center justify-between text-white text-xs px-1">
          {/* Time Display */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="p-1 rounded-md hover:bg-white/20 transition-all text-white"
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white translate-x-0.5" />}
            </button>
            <span className="font-mono text-[10px] text-white/80 font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Quick Audio & Speed Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1 rounded-md hover:bg-white/20 transition-all text-white"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={cyclePlaybackRate}
              className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono font-bold"
            >
              {playbackRate}x
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1 rounded-md hover:bg-white/20 transition-all text-white"
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
