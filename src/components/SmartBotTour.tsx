import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Sparkles, 
  Crop, 
  Youtube, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Check, 
  Sliders, 
  Zap, 
  Layers,
  HelpCircle
} from 'lucide-react';
import { sound } from '@/lib/sound';

export const TOUR_STORAGE_KEY = 'prachurjo_bot_tour_seen_v1';

export interface TourStep {
  targetId?: string;
  title: string;
  badge: string;
  description: string;
  features: { icon: React.ElementType; text: string }[];
  position?: 'bottom' | 'top' | 'center';
  actionLabel?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'hero-smart-bot-btn',
    title: 'Meet Smart AI Bot & Automation',
    badge: '1 of 3: Fast Launcher',
    description: 'Your 24/7 all-in-one assistant for YouTube SEO audits, 4K thumbnails, audio effects, and automated file workflows.',
    features: [
      { icon: Youtube, text: 'Auto-detects YouTube URLs for video & channel audits' },
      { icon: Sparkles, text: 'Persistent memory saves your custom channels and aliases' },
    ],
    position: 'bottom',
    actionLabel: 'Next: See Proactive Tools',
  },
  {
    targetId: 'tool-smart-bot',
    title: 'Proactive Attachment & In-Chat Cropper',
    badge: '2 of 3: Smart Actions',
    description: 'No complicated commands needed! Attach or paste any image, and Smart Bot proactively asks how you want to crop, compress, or convert it.',
    features: [
      { icon: Crop, text: 'Interactive In-Chat Cropper with 1:1, 16:9, 9:16, 4:3 ratios' },
      { icon: Sliders, text: 'Natural commands supported: "crop 1:1" or "compress koro"' },
    ],
    position: 'top',
    actionLabel: 'Next: Ready to Start',
  },
  {
    title: "You're All Set! Start Creating Now",
    badge: '3 of 3: Ready to Explore',
    description: 'Smart Bot operates in real-time with zero waiting queues, 100% free with no account or API keys required.',
    features: [
      { icon: Zap, text: 'Instant in-browser processing for lightning-fast speeds' },
      { icon: Layers, text: 'Accessible anytime from the top navigation menu' },
    ],
    position: 'center',
    actionLabel: 'Open Smart Bot Now 🚀',
  },
];

interface SmartBotTourProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function SmartBotTour({ forceOpen, onClose }: SmartBotTourProps) {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Check if tour should auto-start for first-time visitors
  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStepIndex(0);
      return;
    }

    try {
      const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!hasSeenTour) {
        // Slight delay so the user sees the page settle first
        const timer = setTimeout(() => {
          setIsOpen(true);
          setCurrentStepIndex(0);
          sound.tab();
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage errors in private modes
    }
  }, [forceOpen]);

  // Update target element bounding box
  const updateTargetPosition = useCallback(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStepIndex];
    if (!step.targetId) {
      setTargetRect(null);
      return;
    }

    const element = document.getElementById(step.targetId);
    if (element) {
      // Scroll into view gently if outside visible viewport
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStepIndex]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleDismiss = () => {
    sound.click();
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      sound.tab();
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Final Step: Complete tour and navigate to Smart Bot
      sound.success();
      try {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      } catch {
        // Ignore
      }
      setIsOpen(false);
      if (onClose) onClose();
      setLocation('/smart-bot');
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      sound.click();
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFinalStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Calculate Popover position relative to target element or screen center
  const getPopoverStyle = (): React.CSSProperties => {
    if (!targetRect || currentStep.position === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 60,
      };
    }

    const padding = 16;
    const popoverWidth = Math.min(window.innerWidth - 32, 420);
    let left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;

    // Clamp left within screen bounds
    if (left < padding) left = padding;
    if (left + popoverWidth > window.innerWidth - padding) {
      left = window.innerWidth - padding - popoverWidth;
    }

    if (currentStep.position === 'top' && targetRect.top > 320) {
      return {
        position: 'fixed',
        bottom: `${window.innerHeight - targetRect.top + 14}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        zIndex: 60,
      };
    }

    // Default to bottom
    return {
      position: 'fixed',
      top: `${Math.min(targetRect.bottom + 14, window.innerHeight - 380)}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      zIndex: 60,
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto" role="dialog" aria-modal="true" aria-label="Smart Bot Feature Tour">
        {/* Dark Dim Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleDismiss}
          className="absolute inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
        />

        {/* Target Element Glow Ring / Spotlight Cutout */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.35)] pointer-events-none z-55"
          >
            {/* Animated Pulse Ring */}
            <span className="absolute -inset-1 rounded-2xl border border-emerald-400 animate-ping opacity-35" />
          </motion.div>
        )}

        {/* Floating Tooltip / Popover Card */}
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={getPopoverStyle()}
          className="bg-card text-card-foreground border-2 border-emerald-500/30 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-w-md pointer-events-auto"
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  {currentStep.badge}
                </span>
                <h3 className="text-base font-bold text-foreground mt-0.5 leading-tight">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Close tour (Esc)"
              aria-label="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {currentStep.description}
          </p>

          {/* Key Feature Bullets */}
          <div className="space-y-2 bg-muted/40 p-3 rounded-xl border border-border/60">
            {currentStep.features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon className="w-3 h-3" />
                  </div>
                  <span>{feat.text}</span>
                </div>
              );
            })}
          </div>

          {/* Step Dots & Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sound.click();
                    setCurrentStepIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'w-6 bg-emerald-500'
                      : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Nav Controls */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-2.5 py-1.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted/60 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <span>{currentStep.actionLabel || (isFinalStep ? 'Finish' : 'Next')}</span>
                {isFinalStep ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Small quick trigger button to manually replay the tour anytime.
 */
export function TourReplayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={() => {
        sound.click();
        onClick();
      }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-[11px] font-semibold transition-all shadow-2xs cursor-pointer"
      title="Start Interactive Smart Bot Tour"
    >
      <HelpCircle className="w-3 h-3 text-emerald-500" />
      <span>Quick Bot Tour</span>
    </button>
  );
}
