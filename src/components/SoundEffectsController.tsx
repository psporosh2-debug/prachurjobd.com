import React, { useState, useEffect, useMemo } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Play, 
  Square,
  Sliders, 
  Music, 
  Check, 
  Search, 
  Download, 
  Layers, 
  Radio, 
  Zap, 
  Disc, 
  ExternalLink,
  X
} from 'lucide-react';
import { 
  sound, 
  soundManager, 
  ALL_SOUNDS, 
  CORE_SOUNDS, 
  SFX50_COLLECTION, 
  SoundItemMeta, 
  SfxCategory 
} from '@/lib/sound';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'wouter';

export function SoundToggleBtn({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(soundManager.isEnabled());

  useEffect(() => {
    return soundManager.subscribe((newEnabled) => {
      setEnabled(newEnabled);
    });
  }, []);

  const handleToggle = () => {
    sound.toggle();
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative p-2 rounded-lg border transition-all duration-200 ${
        enabled
          ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
          : "bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
      } ${className}`}
      title={enabled ? "Sound FX: ON (Click to Mute)" : "Sound FX: Muted (Click to Enable)"}
      aria-label={enabled ? "Mute sound effects" : "Unmute sound effects"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {enabled ? (
          <motion.div
            key="sound-on"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Volume2 className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="sound-off"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <VolumeX className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
      {enabled && (
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
    </button>
  );
}

const CATEGORY_TABS: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All Sounds (61)', icon: Music },
  { id: 'sfx50', label: 'SFX 50+ Pack (53)', icon: Sparkles },
  { id: 'core', label: 'Core UI (8)', icon: Radio },
  { id: 'sfx50_impact', label: 'Risers & Impacts', icon: Zap },
  { id: 'sfx50_bass', label: 'Bass & Rumble', icon: Disc },
  { id: 'sfx50_scifi', label: 'Sci-Fi & Zaps', icon: Layers },
  { id: 'sfx50_clicks', label: 'Clicks & UI', icon: Sliders },
  { id: 'sfx50_bursts', label: 'Bursts & Pulses', icon: Radio },
  { id: 'sfx50_ambient', label: 'Ambient Drones', icon: Music },
];

export function SoundSettingsModal() {
  const [enabled, setEnabled] = useState(soundManager.isEnabled());
  const [volume, setVolume] = useState(soundManager.getVolume() * 100);
  const [activePlay, setActivePlay] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  useEffect(() => {
    return soundManager.subscribe((newEnabled, newVol) => {
      setEnabled(newEnabled);
      setVolume(newVol * 100);
    });
  }, []);

  const filteredSounds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_SOUNDS.filter((s) => {
      // Category filter
      if (selectedCategory === 'sfx50') {
        if (s.pack !== 'SFX50+') return false;
      } else if (selectedCategory === 'core') {
        if (s.pack !== 'core') return false;
      } else if (selectedCategory !== 'all') {
        if (s.category !== selectedCategory) return false;
      }

      // Search filter
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tag.toLowerCase().includes(q) ||
        s.categoryLabel.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const handlePlay = (soundItem: SoundItemMeta) => {
    setActivePlay(soundItem.id);
    soundManager.play(soundItem.id);
    setTimeout(() => {
      setActivePlay((prev) => (prev === soundItem.id ? null : prev));
    }, 750);
  };

  const handleDownload = (e: React.MouseEvent, soundItem: SoundItemMeta) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = soundItem.path;
    link.download = soundItem.path.split('/').pop() || `${soundItem.id}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccessId(soundItem.id);
    sound.copy();
    setTimeout(() => {
      setDownloadSuccessId(null);
    }, 2000);
  };

  const handleVolumeChange = (values: number[]) => {
    const val = values[0];
    setVolume(val);
    soundManager.setVolume(val / 100);
  };

  const getTagBadgeClass = (pack: string, cat: string) => {
    if (pack === 'SFX50+') {
      if (cat.includes('impact')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      if (cat.includes('bass')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      if (cat.includes('scifi')) return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
      if (cat.includes('click')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    }
    return 'bg-primary/10 text-primary border-primary/20';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => sound.click()}
          className="gap-2 text-xs h-8 border-border bg-card/50 hover:bg-muted"
        >
          <Music className="w-3.5 h-3.5 text-primary" />
          <span>SFX Studio Library (60+)</span>
          {enabled ? (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-primary/15 text-primary border-none">
              ON
            </Badge>
          ) : (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px] text-muted-foreground">
              OFF
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="p-4 sm:p-5 border-b bg-card shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary border border-primary/20 shadow-xs">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
                  <span>Interactive Audio & SFX Library</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    60+ Sound FX
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Core UI sounds + New <b>SFX 50+ Pack</b> collection with 1-click preview and WAV downloads.
                </DialogDescription>
              </div>
            </div>

            <Link href="/sound-effects" onClick={() => sound.click()} className="hidden sm:inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline">
              <span>Full Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </DialogHeader>

        {/* Master Audio Controller Card */}
        <div className="p-4 bg-muted/20 border-b space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {enabled ? (
                <Volume2 className="w-4 h-4 text-primary" />
              ) : (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-xs sm:text-sm font-semibold">Sound Engine</span>
              <span className="text-[10px] text-muted-foreground">({enabled ? 'Interactive audio enabled' : 'Muted globally'})</span>
            </div>
            <Button
              size="sm"
              variant={enabled ? "default" : "outline"}
              onClick={() => {
                const nowEnabled = sound.toggle();
                setEnabled(nowEnabled);
              }}
              className="h-7 text-xs px-3"
            >
              {enabled ? "Mute All" : "Enable Sound"}
            </Button>
          </div>

          {enabled && (
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs text-muted-foreground font-medium w-16">Vol: {Math.round(volume)}%</span>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => sound.powerUp()}
                className="h-7 text-xs px-2.5 shrink-0 gap-1.5"
              >
                <Play className="w-3 h-3 text-emerald-500" />
                <span>Test SFX</span>
              </Button>
            </div>
          )}

          {/* Quick Search and Category Tabs */}
          <div className="pt-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search 60+ sounds (e.g. impact, bass, laser, click, rumble)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.tab();
                      setSelectedCategory(tab.id);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-foreground text-background shadow-xs'
                        : 'bg-card border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Sound Library List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[420px]">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pb-1">
            <span>Showing <b>{filteredSounds.length}</b> audio effects</span>
            <span>Click card to test • Download .WAV</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredSounds.map((item) => {
              const isPlaying = activePlay === item.id;
              const isDownloaded = downloadSuccessId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handlePlay(item)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none group text-left ${
                    isPlaying
                      ? "border-primary bg-primary/10 shadow-sm scale-[0.99]"
                      : "border-border bg-card hover:bg-muted/40 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isPlaying
                          ? "bg-primary text-primary-foreground shadow-sm animate-pulse"
                          : "bg-muted text-foreground group-hover:bg-primary/20 group-hover:text-primary"
                      }`}
                    >
                      <Play className={`w-3 h-3 ${isPlaying ? "animate-spin" : "ml-0.5"}`} />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold truncate text-foreground">
                          {item.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 font-semibold shrink-0 ${getTagBadgeClass(item.pack, item.category)}`}
                        >
                          {item.tag}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* 1-Click WAV Download Button */}
                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, item)}
                    className={`p-1.5 rounded-lg border ml-2 shrink-0 transition-colors ${
                      isDownloaded
                        ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border-border/60"
                    }`}
                    title="Download .WAV audio file"
                  >
                    {isDownloaded ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {filteredSounds.length === 0 && (
            <div className="p-8 text-center border border-dashed rounded-xl bg-card space-y-2">
              <p className="text-xs font-semibold text-foreground">No sound found matching "{searchQuery}"</p>
              <p className="text-[11px] text-muted-foreground">Try clearing your search or picking another category.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="h-7 text-xs"
              >
                Reset Search
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
