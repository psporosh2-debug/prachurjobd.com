import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  enabled?: boolean;
  speed?: number; // Target delay in ms per chunk
  className?: string;
  onComplete?: () => void;
  onTick?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  enabled = true,
  speed = 12,
  className = '',
  onComplete,
  onTick
}) => {
  const [displayedLength, setDisplayedLength] = useState<number>(() => {
    return enabled ? 0 : text.length;
  });
  const [isDone, setIsDone] = useState<boolean>(!enabled || text.length === 0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep latest callbacks in refs to avoid useEffect dependency churn
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  }, [onComplete, onTick]);

  // Main typing effect
  useEffect(() => {
    if (!enabled || text.length === 0) {
      setDisplayedLength(text.length);
      setIsDone(true);
      // Defer callback to avoid setting parent state during render
      const timer = setTimeout(() => {
        onCompleteRef.current?.();
      }, 0);
      return () => clearTimeout(timer);
    }

    // Reset for new text or enabled
    setDisplayedLength(0);
    setIsDone(false);

    const totalChars = text.length;
    let chunkSize = 1;
    if (totalChars > 500) chunkSize = 4;
    else if (totalChars > 250) chunkSize = 3;
    else if (totalChars > 100) chunkSize = 2;

    const interval = setInterval(() => {
      setDisplayedLength((prev) => {
        const next = Math.min(prev + chunkSize, text.length);
        
        // Defer ticks and completion out of React's state reducer phase
        if (onTickRef.current) {
          setTimeout(() => onTickRef.current?.(), 0);
        }

        if (next >= text.length) {
          clearInterval(interval);
          setIsDone(true);
          if (onCompleteRef.current) {
            setTimeout(() => onCompleteRef.current?.(), 0);
          }
        }
        return next;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [text, enabled, speed]);

  // Click to instant-skip animation and reveal full text
  const handleSkip = (e: React.MouseEvent) => {
    if (!isDone) {
      e.stopPropagation();
      setDisplayedLength(text.length);
      setIsDone(true);
      if (onCompleteRef.current) {
        setTimeout(() => onCompleteRef.current?.(), 0);
      }
    }
  };

  const displayedText = text.slice(0, displayedLength);

  return (
    <div 
      ref={containerRef}
      onClick={handleSkip}
      className={`relative group ${!isDone ? 'cursor-pointer select-none' : ''} ${className}`}
      title={!isDone ? 'Click to show full message immediately' : undefined}
    >
      <span className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed break-words">
        {displayedText}
      </span>

      {/* Typing Cursor */}
      {!isDone && (
        <span 
          className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-500 rounded-2xs animate-pulse align-middle shadow-xs shadow-emerald-500/50" 
          aria-hidden="true"
        />
      )}

      {/* Subtle Skip Hint badge during active typing */}
      {!isDone && (
        <span className="ml-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity inline-flex items-center gap-0.5">
          ⚡ <span className="underline decoration-emerald-500/40">Skip</span>
        </span>
      )}
    </div>
  );
};
