import React, { useState, useEffect, useRef } from "react";
import { 
  Download, 
  Play, 
  Pause, 
  Music, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  Sparkles, 
  RotateCcw, 
  ExternalLink, 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye, 
  Video, 
  Layers, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  Trash2,
  Volume2,
  FileVideo,
  FileAudio,
  Clipboard,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { sound } from "@/lib/sound";
import { useTaskProgress } from "@/context/TaskProgressContext";
import { TaskProgressCard } from "@/components/TaskProgressCard";
import { VersionBadge } from "@/components/VersionBadge";
import { 
  extractTikTokVideo, 
  downloadTikTokFile, 
  getTikTokDownloadUrl, 
  formatStatNumber, 
  formatFileSize, 
  formatDuration,
  TikTokVideoData,
  MediaFormat,
  MediaQuality
} from "@/api/tiktokApi";

const HISTORY_STORAGE_KEY = "prachurjo_tiktok_history_v1";

export default function TikTokDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<TikTokVideoData | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [history, setHistory] = useState<TikTokVideoData[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<"hd" | "nowm" | "wm">("hd");
  const [targetQuality, setTargetQuality] = useState<MediaQuality>("1080p");
  const [targetFormat, setTargetFormat] = useState<MediaFormat>("mp4");
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [downloadProgressInfo, setDownloadProgressInfo] = useState<{
    progress: number;
    subtitle: string;
    speedStr?: string;
    title: string;
  } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const { toast } = useToast();
  const { startTask, updateTask, completeTask, failTask } = useTaskProgress();

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to history helper
  const saveToHistory = (item: TikTokVideoData) => {
    try {
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.id !== item.id);
        const updated = [item, ...filtered].slice(0, 10);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // ignore
    }
  };

  const clearHistory = () => {
    sound.clear();
    setHistory([]);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([]));
      toast({
        title: "History Cleared",
        description: "Your recent TikTok download history has been removed.",
      });
    } catch {
      // ignore
    }
  };

  // Handle URL extraction
  const handleExtract = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || url).trim();
    if (!targetUrl) {
      sound.error();
      toast({
        title: "Missing Link",
        description: "Please paste a valid TikTok video or photo link.",
        variant: "destructive",
      });
      return;
    }

    sound.click();
    setLoading(true);
    setVideoData(null);
    setIsPlayingAudio(false);

    try {
      const res = await extractTikTokVideo(targetUrl);
      if (res.success && res.data) {
        sound.success();
        setVideoData(res.data);
        saveToHistory(res.data);
        toast({
          title: "Video Ready!",
          description: `Loaded video by @${res.data.author.uniqueId}`,
        });
      } else {
        sound.error();
        toast({
          title: "Extraction Failed",
          description: res.error || "Unable to extract video. Please check the URL.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      sound.error();
      toast({
        title: "Network Error",
        description: err?.message || "Failed to connect to extraction server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy media direct download link
  const [copiedMediaLink, setCopiedMediaLink] = useState(false);

  const handleCopyMediaLink = (mediaUrl: string, label: string) => {
    sound.copy();
    navigator.clipboard.writeText(mediaUrl);
    setCopiedMediaLink(true);
    toast({
      title: "Link Copied!",
      description: `${label} direct download URL copied to clipboard.`,
    });
    setTimeout(() => setCopiedMediaLink(false), 2000);
  };

  // Paste from clipboard
  const handlePasteClipboard = async () => {
    sound.click();
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setUrl(clipText.trim());
          toast({
            title: "Pasted from Clipboard",
            description: clipText.slice(0, 50) + "...",
          });
          // Auto extract if looks like tiktok url
          if (clipText.includes("tiktok.com")) {
            handleExtract(clipText);
          }
        }
      } else {
        toast({
          title: "Clipboard Access",
          description: "Please paste your link manually into the input box.",
        });
      }
    } catch {
      toast({
        title: "Clipboard Notice",
        description: "Clipboard permission not granted. Please press Ctrl+V / Cmd+V.",
      });
    }
  };

  // Handle direct file download with quality and format options
  const handleDownload = async (
    mediaUrl: string, 
    suffix: string, 
    type: "video" | "audio" | "image" = "video",
    overrideFormat?: MediaFormat,
    overrideQuality?: MediaQuality
  ) => {
    if (!videoData || !mediaUrl) return;
    sound.download();
    setDownloadingType(suffix);

    const fmt = overrideFormat || (type === "audio" ? "mp3" : type === "image" ? "jpg" : targetFormat);
    const qual = overrideQuality || targetQuality;

    const safeTitle = (videoData.title || `tiktok_${videoData.id}`)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 40);
    const filename = `prachurjo_tiktok_${videoData.author.uniqueId}_${safeTitle}_${suffix}`;

    const taskTitle = `Downloading TikTok ${type === "audio" ? "Audio (MP3)" : `${qual.toUpperCase()} Video`}`;
    const taskId = startTask({
      title: taskTitle,
      subtitle: `Starting download (${fmt.toUpperCase()})...`,
      category: "download",
      initialProgress: 5,
    });

    setDownloadProgressInfo({
      progress: 10,
      subtitle: "Connecting to media stream...",
      title: taskTitle,
    });

    toast({
      title: "Downloading...",
      description: `Fetching ${qual.toUpperCase()} • ${fmt.toUpperCase()} without watermark.`,
    });

    try {
      const ok = await downloadTikTokFile(
        mediaUrl, 
        filename, 
        type, 
        fmt, 
        qual, 
        (progress, loadedBytes, totalBytes) => {
          const loadedMb = (loadedBytes / (1024 * 1024)).toFixed(1);
          const totalMb = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : "";
          const subtitle = totalBytes > 0 
            ? `${loadedMb} MB / ${totalMb} MB (${progress}%)` 
            : `${loadedMb} MB transferred`;

          updateTask(taskId, {
            progress,
            subtitle,
            loadedBytes,
            totalBytes: totalBytes > 0 ? totalBytes : undefined,
          });

          setDownloadProgressInfo({
            progress,
            subtitle,
            title: taskTitle,
          });
        }
      );

      if (ok) {
        completeTask(taskId, `Saved as ${filename}`);
        setDownloadProgressInfo({
          progress: 100,
          subtitle: "Download completed successfully!",
          title: taskTitle,
        });
      } else {
        failTask(taskId, "Could not fetch media file");
      }
    } catch (err: any) {
      failTask(taskId, err.message || "Failed to download media");
    } finally {
      setTimeout(() => {
        setDownloadingType(null);
        setDownloadProgressInfo(null);
      }, 2500);
    }
  };

  // Audio Play/Pause preview
  const toggleAudioPreview = () => {
    if (!audioRef.current || !videoData?.audioUrl) return;
    sound.tab();

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((e) => {
        console.warn("Audio preview autoplay blocked:", e);
      });
    }
  };

  // Copy caption helper
  const handleCopyCaption = () => {
    if (!videoData?.title) return;
    sound.copy();
    navigator.clipboard.writeText(videoData.title);
    setCopiedCaption(true);
    toast({
      title: "Caption Copied!",
      description: "Video caption and hashtags copied to clipboard.",
    });
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  // Copy shareable link helper
  const handleCopyLink = () => {
    if (!videoData?.sourceUrl) return;
    sound.copy();
    navigator.clipboard.writeText(videoData.sourceUrl);
    setCopiedLink(true);
    toast({
      title: "Link Copied!",
      description: "Original TikTok link copied.",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-10 relative" id="tiktok-downloader-page">
      {/* Top Right Version Badge */}
      <div className="absolute top-2 right-4 z-10">
        <VersionBadge />
      </div>

      {/* 🚀 Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-cyan-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400">
          <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
          <span>100% Free • No Watermark • Ultra HD MP4 & MP3</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground">
          TikTok Video <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-cyan-500 bg-clip-text text-transparent">Downloader</span>
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Download TikTok videos without watermark in Full HD, extract original MP3 background music, save photo carousels, and download high-resolution cover thumbnails instantly.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Badge variant="outline" className="bg-background/60 backdrop-blur border-border/60 text-xs py-1 px-2.5 gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            No Watermark (HD)
          </Badge>
          <Badge variant="outline" className="bg-background/60 backdrop-blur border-border/60 text-xs py-1 px-2.5 gap-1.5">
            <Music className="w-3.5 h-3.5 text-cyan-500" />
            Extract MP3 Audio
          </Badge>
          <Badge variant="outline" className="bg-background/60 backdrop-blur border-border/60 text-xs py-1 px-2.5 gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
            Photo Slideshows
          </Badge>
          <Badge variant="outline" className="bg-background/60 backdrop-blur border-border/60 text-xs py-1 px-2.5 gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            1-Click Direct Download
          </Badge>
        </div>
      </div>

      {/* 📥 Input Card */}
      <Card className="p-4 sm:p-6 bg-card border-border/80 shadow-xl rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExtract();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste TikTok video link here (e.g., https://vt.tiktok.com/... or https://www.tiktok.com/@user/video/...)"
                className="pr-24 h-12 text-sm sm:text-base rounded-xl border-border bg-background/80 focus-visible:ring-pink-500"
                disabled={loading}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {url ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUrl("")}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handlePasteClipboard}
                    className="h-8 px-2.5 text-xs text-pink-600 dark:text-pink-400 hover:bg-pink-500/10 gap-1 font-medium"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    Paste
                  </Button>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !url.trim()}
              className="h-12 px-6 rounded-xl font-bold bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg shadow-pink-500/20 transition-all duration-200 gap-2 shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </Button>
          </div>

          {/* Sample quick test links */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
            <span className="font-medium">Quick Test Sample:</span>
            <button
              type="button"
              onClick={() => {
                const sample = "https://www.tiktok.com/@tiktok/video/7118548953147510043";
                setUrl(sample);
                handleExtract(sample);
              }}
              className="underline hover:text-pink-500 transition-colors"
            >
              Official TikTok Video
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                const sample2 = "https://www.tiktok.com/@scout2015/video/6718335390845095173";
                setUrl(sample2);
                handleExtract(sample2);
              }}
              className="underline hover:text-cyan-500 transition-colors"
            >
              Trending Sound Video
            </button>
          </div>
        </form>
      </Card>

      {/* 🎬 Main Result Section (Video Player & Direct Download Actions) */}
      <AnimatePresence mode="wait">
        {videoData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Responsive In-App Video Player & Cover */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <Card className="w-full max-w-[340px] sm:max-w-[380px] overflow-hidden rounded-2xl border-border shadow-2xl bg-black relative aspect-[9/16] flex items-center justify-center">
                  {videoData.videoUrl ? (
                    <video
                      ref={videoPlayerRef}
                      src={(selectedQuality === "hd" && videoData.videoHdUrl ? videoData.videoHdUrl : videoData.videoUrl) || undefined}
                      poster={videoData.cover || undefined}
                      controls
                      controlsList="nodownload"
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <img
                      src={videoData.cover || undefined}
                      alt={videoData.title}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Quality overlay badge */}
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <Badge className="bg-black/70 backdrop-blur text-white text-[11px] border-white/20 font-bold">
                      {selectedQuality === "hd" ? "Ultra HD 1080p" : "Standard MP4"}
                    </Badge>
                  </div>

                  {videoData.duration > 0 && (
                    <div className="absolute top-3 right-3 pointer-events-none">
                      <Badge className="bg-black/70 backdrop-blur text-white text-[11px] border-white/20 font-mono gap-1">
                        <Clock className="w-3 h-3 text-pink-400" />
                        {formatDuration(videoData.duration)}
                      </Badge>
                    </div>
                  )}
                </Card>

                {/* Quality switcher tabs */}
                <div className="flex items-center gap-2 mt-3 bg-muted/60 p-1 rounded-xl border border-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      sound.tab();
                      setSelectedQuality("hd");
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      selectedQuality === "hd"
                        ? "bg-pink-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    HD (No Watermark)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.tab();
                      setSelectedQuality("nowm");
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      selectedQuality === "nowm"
                        ? "bg-pink-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Standard
                  </button>
                </div>
              </div>

              {/* Right Column: Video Details & 1-Click Action Buttons */}
              <div className="lg:col-span-7 space-y-6">
                {/* Author Profile Header */}
                <Card className="p-4 sm:p-5 rounded-2xl border-border/80 bg-card/80 backdrop-blur flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={videoData.author.avatar || videoData.cover || undefined}
                        alt={videoData.author.nickname}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-pink-500/40"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60";
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-pink-500 text-white p-0.5 rounded-full">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground text-base sm:text-lg truncate">
                        {videoData.author.nickname || "TikTok Creator"}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        @{videoData.author.uniqueId}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://www.tiktok.com/@${videoData.author.uniqueId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => sound.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/60 transition-colors shrink-0"
                  >
                    <span>Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Card>

                {/* Video Caption & Copy Button */}
                <Card className="p-4 sm:p-5 rounded-2xl border-border/80 bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Video Description / Caption
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCaption}
                      className="h-7 px-2 text-xs gap-1 text-pink-600 dark:text-pink-400 hover:bg-pink-500/10"
                    >
                      {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCaption ? "Copied" : "Copy Caption"}</span>
                    </Button>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {videoData.title || "No description provided."}
                  </p>
                </Card>

                {/* Video Statistics Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-card border border-border/70 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium mb-1">
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      <span>Views</span>
                    </div>
                    <span className="text-base font-bold text-foreground font-mono">
                      {formatStatNumber(videoData.stats.playCount)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/70 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium mb-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>Likes</span>
                    </div>
                    <span className="text-base font-bold text-foreground font-mono">
                      {formatStatNumber(videoData.stats.diggCount)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/70 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium mb-1">
                      <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Comments</span>
                    </div>
                    <span className="text-base font-bold text-foreground font-mono">
                      {formatStatNumber(videoData.stats.commentCount)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/70 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium mb-1">
                      <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Shares</span>
                    </div>
                    <span className="text-base font-bold text-foreground font-mono">
                      {formatStatNumber(videoData.stats.shareCount)}
                    </span>
                  </div>
                </div>

                {/* 🚀 Active Download Live Progress Feedback Card */}
                <AnimatePresence>
                  {downloadProgressInfo && (
                    <TaskProgressCard
                      progress={downloadProgressInfo.progress}
                      title={downloadProgressInfo.title}
                      subtitle={downloadProgressInfo.subtitle}
                      status={downloadProgressInfo.progress === 100 ? "completed" : "running"}
                      speedStr={downloadProgressInfo.speedStr}
                      accentColor="pink"
                      className="mb-2"
                    />
                  )}
                </AnimatePresence>

                {/* 🎛️ Quality & Format Options Selector Dropdown Panel */}
                <Card className="p-4 sm:p-5 rounded-2xl border-pink-500/25 bg-gradient-to-br from-pink-500/5 via-purple-500/5 to-transparent space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-500" />
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Download Quality & Format Settings
                      </h4>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-pink-500/40 text-pink-600 dark:text-pink-400 font-mono">
                      {targetQuality} • {targetFormat.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Quality Dropdown */}
                    <div className="space-y-1.5">
                      <label htmlFor="quality-select" className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                        <span>Video Quality / Resolution</span>
                        <span className="text-[10px] text-pink-500 font-semibold font-mono">{targetQuality}</span>
                      </label>
                      <select
                        id="quality-select"
                        value={targetQuality}
                        onChange={(e) => {
                          sound.tab();
                          setTargetQuality(e.target.value as MediaQuality);
                        }}
                        className="w-full h-11 px-3 py-2 rounded-xl text-xs font-semibold bg-background border border-border/80 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-foreground transition-all cursor-pointer shadow-sm"
                      >
                        <option value="1080p">1080p (Full HD - High Bitrate)</option>
                        <option value="720p">720p (HD - Standard Quality)</option>
                        <option value="480p">480p (SD - Data Saver)</option>
                        <option value="360p">360p (Mobile - Low Bandwidth)</option>
                      </select>
                    </div>

                    {/* Format Dropdown */}
                    <div className="space-y-1.5">
                      <label htmlFor="format-select" className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                        <span>Output Format</span>
                        <span className="text-[10px] text-purple-500 font-semibold font-mono">{targetFormat.toUpperCase()}</span>
                      </label>
                      <select
                        id="format-select"
                        value={targetFormat}
                        onChange={(e) => {
                          sound.tab();
                          setTargetFormat(e.target.value as MediaFormat);
                        }}
                        className="w-full h-11 px-3 py-2 rounded-xl text-xs font-semibold bg-background border border-border/80 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-foreground transition-all cursor-pointer shadow-sm"
                      >
                        <option value="mp4">MP4 (Universal Video)</option>
                        <option value="webm">WebM (VP9 Web Video)</option>
                        <option value="mp3">MP3 (Audio Only - Sound)</option>
                        <option value="m4a">M4A (AAC Audio)</option>
                        <option value="wav">WAV (Lossless Audio)</option>
                      </select>
                    </div>
                  </div>

                  {/* Primary Download Trigger & Copy Link */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="lg"
                      onClick={() => {
                        const isAudio = targetFormat === "mp3" || targetFormat === "m4a" || targetFormat === "wav";
                        const mediaUrl = isAudio 
                          ? (videoData.audioUrl || videoData.videoUrl) 
                          : (targetQuality === "1080p" && videoData.videoHdUrl ? videoData.videoHdUrl : videoData.videoUrl);
                        handleDownload(mediaUrl, `${targetQuality}_${targetFormat}`, isAudio ? "audio" : "video", targetFormat, targetQuality);
                      }}
                      disabled={downloadingType === `${targetQuality}_${targetFormat}`}
                      className="flex-1 h-12 rounded-xl font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>
                        Download {targetQuality.toUpperCase()} ({targetFormat.toUpperCase()})
                      </span>
                    </Button>

                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        const isAudio = targetFormat === "mp3" || targetFormat === "m4a" || targetFormat === "wav";
                        const mediaUrl = isAudio 
                          ? (videoData.audioUrl || videoData.videoUrl) 
                          : (targetQuality === "1080p" && videoData.videoHdUrl ? videoData.videoHdUrl : videoData.videoUrl);
                        handleCopyMediaLink(mediaUrl, `${targetQuality} ${targetFormat.toUpperCase()}`);
                      }}
                      title="Copy direct download link to clipboard"
                      className="h-12 px-4 rounded-xl font-bold border-pink-500/30 hover:bg-pink-500/10 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {copiedMediaLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-pink-500" />}
                      <span className="hidden sm:inline">{copiedMediaLink ? "Copied" : "Copy Link"}</span>
                    </Button>
                  </div>
                </Card>

                {/* 🎯 Quick Action Download Presets Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Quick Preset Download Buttons
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary Button: HD No Watermark */}
                    <Button
                      size="lg"
                      onClick={() => handleDownload(videoData.videoHdUrl || videoData.videoUrl, "hd_nowm", "video")}
                      disabled={downloadingType === "hd_nowm"}
                      className="h-14 rounded-xl font-bold bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg shadow-pink-500/25 flex items-center justify-between px-4 sm:px-5"
                    >
                      <div className="flex items-center gap-2.5">
                        <Download className="w-5 h-5" />
                        <div className="text-left">
                          <div className="text-sm leading-tight">Download HD (No Watermark)</div>
                          <div className="text-[11px] opacity-80 font-normal">Ultra High Quality MP4</div>
                        </div>
                      </div>
                      {videoData.size.hd > 0 && (
                        <Badge className="bg-black/30 text-white text-[10px] font-mono border-0">
                          {formatFileSize(videoData.size.hd)}
                        </Badge>
                      )}
                    </Button>

                    {/* Standard No Watermark */}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleDownload(videoData.videoUrl, "nowm", "video")}
                      disabled={downloadingType === "nowm"}
                      className="h-14 rounded-xl font-semibold border-border hover:border-pink-500/50 hover:bg-pink-500/5 flex items-center justify-between px-4 sm:px-5 text-foreground"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileVideo className="w-5 h-5 text-pink-500" />
                        <div className="text-left">
                          <div className="text-sm leading-tight">Download Standard MP4</div>
                          <div className="text-[11px] text-muted-foreground font-normal">Fast & Compact Size</div>
                        </div>
                      </div>
                      {videoData.size.nowm > 0 && (
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {formatFileSize(videoData.size.nowm)}
                        </Badge>
                      )}
                    </Button>

                    {/* MP3 Audio Download */}
                    {videoData.audioUrl && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleDownload(videoData.audioUrl, "audio", "audio")}
                        disabled={downloadingType === "audio"}
                        className="h-14 rounded-xl font-semibold border-border hover:border-cyan-500/50 hover:bg-cyan-500/5 flex items-center justify-between px-4 sm:px-5 text-foreground"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileAudio className="w-5 h-5 text-cyan-500" />
                          <div className="text-left">
                            <div className="text-sm leading-tight">Download Audio (MP3)</div>
                            <div className="text-[11px] text-muted-foreground font-normal truncate max-w-[140px]">
                              {videoData.musicInfo.title}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 text-[10px]">
                          MP3
                        </Badge>
                      </Button>
                    )}

                    {/* HD Cover Thumbnail */}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleDownload(videoData.originCover || videoData.cover, "cover", "image")}
                      disabled={downloadingType === "cover"}
                      className="h-14 rounded-xl font-semibold border-border hover:border-purple-500/50 hover:bg-purple-500/5 flex items-center justify-between px-4 sm:px-5 text-foreground"
                    >
                      <div className="flex items-center gap-2.5">
                        <ImageIcon className="w-5 h-5 text-purple-500" />
                        <div className="text-left">
                          <div className="text-sm leading-tight">Download HD Cover</div>
                          <div className="text-[11px] text-muted-foreground font-normal">Original Thumbnail</div>
                        </div>
                      </div>
                      <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[10px]">
                        JPG
                      </Badge>
                    </Button>
                  </div>
                </div>

                {/* 🎵 Audio Preview Player Card */}
                {videoData.audioUrl && (
                  <Card className="p-4 rounded-2xl border-cyan-500/30 bg-cyan-500/5 space-y-3">
                    <audio
                      ref={audioRef}
                      src={videoData.audioUrl || undefined}
                      onEnded={() => setIsPlayingAudio(false)}
                      onPause={() => setIsPlayingAudio(false)}
                      onPlay={() => setIsPlayingAudio(true)}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={toggleAudioPreview}
                          className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md hover:bg-cyan-600 transition-transform active:scale-95 shrink-0"
                        >
                          {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            Original Background Sound
                          </div>
                          <div className="text-sm font-semibold text-foreground truncate">
                            {videoData.musicInfo.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            by {videoData.musicInfo.author}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(videoData.audioUrl, "audio", "audio")}
                        className="h-8 px-3 text-xs gap-1.5 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save MP3</span>
                      </Button>
                    </div>
                  </Card>
                )}

                {/* 📸 Photo Slideshow / Carousel Gallery (If image post) */}
                {videoData.isSlideShow && videoData.images.length > 0 && (
                  <Card className="p-5 rounded-2xl border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-purple-500" />
                        <h4 className="font-bold text-foreground text-sm sm:text-base">
                          Photo Slideshow Gallery ({videoData.images.length} Images)
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {videoData.images.map((imgUrl, index) => (
                        <div
                          key={index}
                          className="group relative rounded-xl overflow-hidden aspect-[3/4] bg-muted border border-border shadow-sm"
                        >
                          <img
                            src={imgUrl || undefined}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <Button
                              size="sm"
                              onClick={() => handleDownload(imgUrl, `slide_${index + 1}`, "image")}
                              className="h-8 px-3 text-xs bg-white text-black hover:bg-white/90 gap-1.5 font-bold shadow-lg"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Save #{index + 1}</span>
                            </Button>
                          </div>
                          <Badge className="absolute top-2 left-2 bg-black/70 text-white text-[10px] pointer-events-none">
                            #{index + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🕒 Recent Downloads History */}
      {history.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-bold text-foreground text-base">Recent TikTok Downloads</h3>
              <Badge variant="outline" className="text-xs">{history.length}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item) => (
              <Card
                key={item.id}
                onClick={() => {
                  sound.click();
                  setVideoData(item);
                  setUrl(item.sourceUrl);
                  window.scrollTo({ top: 180, behavior: "smooth" });
                }}
                className="p-3 rounded-xl border-border/80 hover:border-pink-500/40 transition-all cursor-pointer bg-card/60 hover:bg-card flex items-center gap-3 group"
              >
                <div className="relative w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-black">
                  <img
                    src={item.cover || undefined}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                    <Play className="w-5 h-5 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-xs font-bold text-foreground truncate">
                    @{item.author.uniqueId}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                    {item.title || "TikTok Video"}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                    <span>❤️ {formatStatNumber(item.stats.diggCount)}</span>
                    <span>•</span>
                    <span>👁️ {formatStatNumber(item.stats.playCount)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 📖 How to Download TikTok Videos Guide & FAQ */}
      <div className="pt-8 border-t border-border/60 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            How to Download TikTok Videos Without Watermark?
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Follow these 3 simple steps to save any TikTok video directly to your phone, tablet, or computer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 rounded-2xl border-border/80 bg-card/50 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 font-black text-xl flex items-center justify-center mx-auto">
              1
            </div>
            <h3 className="font-bold text-foreground text-base">Copy TikTok Link</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Open TikTok on your app or browser, click the <strong>Share</strong> button on your favorite video, and tap <strong>Copy Link</strong>.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl border-border/80 bg-card/50 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 font-black text-xl flex items-center justify-center mx-auto">
              2
            </div>
            <h3 className="font-bold text-foreground text-base">Paste Link Above</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Paste the copied URL into the box above and click the pink <strong>Download</strong> button.
            </p>
          </Card>

          <Card className="p-6 rounded-2xl border-border/80 bg-card/50 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 font-black text-xl flex items-center justify-center mx-auto">
              3
            </div>
            <h3 className="font-bold text-foreground text-base">Save Video or MP3</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Preview the video in the player and click <strong>Download HD (No Watermark)</strong> to save it in high quality!
            </p>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="p-6 sm:p-8 rounded-2xl border-border/80 bg-card space-y-6">
          <div className="flex items-center gap-2 text-foreground font-bold text-lg">
            <HelpCircle className="w-5 h-5 text-pink-500" />
            <span>Frequently Asked Questions (FAQ)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1.5">
              <h4 className="font-bold text-foreground">Is this TikTok Downloader 100% Free?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes! Prachurjo TikTok Downloader is completely free with unlimited downloads. No sign-up, subscription, or software installation is required.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-foreground">Does it remove the TikTok watermark and logo?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes. Our engine extracts the clean, original CDN stream directly from TikTok servers, eliminating all logos and bouncing user watermarks.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-foreground">How to save videos on iPhone / iOS?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Open Safari on iOS 13+, paste the link, tap Download HD. The video will be saved directly into your Safari Downloads or Photos app.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-foreground">Can I download TikTok MP3 sounds and songs?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes! Just click the "Download Audio (MP3)" button to extract only the background music or voice in crystal-clear MP3 format.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
