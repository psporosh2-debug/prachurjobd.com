import React, { useRef } from 'react';
import { Link } from 'wouter';
import { 
  Clock, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  X, 
  Sparkles,
  Zap,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRecentTools, ResolvedRecentTool, KNOWN_TOOLS } from '@/hooks/useRecentTools';
import { sound } from '@/lib/sound';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Default starter tools to recommend if user has no recent history
const STARTER_TOOL_IDS = ['smart-bot', 'image-cropper', 'thumbnail-downloader', 'image-compressor'];

export function RecentlyUsedTools() {
  const { recentTools, removeRecentTool, clearRecentTools, recordToolUsage } = useRecentTools();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    sound.click();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    sound.click();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const hasRecents = recentTools.length > 0;

  // If no recents, resolve starter tools with fallback display
  const displayTools: (ResolvedRecentTool | {
    id: string;
    title: string;
    description: string;
    category: 'ai' | 'youtube' | 'design' | 'utility';
    href: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
    gradient: string;
    lastUsed: number;
    timeAgo: string;
    count: number;
    isStarter?: boolean;
  })[] = hasRecents 
    ? recentTools 
    : STARTER_TOOL_IDS.map(id => {
        const def = KNOWN_TOOLS[id];
        return {
          ...def,
          lastUsed: Date.now(),
          timeAgo: 'Suggested',
          count: 1,
          isStarter: true
        };
      });

  return (
    <section className="space-y-3.5" aria-label="Recently used tools">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                {hasRecents ? 'Recently Used' : 'Quick Jump / Suggested'}
              </h2>
              {hasRecents && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                  {recentTools.length}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {hasRecents 
                ? 'Your recently used tools for rapid access' 
                : 'Frequently used creator tools to get started quickly'}
            </p>
          </div>
        </div>

        {/* Scroll Controls & Actions */}
        <div className="flex items-center gap-1.5">
          {hasRecents && (
            <button
              onClick={() => {
                sound.clear();
                clearRecentTools();
              }}
              className="text-[11px] font-medium text-muted-foreground hover:text-destructive px-2 py-1 rounded-md hover:bg-destructive/10 transition-colors flex items-center gap-1"
              title="Clear recently used history"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 pl-1 border-l">
            <button
              onClick={scrollLeft}
              className="p-1.5 rounded-lg border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-2xs"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={scrollRight}
              className="p-1.5 rounded-lg border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-2xs"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Container */}
      <div className="relative group">
        <div
          ref={scrollRef}
          className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 px-0.5 scrollbar-none scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <AnimatePresence mode="popLayout">
            {displayTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 snap-start"
                >
                  <div className="relative group/card w-[220px] sm:w-[240px] h-full">
                    <Link
                      href={tool.href}
                      onClick={() => {
                        sound.click();
                        recordToolUsage(tool.id);
                      }}
                      className="block h-full"
                    >
                      <div className={`p-3.5 rounded-2xl border bg-gradient-to-b ${tool.gradient} bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full gap-2.5 cursor-pointer relative overflow-hidden group-hover/card:-translate-y-0.5`}>
                        {/* Top: Icon + Badge + Remove */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="p-2 rounded-xl bg-card border shadow-2xs group-hover/card:scale-105 transition-transform">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-background/80 border text-muted-foreground font-semibold">
                              {tool.timeAgo}
                            </span>

                            {hasRecents && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  sound.click();
                                  removeRecentTool(tool.id);
                                }}
                                className="opacity-0 group-hover/card:opacity-100 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-opacity"
                                title="Remove from recent"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-foreground group-hover/card:text-primary transition-colors truncate">
                            {tool.title}
                          </h3>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>

                        {/* Bottom Row: Category & Open Link */}
                        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                          <span className="capitalize font-medium text-muted-foreground">
                            {tool.category} tool
                          </span>
                          <span className="text-primary font-bold flex items-center gap-0.5 group-hover/card:translate-x-0.5 transition-transform">
                            Open <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default RecentlyUsedTools;
