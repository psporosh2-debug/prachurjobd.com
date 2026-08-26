import React, { useState, useEffect, useRef } from "react";
import { 
  Download, 
  Play, 
  Pause, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  Sparkles, 
  RotateCcw, 
  ExternalLink, 
  Video, 
  HelpCircle, 
  ShieldCheck, 
  Zap, 
  Trash2,
  FileVideo,
  FileAudio,
  Clipboard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pin
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
  extractPinterestVideo, 
  downloadPinterestFile, 
  getPinterestDownloadUrl, 
  formatDuration,
  PinterestVideoData,
  MediaFormat,
  isValidPinterestUrl
} from "@/api/pinterestApi";

const PINTEREST_HISTORY_KEY = "prachurjo_pinterest_history_v1";

export default function PinterestDownloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<PinterestVideoData | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [history, setHistory] = useState<PinterestVideoData[]>([]);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [downloadProgressInfo, setDownloadProgressInfo] = useState<{
    progress: number;
    subtitle: string;
    title: string;
  } | null>(null);

  const { toast } = useToast();
  const { startTask, updateTask, completeTask, failTask } = useTaskProgress();

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PINTEREST_HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load Pinterest history:", e);
    }
  }, []);

  // Save to history helper
  const saveToHistory = (item: PinterestVideoData) => {
    try {
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.id !== item.id && h.sourceUrl !== item.sourceUrl);
        const updated = [item, ...filtered].slice(0, 10);
        localStorage.setItem(PINTEREST_HISTORY_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.warn("Could not save to history:", e);
    }
  };

  const clearHistory = () => {
    sound.clear();
    setHistory([]);
    try {
      localStorage.setItem(PINTEREST_HISTORY_KEY, JSON.stringify([]));
      toast({
        title: "History Cleared",
        description: "Your Pinterest download history has been removed.",
      });
    } catch {
      // ignore
    }
  };

  // Extract video details
  const handleExtract = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || url).trim();
    if (!targetUrl) {
      sound.error();
      toast({
        title: "Missing Link",
        description: "Please paste a valid Pinterest Pin link.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidPinterestUrl(targetUrl)) {
      sound.error();
      toast({
        title: "Invalid URL",
        description: "Please paste a valid Pinterest URL (e.g. pin.it/... or pinterest.com/pin/...)",
        variant: "destructive",
      });
      return;
    }

    sound.click();
    setLoading(true);
    setVideoData(null);

    try {
      const res = await extractPinterestVideo(targetUrl);
      if (res.success && res.data) {
        sound.success();
        setVideoData(res.data);
        saveToHistory(res.data);
        toast({
          title: "Video Extracted!",
          description: res.data.title || "Ready to download",
        });
      } else {
        sound.error();
        toast({
          title: "Extraction Failed",
          description: res.error || "Could not find video in this Pin. Check if it's a video pin.",
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

  // Paste clipboard
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
          if (isValidPinterestUrl(clipText)) {
            handleExtract(clipText);
          }
        }
      } else {
        toast({
          title: "Clipboard Access",
          description: "Please paste your link manually into the field.",
        });
      }
    } catch {
      toast({
        title: "Clipboard Notice",
        description: "Clipboard permission not granted. Please paste manually.",
      });
    }
  };

  // Handle Download Trigger
  const handleDownload = async (
    mediaUrl: string, 
    suffix: string, 
    type: "video" | "audio" | "image" = "video",
    overrideFormat?: MediaFormat
  ) => {
    if (!videoData || !mediaUrl) return;
    sound.download();
    setDownloadingType(suffix);

    const fmt = overrideFormat || (type === "audio" ? "mp3" : type === "image" ? "jpg" : "mp4");
    const safeTitle = (videoData.title || `pinterest_${videoData.id}`)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 40);
    const filename = `prachurjo_pinterest_${safeTitle}_${suffix}`;

    const taskTitle = `Downloading Pinterest ${type === "audio" ? "Audio (MP3)" : type === "image" ? "Cover (JPG)" : "HD Video (MP4)"}`;
    const taskId = startTask({
      title: taskTitle,
      subtitle: `Starting download (${fmt.toUpperCase()})...`,
      category: "download",
      initialProgress: 5,
    });

    setDownloadProgressInfo({
      progress: 10,
      subtitle: "Connecting to Pinterest servers...",
      title: taskTitle,
    });

    toast({
      title: "Downloading...",
      description: `Fetching clean media stream (${fmt.toUpperCase()}).`,
    });

    try {
      const ok = await downloadPinterestFile(
        mediaUrl, 
        filename, 
        type, 
        fmt, 
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
          subtitle: "Download finished successfully!",
          title: taskTitle,
        });
      } else {
        failTask(taskId, "Could not fetch media stream");
      }
    } catch (err: any) {
      failTask(taskId, err?.message || "Failed to download media");
    } finally {
      setTimeout(() => {
        setDownloadingType(null);
        setDownloadProgressInfo(null);
      }, 2500);
    }
  };

  const copyToClipboard = (text: string, type: "caption" | "link") => {
    sound.click();
    navigator.clipboard.writeText(text);
    if (type === "caption") {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    toast({
      title: "Copied!",
      description: `${type === "caption" ? "Caption text" : "Direct Link"} copied to clipboard.`,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8 relative" id="pinterest-downloader-container">
      {/* Top Right Version Badge */}
      <div className="absolute top-2 right-4 z-10">
        <VersionBadge />
      </div>

      {/* Temporary Maintenance Notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Tool Temporarily Offline for Server Maintenance</p>
            <p className="text-xs text-amber-700 dark:text-amber-300/90">
              The Pinterest Downloader backend is undergoing upgrades. Please check back later or use our TikTok Downloader.
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

      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full mb-1">
          <Pin className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Pinterest <span className="text-red-600">Video Downloader</span>
        </h1>
        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
          Download high-quality Pinterest videos, reels, stories, or images instantly to your device for free.
        </p>
      </div>

      {/* Main Input Card */}
      <Card className="p-6 md:p-8 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-xl rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-red-600" />
        <div className="space-y-4">
          <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 block">
            Paste Pinterest Link (Pin or pin.it short URL)
          </label>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="https://www.pinterest.com/pin/1234567890/ or https://pin.it/abc..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                className="pr-12 pl-10 py-6 text-base rounded-xl border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 focus-visible:ring-red-500"
              />
              <Pin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
                title="Paste from clipboard"
              >
                <Clipboard className="w-5 h-5" />
              </button>
            </div>
            <Button
              onClick={() => handleExtract()}
              disabled={loading}
              className="py-6 px-8 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-500/15"
            >
              {loading ? (
                <>
                  <RotateCcw className="w-5 h-5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Download
                </>
              )}
            </Button>
          </div>

          {/* Quick Info Badges */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Downloads
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" /> Ultra Fast Stream Extraction
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-500" /> Full HD Quality
            </span>
          </div>
        </div>
      </Card>

      {/* Progress HUD inside Downloader section */}
      <AnimatePresence>
        {downloadProgressInfo && (
          <TaskProgressCard
            progress={downloadProgressInfo.progress}
            title={downloadProgressInfo.title}
            subtitle={downloadProgressInfo.subtitle}
            status={downloadProgressInfo.progress === 100 ? "completed" : "running"}
            accentColor="pink"
          />
        )}
      </AnimatePresence>

      {/* Result Display */}
      <AnimatePresence mode="wait">
        {videoData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Visual Column */}
            <Card className="col-span-1 md:col-span-5 p-4 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4">
              <div className="relative w-full aspect-[9/16] bg-neutral-950 rounded-xl overflow-hidden shadow-inner group">
                <video
                  src={videoData.videoUrl || undefined}
                  poster={videoData.thumbnailUrl || undefined}
                  controls
                  className="w-full h-full object-contain"
                  playsInline
                />
                {videoData.duration > 0 && (
                  <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md">
                    {formatDuration(videoData.duration)}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50"
                onClick={() => window.open(videoData.videoUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4" /> Open Source Stream
              </Button>
            </Card>

            {/* Downloader Column */}
            <div className="col-span-1 md:col-span-7 space-y-6">
              <Card className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-5">
                {/* Creator Header */}
                <div className="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                  <img
                    src={videoData.author.avatar || undefined}
                    alt={videoData.author.name}
                    className="w-12 h-12 rounded-full border-2 border-red-500/20 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white leading-tight">
                      {videoData.author.name || "Pinterest Creator"}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Pin Video Extraction Successful
                    </p>
                  </div>
                </div>

                {/* Caption / Title */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                    Title & Description
                  </h4>
                  <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 relative group">
                    <p className="text-sm text-neutral-800 dark:text-neutral-200 line-clamp-4 pr-12">
                      {videoData.title || videoData.description || "No title provided."}
                    </p>
                    <button
                      onClick={() => copyToClipboard(videoData.title || videoData.description || "", "caption")}
                      className="absolute right-3.5 top-3.5 p-2 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors shadow-sm"
                      title="Copy text"
                    >
                      {copiedCaption ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-neutral-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Download Actions bento */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                    Available Download Formats
                  </h4>
                  
                  {/* Action 1: MP4 Video */}
                  <div className="flex items-center justify-between p-3.5 bg-red-50/50 dark:bg-red-950/10 border border-red-500/15 rounded-xl hover:border-red-500/30 transition-all duration-150">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-lg">
                        <FileVideo className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                          HD Video (MP4)
                        </p>
                        <p className="text-xs text-neutral-500">
                          Best quality available direct stream
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(videoData.videoUrl, "HD_Video", "video", "mp4")}
                      disabled={downloadingType !== null}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                      {downloadingType === "HD_Video" ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Action 2: MP3 Sound */}
                  <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200/50 dark:border-neutral-800 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-150">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg">
                        <FileAudio className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                          Extract Audio (MP3)
                        </p>
                        <p className="text-xs text-neutral-500">
                          Extract audio track of this Pin
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(videoData.videoUrl, "Audio_Sound", "audio", "mp3")}
                      disabled={downloadingType !== null}
                      className="border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 font-bold"
                    >
                      {downloadingType === "Audio_Sound" ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Audio MP3
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Action 3: JPG Cover Image */}
                  <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200/50 dark:border-neutral-800 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-150">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-lg">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                          Pin Cover Image (JPG)
                        </p>
                        <p className="text-xs text-neutral-500">
                          Download original preview thumbnail
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(videoData.thumbnailUrl, "Pin_Cover", "image", "jpg")}
                      disabled={downloadingType !== null}
                      className="border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 font-bold"
                    >
                      {downloadingType === "Pin_Cover" ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Cover JPG
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download History Section */}
      {history.length > 0 && (
        <Card className="p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <h3 className="font-extrabold text-neutral-800 dark:text-white flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-red-500" /> Recent Downloads
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> Clear History
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  sound.click();
                  setVideoData(item);
                  setUrl(item.sourceUrl);
                  // scroll up to display result
                  document.getElementById("pinterest-downloader-container")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group flex gap-3 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-red-500/30 transition-all duration-200 cursor-pointer relative"
              >
                <div className="relative w-16 h-24 bg-neutral-950 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {item.duration > 0 && (
                    <span className="absolute bottom-1 right-1 bg-black/70 text-[10px] text-white px-1 py-0.5 rounded font-mono">
                      {formatDuration(item.duration)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider">
                      Video Pin
                    </p>
                    <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-red-600 transition-colors">
                      {item.title || "Pinterest Video"}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      by {item.author.name || "Pinterest Creator"}
                    </p>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(item.fetchedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Interactive FAQ Block */}
      <Card className="p-6 bg-neutral-50 dark:bg-neutral-950/40 border-neutral-200/50 dark:border-neutral-800 rounded-2xl space-y-4">
        <h3 className="font-extrabold text-neutral-800 dark:text-white flex items-center gap-2 text-lg">
          <HelpCircle className="w-5 h-5 text-neutral-500" /> Frequently Asked Questions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <h4 className="font-bold text-neutral-800 dark:text-neutral-200">
              Does this work with private Pins?
            </h4>
            <p className="text-neutral-500 dark:text-neutral-400">
              This tool only extracts publicly shared Video Pins. Private Pins require an account authorization and are not supported.
            </p>
          </div>
          <div className="space-y-1 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <h4 className="font-bold text-neutral-800 dark:text-neutral-200">
              Is there any download limit?
            </h4>
            <p className="text-neutral-500 dark:text-neutral-400">
              No, Prachurjo Pinterest Downloader is 100% free with unlimited extractions, bandwidth, and daily downloads.
            </p>
          </div>
          <div className="space-y-1 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <h4 className="font-bold text-neutral-800 dark:text-neutral-200">
              How do I download on iPhone / iOS?
            </h4>
            <p className="text-neutral-500 dark:text-neutral-400">
              On iOS, simply copy the Pin link, press Download, and choose "HD Video (MP4)". Safari will prompt a direct native download.
            </p>
          </div>
          <div className="space-y-1 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <h4 className="font-bold text-neutral-800 dark:text-neutral-200">
              Where are the downloaded files saved?
            </h4>
            <p className="text-neutral-500 dark:text-neutral-400">
              Files are saved directly to your browser's default Downloads folder or your device's photo/media library.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
