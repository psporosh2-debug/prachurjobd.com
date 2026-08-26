import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ChevronLeft, 
  ChevronRight, 
  Music2, 
  Sparkles,
  Disc3,
  Heart,
  ImageIcon
} from 'lucide-react';
import { ReelPost } from '@/types/reels';
import { soundEffects } from '@/lib/sound';

export function isImagePost(reel: ReelPost): boolean {
  if (reel.media_type === 'photo') return true;
  if (Array.isArray(reel.images) && reel.images.length > 0) return true;
  if ((reel as any).isSlideShow) return true;
  if (typeof reel.stream_url === 'string' && /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(reel.stream_url)) return true;
  return false;
}

export function getAudioUrl(reel: ReelPost): string {
  if (reel.music_url) return reel.music_url;
  if ((reel as any).audio_url) return (reel as any).audio_url;
  if (typeof reel.stream_url === 'string' && /\.(mp3|m4a|aac|wav|ogg)(\?.*)?$/i.test(reel.stream_url)) return reel.stream_url;
  return '';
}

export function isImageAudioPost(reel: ReelPost): boolean {
  return isImagePost(reel) && Boolean(getAudioUrl(reel));
}

interface ImageAudioMediaContainerProps {
  reel: ReelPost;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onDoubleTapLike?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayingStateChange?: (isPlaying: boolean) => void;
}

