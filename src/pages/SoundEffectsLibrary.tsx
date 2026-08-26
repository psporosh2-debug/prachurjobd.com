import React, { useState, useEffect, useMemo } from 'react';
import { 
  Music, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Download, 
  Search, 
  Sparkles, 
  Zap, 
  Disc, 
  Layers, 
  Sliders, 
  Radio, 
  Check, 
  Copy, 
  RefreshCw, 
  Heart,
  FileAudio,
  ShieldCheck,
  FolderOpen
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
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/hooks/use-toast';

const CATEGORY_FILTERS: { id: string; label: string; icon: React.ElementType; count: number }[] = [
  { id: 'all', label: 'All Sounds', icon: Music, count: ALL_SOUNDS.length },
  { id: 'sfx50', label: 'SFX 50+ Pack', icon: Sparkles, count: SFX50_COLLECTION.length },
  { id: 'core', label: 'Core UI', icon: Radio, count: CORE_SOUNDS.length },
  { id: 'sfx50_impact', label: 'Risers & Impacts', icon: Zap, count: ALL_SOUNDS.filter(s => s.category === 'sfx50_impact').length },
  { id: 'sfx50_bass', label: 'Bass & Rumble', icon: Disc, count: ALL_SOUNDS.filter(s => s.category === 'sfx50_bass').length },
  { id: 'sfx50_scifi', label: 'Sci-Fi & Zaps', icon: Layers, count: ALL_SOUNDS.filter(s => s.category === 'sfx50_scifi').length },
  { id: 'sfx50_clicks', label: 'Clicks & UI', icon: Sliders, count: ALL_SOUNDS.filter(s => s.category === 'sfx50_clicks').length },
  { id: 'sfx50_bursts', label: 'Bursts & Pulses', icon: Radio, count: ALL_SOUNDS.filter(s => s.category === 'sfx50_bursts').length },
  { id: 'sfx50_ambient', label: 'Ambient Drones', icon: Music, count: ALL_SOUNDS.filter(s => s.category === 'sfx50_ambient').length },
];

export default function SoundEffectsLibrary() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(soundManager.isEnabled());
  const [volume, setVolume] = useState(soundManager.getVolume() * 100);
  const [activePlayId, setActivePlayId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  useEffect(() => {
    return soundManager.subscribe((newEnabled, newVol) => {
      setEnabled(newEnabled);
      setVolume(newVol * 100);
    });
  }, []);

  const filteredSounds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ALL_SOUNDS.filter((s) => {
      if (selectedCategory === 'sfx50') {
        if (s.pack !== 'SFX50+') return false;
      } else if (selectedCategory === 'core') {
        if (s.pack !== 'core') return false;
      } else if (selectedCategory !== 'all') {
        if (s.category !== selectedCategory) return false;
      }

      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tag.toLowerCase().includes(q) ||
        s.categoryLabel.toLowerCase().includes(q) ||
        s.path.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const handlePlay = (soundItem: SoundItemMeta) => {
    setActivePlayId(soundItem.id);
    soundManager.play(soundItem.id);
    setTimeout(() => {
      setActivePlayId((prev) => (prev === soundItem.id ? null : prev));
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

    setDownloadedId(soundItem.id);
    sound.copy();
    toast({
      title: 'Sound Downloaded',
      description: `Downloaded ${soundItem.name} (.wav)`,
    });
    setTimeout(() => {
      setDownloadedId(null);
    }, 2000);
  };

  const handleCopyPath = (e: React.MouseEvent, soundItem: SoundItemMeta) => {
    e.stopPropagation();
    navigator.clipboard.writeText(soundItem.path);
    setCopiedId(soundItem.id);
    sound.copy();
    toast({
      title: 'Path Copied',
      description: soundItem.path,
    });
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleVolumeChange = (values: number[]) => {
    const val = values[0];
    setVolume(val);
    soundManager.setVolume(val / 100);
  };

  const handlePlayRandom = () => {
    if (filteredSounds.length === 0) return;
    const rand = filteredSounds[Math.floor(Math.random() * filteredSounds.length)];
    handlePlay(rand);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 text-primary border border-primary/20 shadow-xs">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                SFX & Audio Studio Hub
              </h1>
              <Badge className="bg-primary/15 text-primary border-none text-[10px] font-bold">
                60+ WAV SFX
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Royalty-free studio sound effects for video creators, YouTube intros, transitions & web apps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayRandom}
            className="h-8 text-xs gap-1.5 border-border"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Random Play</span>
          </Button>

          <Button
            size="sm"
            variant={enabled ? "default" : "outline"}
            onClick={() => {
              const nowEnabled = sound.toggle();
              setEnabled(nowEnabled);
            }}
            className="h-8 text-xs gap-1.5"
          >
            {enabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{enabled ? "Sound: ON" : "Muted"}</span>
          </Button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="p-4 rounded-xl bg-card border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search 60+ sounds (e.g., impact, deep bass, zap, cyber click, riser)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Volume Slider */}
          {enabled && (
            <div className="flex items-center gap-3 sm:w-64 shrink-0 bg-muted/20 px-3 py-1.5 rounded-xl border border-border/50">
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[11px] font-semibold text-muted-foreground w-12">
                {Math.round(volume)}%
              </span>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          {CATEGORY_FILTERS.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  sound.tab();
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  active ? "bg-white/20 text-white" : "bg-muted-foreground/15 text-muted-foreground"
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sound Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Found <b>{filteredSounds.length}</b> sound effects</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            100% Free & Royalty-Free for Creators
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredSounds.map((item) => {
            const isPlaying = activePlayId === item.id;
            const isCopied = copiedId === item.id;
            const isDownloaded = downloadedId === item.id;

            return (
              <motion.div
                key={item.id}
                layout
                onClick={() => handlePlay(item)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none group text-left ${
                  isPlaying
                    ? "border-primary bg-primary/10 shadow-md scale-[0.99]"
                    : "border-border bg-card hover:bg-muted/40 hover:border-primary/40 shadow-2xs"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isPlaying
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "bg-muted/80 text-foreground group-hover:bg-primary/20 group-hover:text-primary"
                    }`}
                  >
                    <Play className={`w-4 h-4 ${isPlaying ? "animate-pulse fill-current" : "ml-0.5"}`} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {item.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 font-semibold ${
                          item.pack === 'SFX50+'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}
                      >
                        {item.tag}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/60 font-mono hidden sm:inline">
                        {item.categoryLabel}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopyPath(e, item)}
                    className="p-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Copy File Path"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, item)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isDownloaded
                        ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title="Download .WAV"
                  >
                    {isDownloaded ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredSounds.length === 0 && (
          <div className="p-12 text-center border border-dashed rounded-2xl bg-card space-y-3">
            <Music className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
            <p className="text-sm font-bold text-foreground">No sound effects matched "{searchQuery}"</p>
            <p className="text-xs text-muted-foreground">Try clearing your search filters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* Creator Tips & Details */}
      <div className="p-4 rounded-xl bg-muted/20 border border-border/60 text-xs text-muted-foreground space-y-2">
        <div className="flex items-center gap-2 font-bold text-foreground">
          <FolderOpen className="w-4 h-4 text-primary" />
          <span>Creator & Developer Integration Guide</span>
        </div>
        <p>
          All 60+ audio assets are located in <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">/public/sounds/</code> and <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">/public/sounds/SFX50+/</code>. 
          You can play them anywhere in your web app using <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">sound.play('sfx_id')</code> or download individual <b>.WAV</b> tracks directly for your video editing timeline.
        </p>
      </div>
    </div>
  );
}
