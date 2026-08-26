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
  Clock,
  Instagram,
  User,
  Film
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
  extractInstagramVideo,
  downloadInstagramFile,
  getInstagramDownloadUrl,
  InstagramVideoData,
  MediaFormat
} from "@/api/instagramApi";

const HISTORY_STORAGE_KEY = "prachurjo_instagram_history_v1";

export default function InstagramDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<InstagramVideoData | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [history, setHistory] = useState<InstagramVideoData[]>([]);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [downloadProgressInfo, setDownloadProgressInfo] = useState<{
    progress: number;
    subtitle: string;
    speedStr?: string;
    title: string;
  } | null>(null);

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
  const saveToHistory = (item: InstagramVideoData) => {
    try {
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.sourceUrl !== item.sourceUrl);
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
        description: "Your recent Instagram download history has been removed.",
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
        description: "Please paste a valid Instagram video, photo, or Reel link.",
        variant: "destructive",
      });
      return;
    }

    sound.click();
    setLoading(true);
    setVideoData(null);

    try {
      const res = await extractInstagramVideo(targetUrl);
      if (res.success && res.data) {
        sound.success();
        setVideoData(res.data);
        saveToHistory(res.data);
        toast({
          title: "Extraction Complete!",
          description: "Media found successfully. Ready to download.",
        });
      } else {
        sound.error();
        toast({
          title: "Extraction Failed",
          description: res.error || "Unable to extract Instagram video. Make sure the post is public.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      sound.error();
      toast({
        title: "Connection Error",
        description: err?.message || "Failed to reach extraction server.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
          if (clipText.includes("instagram.com")) {
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

  // Handle direct file download
  const handleDownload = async (
    mediaUrl: string,
    suffix: string,
    type: "video" | "audio" | "image" = "video",
    format: MediaFormat = "mp4"
  ) => {
    if (!videoData || !mediaUrl) return;
    sound.download();
    setDownloadingType(suffix);

    const safeTitle = (videoData.title || `instagram_${videoData.id}`)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 40);
    const filename = `prachurjo_instagram_${safeTitle}_${suffix}`;

    const taskTitle = `Downloading Instagram ${type === "audio" ? "Audio (MP3)" : type === "image" ? "Photo (JPG)" : "Video (MP4)"}`;
    const taskId = startTask({
      title: taskTitle,
      subtitle: `Starting download (${format.toUpperCase()})...`,
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
      description: `Fetching ${type === "audio" ? "Audio" : "Media"} file via high-speed proxy.`,
    });

    try {
      const ok = await downloadInstagramFile(
        mediaUrl,
        filename,
        type,
        format,
        (progress, loadedBytes, totalBytes) => {
          const loadedMb = (loadedBytes / (1024 * 1024)).toFixed(1);
          const totalMb = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : "";
          const subtitle = totalBytes > 0
            ? `${loadedMb} MB / ${totalMb} MB (${progress}%)`
            : `${loadedMb} MB transferred`;

          updateTask(taskId, {
            progress,
            subtitle,
          });

          setDownloadProgressInfo({
            progress,
            subtitle,
            title: taskTitle,
          });
        }
      );

      if (ok) {
        sound.success();
        completeTask(taskId, "Download complete!");
        toast({
          title: "Download Success!",
          description: "Media downloaded safely to your device.",
        });
      } else {
        throw new Error("Local write failed or download timed out.");
      }
    } catch (err: any) {
      sound.error();
      failTask(taskId, err?.message || "Extraction Failed");
      toast({
        title: "Download Failed",
        description: "Standard proxy failed. Trying fallback direct stream link...",
        variant: "destructive",
      });
      // Fallback: direct window redirect download
      window.open(getInstagramDownloadUrl(mediaUrl, filename, type, format), "_blank");
    } finally {
      setDownloadingType(null);
      setDownloadProgressInfo(null);
    }
  };

  const copyToClipboard = (text: string, type: "caption" | "link") => {
    sound.success();
    navigator.clipboard.writeText(text);
    if (type === "caption") {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
      toast({ title: "Caption Copied", description: "Saved description to your clipboard." });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast({ title: "Source Link Copied", description: "Saved Instagram link to your clipboard." });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 relative" id="instagram-downloader-container">
      {/* Top Right Version Badge */}
      <div className="absolute top-2 right-4 z-10">
        <VersionBadge />
      </div>

      {/* Temporary Maintenance Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-900 dark:text-amber-200 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Tool Temporarily Offline for Server Maintenance</p>
            <p className="text-xs text-amber-700 dark:text-amber-300/90">
              The Instagram Downloader backend is undergoing upgrades. Please check back later or use our TikTok Downloader.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = "/tiktok-downloader"}
          className="border-amber-500/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 shrink-0 text-xs font-semibold rounded-xl"
        >
          Try TikTok Downloader →
        </Button>
      </div>

      {/* Premium Elegant Header */}
      <div className="text-center mb-10" id="ig-header-block">
        <div className="inline-flex items-center justify-center p-3.5 bg-pink-500/10 dark:bg-pink-500/15 rounded-2xl mb-4 text-pink-600 dark:text-pink-400 border border-pink-500/20" id="ig-icon-p">
          <Instagram className="h-9 w-9 animate-pulse" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 mb-3" id="ig-title">
          Instagram Video Downloader
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto text-base" id="ig-subtitle">
          Download high-quality Instagram Reels, Videos, and Photos with 1-click on-the-fly MP3 extraction.
        </p>
      </div>

      {/* Input Section */}
      <Card className="p-5 bg-white dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 shadow-sm mb-10" id="ig-input-card">
        <div className="flex flex-col md:flex-row gap-3.5" id="ig-input-row">
          <div className="relative flex-1" id="ig-input-wrapper">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400" id="ig-input-icon">
              <Instagram className="h-5 w-5" />
            </div>
            <Input
              type="text"
              placeholder="Paste Instagram post, video, photo or Reel link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-11 pr-24 py-6 bg-neutral-50 dark:bg-neutral-950/40 border-neutral-200 dark:border-neutral-800 text-base rounded-xl focus-visible:ring-pink-500/30 focus-visible:border-pink-500"
              id="ig-url-input"
            />
            {url && (
              <button
                onClick={() => {
                  setUrl("");
                  sound.clear();
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                id="ig-input-clear"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex gap-2" id="ig-input-buttons">
            <Button
              type="button"
              variant="outline"
              onClick={handlePasteClipboard}
              className="px-4 py-6 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 rounded-xl"
              id="ig-paste-btn"
            >
              <Clipboard className="h-4.5 w-4.5 mr-2" />
              Paste
            </Button>
            <Button
              onClick={() => handleExtract()}
              disabled={loading || !url.trim()}
              className="px-6 py-6 bg-pink-600 hover:bg-pink-700 dark:bg-pink-600 dark:hover:bg-pink-700 text-white rounded-xl transition-all shadow-md shadow-pink-500/10 font-medium"
              id="ig-extract-btn"
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5 mr-2" />
                  Extract
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Task Progress HUD Fallback inside page */}
      <AnimatePresence mode="wait">
        {downloadProgressInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-8"
            id="ig-progress-card"
          >
            <TaskProgressCard
              title={downloadProgressInfo.title}
              subtitle={downloadProgressInfo.subtitle}
              progress={downloadProgressInfo.progress}
              status="running"
              accentColor="pink"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Display Section */}
      <AnimatePresence mode="wait">
        {videoData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            id="ig-result-motion"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12" id="ig-result-grid">
              {/* Media Preview Column */}
              <div className="lg:col-span-5 flex flex-col gap-4" id="ig-preview-col">
                <Card className="overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-black rounded-2xl relative shadow-md aspect-[4/5] flex items-center justify-center" id="ig-preview-card">
                  {videoData.videoUrl ? (
                    <video
                      ref={videoPlayerRef}
                      src={videoData.videoUrl || undefined}
                      poster={videoData.thumbnailUrl || undefined}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={videoData.thumbnailUrl || undefined}
                      alt="Instagram Content Thumbnail"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  )}
                  {!videoData.videoUrl && (
                    <div className="absolute top-3 right-3" id="ig-type-badge">
                      <Badge className="bg-pink-600 text-white border-none py-1 px-2.5 rounded-lg text-xs font-semibold uppercase">
                        Photo
                      </Badge>
                    </div>
                  )}
                </Card>
              </div>

              {/* Media Actions & Info Column */}
              <div className="lg:col-span-7 flex flex-col justify-between" id="ig-info-col">
                <div className="space-y-6" id="ig-info-inner">
                  {/* Account Header */}
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/80 pb-4" id="ig-author-block">
                    <div className="flex items-center gap-3" id="ig-author-info">
                      <div className="w-11 h-11 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center border border-pink-500/10 text-pink-600 dark:text-pink-400 font-bold" id="ig-avatar">
                        <User className="h-5 w-5" />
                      </div>
                      <div id="ig-author-names">
                        <h3 className="font-bold text-neutral-800 dark:text-neutral-100 text-lg flex items-center">
                          {videoData.author.name}
                        </h3>
                        <p className="text-neutral-400 dark:text-neutral-500 text-xs">Instagram Public Creator</p>
                      </div>
                    </div>
                    <div id="ig-verified-badge">
                      <Badge variant="outline" className="border-pink-500/20 text-pink-600 bg-pink-50/50 dark:text-pink-400 dark:bg-pink-900/20 font-medium py-1 px-2.5 rounded-lg">
                        <Film className="h-3.5 w-3.5 mr-1" />
                        Public Media
                      </Badge>
                    </div>
                  </div>

                  {/* Caption & Metadata */}
                  <div className="space-y-3" id="ig-caption-block">
                    <div className="flex items-center justify-between" id="ig-caption-header">
                      <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Caption / Description</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(videoData.title, "caption")}
                        className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 text-xs"
                        id="ig-copy-caption"
                      >
                        {copiedCaption ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        Copy Caption
                      </Button>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed max-h-36 overflow-y-auto bg-neutral-50 dark:bg-neutral-950/30 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800/50" id="ig-caption-text">
                      {videoData.title || "No description provided."}
                    </p>
                  </div>

                  {/* Multiple Media / Carousel list if present */}
                  {videoData.mediaList && videoData.mediaList.length > 1 && (
                    <div className="space-y-3" id="ig-carousel-block">
                      <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">
                        Carousel Items Detected ({videoData.mediaList.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1" id="ig-carousel-items">
                        {videoData.mediaList.map((media, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square bg-neutral-900 rounded-xl overflow-hidden group border border-neutral-200 dark:border-neutral-800 cursor-pointer"
                            onClick={() => {
                              sound.click();
                              if (media.type === "video") {
                                setVideoData({
                                  ...videoData,
                                  videoUrl: media.url,
                                  thumbnailUrl: media.thumbnail || media.url,
                                });
                              } else {
                                setVideoData({
                                  ...videoData,
                                  videoUrl: "",
                                  thumbnailUrl: media.url,
                                });
                              }
                              toast({
                                title: `Switched to item #${idx + 1}`,
                                description: `Showing Instagram ${media.type === "video" ? "Video" : "Photo"}.`,
                              });
                            }}
                            id={`ig-carousel-item-${idx}`}
                          >
                            <img
                              src={media.thumbnail || media.url}
                              alt={`Item ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs" id={`ig-carousel-hover-${idx}`}>
                              View #{idx + 1}
                            </div>
                            <div className="absolute bottom-1 right-1" id={`ig-carousel-badge-${idx}`}>
                              <Badge className="bg-neutral-950/80 text-[10px] px-1 py-0 border-none font-semibold uppercase">
                                {media.type}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats Badges */}
                  <div className="flex flex-wrap gap-2 pt-1" id="ig-stats-row">
                    <div id="ig-stat-likes">
                      <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-200/40 dark:border-neutral-700/30 text-xs font-semibold">
                        <Heart className="h-3.5 w-3.5 mr-1 text-red-500 animate-heartbeat" />
                        Direct Link
                      </Badge>
                    </div>
                    <div id="ig-stat-comments">
                      <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-200/40 dark:border-neutral-700/30 text-xs font-semibold">
                        <MessageCircle className="h-3.5 w-3.5 mr-1 text-sky-500" />
                        Unlimited
                      </Badge>
                    </div>
                    <div id="ig-stat-verified">
                      <Badge variant="secondary" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-200/40 dark:border-neutral-700/30 text-xs font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5 mr-1 text-green-500" />
                        100% Secure
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Primary Download Actions */}
                <div className="space-y-3 pt-6 border-t border-neutral-100 dark:border-neutral-800/80" id="ig-download-actions">
                  {videoData.videoUrl ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="ig-media-buttons">
                      <Button
                        onClick={() => handleDownload(videoData.videoUrl, "hd_video", "video", "mp4")}
                        disabled={downloadingType !== null}
                        className="w-full py-6 bg-pink-600 hover:bg-pink-700 dark:bg-pink-600 dark:hover:bg-pink-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                        id="ig-download-video-btn"
                      >
                        {downloadingType === "hd_video" ? (
                          <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <FileVideo className="h-5 w-5" />
                        )}
                        Download Video (MP4)
                      </Button>

                      {/* Transcode to real stereo MP3 using FFmpeg */}
                      <Button
                        onClick={() => handleDownload(videoData.videoUrl, "extract_mp3", "audio", "mp3")}
                        disabled={downloadingType !== null}
                        className="w-full py-6 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                        id="ig-extract-audio-btn"
                      >
                        {downloadingType === "extract_mp3" ? (
                          <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Music className="h-5 w-5" />
                        )}
                        Extract Audio (MP3)
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleDownload(videoData.thumbnailUrl, "photo_jpg", "image", "jpg")}
                      disabled={downloadingType !== null}
                      className="w-full py-6 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                      id="ig-download-photo-btn"
                    >
                      {downloadingType === "photo_jpg" ? (
                        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <ImageIcon className="h-5 w-5" />
                      )}
                      Download High-Res Image (JPG)
                    </Button>
                  )}

                  {videoData.videoUrl && (
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(videoData.thumbnailUrl, "cover_jpg", "image", "jpg")}
                      disabled={downloadingType !== null}
                      className="w-full py-6 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 rounded-xl flex items-center justify-center gap-2 text-neutral-700 dark:text-neutral-200 font-semibold"
                      id="ig-download-thumbnail-btn"
                    >
                      <ImageIcon className="h-5 w-5" />
                      Download Video Thumbnail (Cover)
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download History Section */}
      {history.length > 0 && (
        <div className="mb-14" id="ig-history-section">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3.5 mb-5" id="ig-history-header">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-pink-600" />
              Recent Downloads History
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors text-xs"
              id="ig-clear-history-btn"
            >
              <Trash2 className="h-4.5 w-4.5 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="ig-history-grid">
            {history.map((item, idx) => (
              <Card
                key={idx}
                className="overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 hover:bg-white dark:hover:bg-neutral-900 hover:shadow-sm cursor-pointer transition-all rounded-xl relative group flex flex-col justify-between"
                onClick={() => {
                  sound.click();
                  setVideoData(item);
                  setUrl(item.sourceUrl);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                id={`ig-history-card-${idx}`}
              >
                <div className="relative aspect-video bg-black overflow-hidden" id={`ig-history-thumb-${idx}`}>
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  {item.videoUrl && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" id={`ig-history-play-overlay-${idx}`}>
                      <Play className="h-8 w-8 text-white fill-white" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2" id={`ig-history-type-badge-${idx}`}>
                    <Badge className="bg-black/70 text-[10px] px-1.5 py-0 border-none font-bold uppercase">
                      {item.videoUrl ? "Video" : "Photo"}
                    </Badge>
                  </div>
                </div>
                <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between" id={`ig-history-info-${idx}`}>
                  <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm line-clamp-1 group-hover:text-pink-600 transition-colors">
                    {item.title || "Instagram Post"}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-neutral-400 dark:text-neutral-500" id={`ig-history-footer-${idx}`}>
                    <span className="font-medium">@{item.author.name}</span>
                    <span className="flex items-center text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                      Loaded
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Rich SEO Accordion FAQ & Guidelines */}
      <div className="space-y-6 pt-10 border-t border-neutral-200 dark:border-neutral-800" id="ig-faq-section">
        <div className="text-center max-w-xl mx-auto mb-8" id="ig-faq-header">
          <h2 className="text-2xl font-bold text-neutral-950 dark:text-neutral-50 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Everything you need to know about using Prachurjo Instagram Downloader.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="ig-faq-grid">
          <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20" id="ig-faq-1">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-50 text-base mb-2">
              Is this downloader free to use?
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
              Yes, our Instagram Downloader is 100% free with unlimited extractions. We do not require any signup, keys, or browser session cookies to save public posts.
            </p>
          </Card>

          <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20" id="ig-faq-2">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-50 text-base mb-2">
              Can I extract MP3 audio from Instagram Reels?
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
              Absolutely! Our server features on-the-fly, high-performance FFmpeg transcoding. Clicking "Extract Audio" separates and converts the stereo audio channel into a pure, clean MP3.
            </p>
          </Card>

          <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20" id="ig-faq-3">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-50 text-base mb-2">
              Does it support carousel posts with multiple images/videos?
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
              Yes! If an Instagram link belongs to a carousel, the downloader automatically detects all items and displays them as a quick-select gallery grid below the caption.
            </p>
          </Card>

          <Card className="p-5 border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20" id="ig-faq-4">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-50 text-base mb-2">
              Can I download private Instagram content?
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
              No, our downloader only supports public accounts, Reels, and public posts due to privacy settings and API access constraints.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