export const ImageAudioMediaContainer: React.FC<ImageAudioMediaContainerProps> = ({
  reel,
  isActive,
  isMuted,
  onToggleMute,
  onDoubleTapLike,
  onTimeUpdate,
  onPlayingStateChange
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(reel.duration || 15);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [centerAnimation, setCenterAnimation] = useState<'play' | 'pause' | 'heart' | null>(null);
  const lastTapRef = useRef<number>(0);

  const audioUrl = getAudioUrl(reel);
  const slides = (reel.images && reel.images.length > 0) 
    ? reel.images 
    : [reel.stream_url || reel.cover_url || ''];

  // 1. Intersection Observer for viewport visibility detection
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. Playback controller function with browser autoplay policy handling
  const attemptPlayAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    try {
      audio.muted = isMuted;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        if (onPlayingStateChange) onPlayingStateChange(true);
      }
    } catch (err) {
      console.warn('ImageAudioMediaContainer unmuted autoplay blocked by browser:', err);
      // Fallback: If blocked by browser autoplay policy, mute & play
      try {
        audio.muted = true;
        const mutedPromise = audio.play();
        if (mutedPromise !== undefined) {
          await mutedPromise;
          setIsPlaying(true);
          if (onPlayingStateChange) onPlayingStateChange(true);
        }
      } catch (fallbackErr) {
        console.warn('ImageAudioMediaContainer muted play also blocked:', fallbackErr);
        setIsPlaying(false);
        if (onPlayingStateChange) onPlayingStateChange(false);
      }
    }
  }, [audioUrl, isMuted, onPlayingStateChange]);

  // 3. Auto-play / Pause audio when container is active
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isActive && isVisible) {
      attemptPlayAudio();
    } else {
      audio.pause();
      setIsPlaying(false);
      if (onPlayingStateChange) onPlayingStateChange(false);
    }
  }, [isActive, isVisible, attemptPlayAudio, onPlayingStateChange]);

  // 4. Auto play trigger when audioUrl or active state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isActive && isVisible) {
      attemptPlayAudio();
    }
  }, [audioUrl, isActive, isVisible, attemptPlayAudio]);

  // 5. Global user gesture listener to unlock audio context on first interaction
  useEffect(() => {
    const handleGlobalInteraction = () => {
      const audio = audioRef.current;
      if (audio && isActive && audio.paused) {
        attemptPlayAudio();
      }
    };

    window.addEventListener('click', handleGlobalInteraction, { once: true });
    window.addEventListener('touchstart', handleGlobalInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleGlobalInteraction);
      window.removeEventListener('touchstart', handleGlobalInteraction);
    };
  }, [isActive, attemptPlayAudio]);

  // 6. Update audio volume/mute state when prop changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (isActive && isPlaying && audioRef.current.paused) {
        attemptPlayAudio();
      }
    }
  }, [isMuted, isActive, isPlaying, attemptPlayAudio]);

  // 6. Auto-advance slideshow images when audio is actively playing
  useEffect(() => {
    if (slides.length <= 1 || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [slides.length, isPlaying]);

  // Audio Event Handlers
  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (audio.duration && !isNaN(audio.duration)) {
      setDuration(audio.duration);
    }
    if (onTimeUpdate) {
      onTimeUpdate(audio.currentTime, audio.duration || duration);
    }
  };

  const togglePlayAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      attemptPlayAudio();
      setCenterAnimation('play');
      soundEffects.play('play');
    } else {
      audio.pause();
      setIsPlaying(false);
      if (onPlayingStateChange) onPlayingStateChange(false);
      setCenterAnimation('pause');
      soundEffects.play('pause');
    }

    setTimeout(() => {
      setCenterAnimation(null);
    }, 800);
  };

  // Double-tap to like handler
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      setCenterAnimation('heart');
      soundEffects.play('like');
      if (onDoubleTapLike) onDoubleTapLike();
      setTimeout(() => setCenterAnimation(null), 900);
    } else {
      // Single tap -> Toggle play/pause
      togglePlayAudio();
    }
    lastTapRef.current = now;
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    soundEffects.play('pop');
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    soundEffects.play('pop');
  };

  return (
    <div
      ref={containerRef}
      id={`image-audio-container-${reel.id}`}
      className="relative w-full h-full bg-black select-none flex items-center justify-center overflow-hidden cursor-pointer"
      onClick={handleContainerClick}
    >
      {/* Hidden Audio Player for Background Music */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          autoPlay={isActive && isVisible}
          preload="auto"
          loop
          muted={isMuted}
          onPlay={() => {
            setIsPlaying(true);
            if (onPlayingStateChange) onPlayingStateChange(true);
          }}
          onPause={() => {
            setIsPlaying(false);
            if (onPlayingStateChange) onPlayingStateChange(false);
          }}
          onCanPlay={() => {
            if (isActive && isVisible && audioRef.current?.paused) {
              attemptPlayAudio();
            }
          }}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Blurred Aesthetic Background Fill */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-40 scale-125 pointer-events-none transition-all duration-700"
        style={{ backgroundImage: slides[currentSlideIndex] ? `url(${slides[currentSlideIndex]})` : undefined }}
      />

      {/* Primary Image Display */}
      <img
        src={slides[currentSlideIndex] || undefined}
        alt={reel.title}
        className="relative z-10 w-full h-full object-contain max-h-full transition-all duration-300 drop-shadow-2xl"
      />

      {/* Top Banner: Media Type Badge & Audio Status */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Image Post</span>
        </div>

        {audioUrl && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold shadow-lg">
            {isPlaying && !isMuted ? (
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 h-full bg-cyan-300 animate-pulse" />
                <span className="w-0.5 h-2/3 bg-cyan-300 animate-pulse delay-75" />
                <span className="w-0.5 h-full bg-cyan-300 animate-pulse delay-150" />
              </div>
            ) : (
              <Music2 className="w-3.5 h-3.5 text-cyan-300" />
            )}
            <span className="truncate max-w-[120px] sm:max-w-[160px] font-mono">
              {reel.music_title || 'Audio Track'}
            </span>
          </div>
        )}
      </div>

      {/* Slide Navigation Controls */}
      {slides.length > 1 && (
        <>
          {/* Slide Dots */}
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

          {/* Slide Arrow Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 hover:scale-110 active:scale-95 transition-all z-20 shadow-xl"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 hover:scale-110 active:scale-95 transition-all z-20 shadow-xl"
            aria-label="Next Image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Floating Sound Control Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute();
        }}
        className={`absolute top-16 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border transition-all shadow-lg ${
          isMuted
            ? 'bg-rose-500/80 hover:bg-rose-500 text-white border-rose-400/40 animate-pulse'
            : 'bg-black/50 hover:bg-black/80 text-white/90 border-white/20'
        }`}
        title={isMuted ? 'Tap to Unmute Audio' : 'Tap to Mute Audio'}
      >
        {isMuted ? (
          <>
            <VolumeX className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold tracking-wide uppercase">Unmute</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold tracking-wide uppercase">Sound On</span>
          </>
        )}
      </button>

      {/* Center Feedback Popups */}
      {centerAnimation === 'play' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-scale-fade-out">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
            <Play className="w-8 h-8 fill-white translate-x-0.5" />
          </div>
        </div>
      )}

      {centerAnimation === 'pause' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-scale-fade-out">
          <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl">
            <Pause className="w-8 h-8 fill-white" />
          </div>
        </div>
      )}

      {centerAnimation === 'heart' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 animate-scale-fade-out">
          <Heart className="w-24 h-24 fill-rose-500 text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)] animate-bounce" />
        </div>
      )}

      {/* Bottom Timeline Audio Progress Bar */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-20 pointer-events-none">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
};
