import React, { useState, useEffect, useRef } from "react";
import { 
  Video, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Copy, 
  FileAudio, 
  Image as ImageIcon, 
  RefreshCw, 
  ExternalLink,
  Play,
  Pause,
  Sliders,
  Check,
  ShieldCheck,
  Zap,
  Globe,
  HelpCircle,
  ChevronDown,
  Layers,
  Flame,
  ArrowRight,
  ClipboardPaste,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { sound } from "@/lib/sound";
import { useTaskProgress } from "@/context/TaskProgressContext";
import { TaskProgressCard } from "@/components/TaskProgressCard";
import { useHistory } from "@/hooks/useHistory";
import { 
  extractFacebookVideo, 
  downloadFacebookFile, 
  getFacebookDownloadUrl,
  FacebookVideoData, 
  SAMPLE_FACEBOOK_URLS, 
  MediaFormat, 
  MediaQuality,
  isValidFacebookUrl
} from "@/api/facebookApi";

export default function FacebookDownloader() {
  const [urlInput, setUrlInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<FacebookVideoData | null>(null);

  // Download & Format Settings
  const [targetQuality, setTargetQuality] = useState<MediaQuality>("1080p");
  const [targetFormat, setTargetFormat] = useState<MediaFormat>("mp4");
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [downloadProgressInfo, setDownloadProgressInfo] = useState<{
    progress: number;
    subtitle: string;
    speedStr?: string;
    title: string;
  } | null>(null);

  // Audio / Video Preview States
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);
  const { toast } = useToast();
  const { addHistoryItem } = useHistory();
  const { startTask, updateTask, completeTask, failTask } = useTaskProgress();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Handle URL Extraction
  const handleExtract = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || urlInput).trim();
    if (!targetUrl) {
      sound.error();
      setErrorMsg("Please enter or paste a valid Facebook video URL.");
      return;
    }

    if (!isValidFacebookUrl(targetUrl)) {
      sound.error();
      setErrorMsg("Invalid Facebook URL format. Please paste a link from facebook.com or fb.watch.");
      return;
    }

    sound.click();
    setIsLoading(true);
    setErrorMsg(null);
    setVideoData(null);
    setIsPlayingAudio(false);

    try {
      const response = await extractFacebookVideo(targetUrl);
      if (response.success && response.data) {
        setVideoData(response.data);
        sound.success();
        toast({
          title: "Video Ready! 🎬",
          description: "Select HD, SD, or MP3 audio to download instantly.",
        });

        // Add to history
        addHistoryItem({
          type: "fb_download",
          title: response.data.title || "Facebook Video",
          description: `Creator: ${response.data.author.name || "Facebook User"} • High Definition`,
          metadata: {
            url: targetUrl,
            thumbnail: response.data.thumbnail,
          },
        });
      } else {
        sound.error();
        setErrorMsg(response.error || "Failed to extract Facebook video. Please check if the video is public.");
      }
    } catch (err: any) {
      sound.error();
      setErrorMsg(err.message || "An unexpected error occurred while fetching video data.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Paste from Clipboard
  const handlePaste = async () => {
    sound.click();
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUrlInput(text.trim());
          handleExtract(text.trim());
          return;
        }
      }
      toast({
        title: "Clipboard empty",
        description: "Please copy a Facebook video link and paste it in the box.",
      });
    } catch (err) {
      toast({
        title: "Permission needed",
        description: "Please manually paste the link into the input box.",
      });
    }
  };

  // Handle Download Action with Live Stream Progress
  const handleDownload = async (
    mediaUrl: string, 
    type: "video" | "audio" | "image", 
    suffix: string,
    forcedFormat?: MediaFormat,
    forcedQuality?: MediaQuality
  ) => {
    if (!videoData || !mediaUrl) return;
    sound.click();

    const fmt = forcedFormat || targetFormat;
    const qual = forcedQuality || targetQuality;

    setDownloadingType(suffix);

    const safeTitle = (videoData.title || "video")
      .replace(/[^a-zA-Z0-9_\u0980-\u09FF-]/g, "_")
      .slice(0, 40);
    const filename = `prachurjo_facebook_${safeTitle}_${suffix}`;

    const taskTitle = `Downloading Facebook ${type === "audio" ? "Audio (MP3)" : `${qual.toUpperCase()} Video`}`;
    const taskId = startTask({
      title: taskTitle,
      subtitle: `Starting download (${fmt.toUpperCase()})...`,
      category: "download",
      initialProgress: 5,
    });

    setDownloadProgressInfo({
      progress: 10,
      subtitle: "Connecting to Facebook CDN stream...",
      title: taskTitle,
    });

    toast({
      title: "Downloading...",
      description: `Fetching ${qual.toUpperCase()} • ${fmt.toUpperCase()} from Facebook.`,
    });

    try {
      const ok = await downloadFacebookFile(
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
        sound.success();
        completeTask(taskId, `Saved as ${filename}`);
        setDownloadProgressInfo({
          progress: 100,
          subtitle: "Download completed successfully!",
          title: taskTitle,
        });
      } else {
        sound.error();
        failTask(taskId, "Could not fetch media stream");
      }
    } catch (err: any) {
      sound.error();
      failTask(taskId, err.message || "Failed to download media");
    } finally {
      setTimeout(() => {
        setDownloadingType(null);
        setDownloadProgressInfo(null);
      }, 2500);
    }
  };

  // Audio Play / Pause toggle
  const toggleAudioPlay = () => {
    if (!videoData?.audioUrl) return;
    sound.click();

    if (!audioRef.current) {
      audioRef.current = new Audio(videoData.audioUrl);
      audioRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(() => {
        toast({
          title: "Playback failed",
          description: "Browser blocked audio autoplay or format is not streamable directly.",
        });
      });
    }
  };

  // Copy shareable link
  const handleCopyLink = () => {
    sound.click();
    navigator.clipboard.writeText(urlInput || window.location.href);
    setCopiedLink(true);
    toast({
      title: "Link Copied! 📋",
      description: "Video link has been copied to your clipboard.",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* 🚀 Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-border/40 bg-gradient-to-b from-blue-500/10 via-background to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold shadow-2xs">
            <Video className="w-3.5 h-3.5" />
            <span>Facebook Reels & Video Downloader</span>
            <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[10px] px-1.5 py-0">
              100% FREE & UNLIMITED
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Download Facebook Videos in{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              Full HD & MP3
            </span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Save Facebook Reels, Watch videos, and Feed clips in 1080p, 720p HD, and MP3 audio format.
            Fast, secure, unlimited downloads with no API key or sign-up needed.
          </p>

          {/* 🔍 URL Input Box */}
          <div className="max-w-2xl mx-auto pt-2">
            <Card className="p-2 sm:p-2.5 rounded-2xl shadow-lg border-blue-500/30 dark:border-blue-500/20 bg-card/90 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input
                    type="url"
                    placeholder="Paste Facebook video or reels link (e.g. facebook.com/reel/...)"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                    className="h-12 pl-4 pr-10 text-sm sm:text-base rounded-xl border-border/80 focus-visible:ring-blue-500 bg-background"
                  />
                  {urlInput && (
                    <button
                      onClick={() => {
                        sound.click();
                        setUrlInput("");
                        setErrorMsg(null);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePaste}
                    className="h-12 px-4 rounded-xl border-border/80 hover:bg-muted/80 text-xs font-semibold gap-1.5 shrink-0"
                  >
                    <ClipboardPaste className="w-4 h-4 text-blue-500" />
                    <span className="hidden sm:inline">Paste</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleExtract()}
                    disabled={isLoading}
                    className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md gap-2 flex-1 sm:flex-initial"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Fetching...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Get Video</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* 💡 Quick Sample URL Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Quick Test:
              </span>
              {SAMPLE_FACEBOOK_URLS.map((sample) => (
                <button
                  key={sample.label}
                  onClick={() => {
                    setUrlInput(sample.url);
                    handleExtract(sample.url);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium border border-blue-500/20 transition-all hover:scale-105 active:scale-95 text-[11px]"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            {/* Error Message Display */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs sm:text-sm font-medium flex items-center gap-2 text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* 🎬 Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* 🚀 Active Download Live Progress Feedback Card */}
        <AnimatePresence>
          {downloadProgressInfo && (
            <TaskProgressCard
              progress={downloadProgressInfo.progress}
              title={downloadProgressInfo.title}
              subtitle={downloadProgressInfo.subtitle}
              status={downloadProgressInfo.progress === 100 ? "completed" : "running"}
              speedStr={downloadProgressInfo.speedStr}
              accentColor="indigo"
              className="mb-4"
            />
          )}
        </AnimatePresence>

        {/* 📹 Extracted Video Details & Download Options */}
        {videoData && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="overflow-hidden rounded-2xl border-blue-500/30 shadow-xl bg-card">
              {/* Header Bar */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border-b flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold line-clamp-1">
                      {videoData.title || "Facebook Video Ready"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      By <span className="font-semibold text-foreground">{videoData.author.name}</span> • Ready for 1-click download
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-8 px-3 rounded-lg text-xs gap-1.5"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                  </Button>

                  <a
                    href={videoData.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    <span>Open on FB</span>
                  </a>
                </div>
              </div>

              {/* Body: Video Preview & Options Grid */}
              <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Video Player / Thumbnail Preview */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video sm:aspect-[4/3] flex items-center justify-center group shadow-md">
                    {videoData.videoHdUrl || videoData.videoSdUrl ? (
                      <video
                        ref={videoPlayerRef}
                        src={videoData.videoHdUrl || videoData.videoSdUrl || undefined}
                        poster={videoData.thumbnail || undefined}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : videoData.thumbnail ? (
                      <img
                        src={videoData.thumbnail || undefined}
                        alt={videoData.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Video className="w-12 h-12" />
                        <span className="text-xs">Facebook Video Stream</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {videoData.videoHdUrl && (
                        <Badge className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 shadow-sm">
                          HD 1080p
                        </Badge>
                      )}
                      <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5">
                        MP4
                      </Badge>
                    </div>
                  </div>

                  {/* Caption snippet */}
                  {videoData.description && (
                    <div className="p-3 rounded-xl bg-muted/40 border text-xs text-muted-foreground space-y-1">
                      <p className={`leading-relaxed ${showFullDesc ? "" : "line-clamp-2"}`}>
                        {videoData.description}
                      </p>
                      {videoData.description.length > 100 && (
                        <button
                          onClick={() => setShowFullDesc(!showFullDesc)}
                          className="text-blue-500 font-semibold hover:underline text-[11px]"
                        >
                          {showFullDesc ? "Show less" : "Read full caption"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Download Actions & Quality Selectors */}
                <div className="lg:col-span-7 space-y-4">
                  {/* 🎛️ Settings Bar */}
                  <div className="p-3 rounded-xl bg-muted/30 border flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Sliders className="w-3.5 h-3.5 text-blue-500" />
                      <span>Download Options</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Quality:</span>
                        <select
                          value={targetQuality}
                          onChange={(e) => setTargetQuality(e.target.value as MediaQuality)}
                          className="bg-background border rounded-md px-2 py-1 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="1080p">1080p (Full HD)</option>
                          <option value="720p">720p (HD)</option>
                          <option value="480p">480p (SD)</option>
                          <option value="360p">360p (Low)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Format:</span>
                        <select
                          value={targetFormat}
                          onChange={(e) => setTargetFormat(e.target.value as MediaFormat)}
                          className="bg-background border rounded-md px-2 py-1 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="mp4">MP4 Video</option>
                          <option value="webm">WEBM Video</option>
                          <option value="mp3">MP3 Audio</option>
                          <option value="m4a">M4A Audio</option>
                          <option value="wav">WAV Audio</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ⚡ Download Action Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 1. HD Video Download */}
                    {videoData.videoHdUrl && (
                      <Button
                        type="button"
                        onClick={() => handleDownload(videoData.videoHdUrl!, "video", "hd_1080p", "mp4", "1080p")}
                        disabled={downloadingType === "hd_1080p"}
                        className="h-auto p-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold flex items-center justify-between shadow-md group text-left"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">Download HD Video</span>
                            <Badge className="bg-white/20 text-white text-[9px] px-1 py-0 border-0">
                              1080p
                            </Badge>
                          </div>
                          <p className="text-[11px] text-blue-100 font-normal">
                            Full HD • Crisp MP4 Quality
                          </p>
                        </div>
                        {downloadingType === "hd_1080p" ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                        )}
                      </Button>
                    )}

                    {/* 2. SD Video Download */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDownload(videoData.videoSdUrl, "video", "sd_480p", "mp4", "480p")}
                      disabled={downloadingType === "sd_480p"}
                      className="h-auto p-4 rounded-xl border-blue-500/30 hover:bg-blue-500/10 font-bold flex items-center justify-between text-left"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <span className="text-sm">Download SD Video</span>
                          <Badge variant="secondary" className="text-[9px] px-1 py-0">
                            480p
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-normal">
                          Fast • Smaller file size
                        </p>
                      </div>
                      {downloadingType === "sd_480p" ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                      ) : (
                        <Download className="w-5 h-5 text-blue-500" />
                      )}
                    </Button>

                    {/* 3. Audio (MP3) Download */}
                    {videoData.audioUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDownload(videoData.audioUrl!, "audio", "sound_track", "mp3")}
                        disabled={downloadingType === "sound_track"}
                        className="h-auto p-4 rounded-xl border-indigo-500/30 hover:bg-indigo-500/10 font-bold flex items-center justify-between text-left"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-foreground">
                            <FileAudio className="w-4 h-4 text-indigo-500" />
                            <span className="text-sm">Download Audio</span>
                            <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[9px] px-1 py-0 border-0">
                              MP3
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-normal">
                            Extract sound stream
                          </p>
                        </div>
                        {downloadingType === "sound_track" ? (
                          <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                        ) : (
                          <Download className="w-5 h-5 text-indigo-500" />
                        )}
                      </Button>
                    )}

                    {/* 4. Cover Photo Download */}
                    {videoData.thumbnail && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDownload(videoData.thumbnail, "image", "cover", "jpg")}
                        disabled={downloadingType === "cover"}
                        className="h-auto p-4 rounded-xl border-cyan-500/30 hover:bg-cyan-500/10 font-bold flex items-center justify-between text-left"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-foreground">
                            <ImageIcon className="w-4 h-4 text-cyan-500" />
                            <span className="text-sm">Save Thumbnail</span>
                            <Badge className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 text-[9px] px-1 py-0 border-0">
                              HD JPG
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-normal">
                            Original high-res cover
                          </p>
                        </div>
                        {downloadingType === "cover" ? (
                          <RefreshCw className="w-5 h-5 animate-spin text-cyan-500" />
                        ) : (
                          <Download className="w-5 h-5 text-cyan-500" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* 🎵 Audio Preview Player */}
                  {videoData.audioUrl && (
                    <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={toggleAudioPlay}
                          className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-transform active:scale-90 shadow-xs"
                          aria-label="Play audio snippet"
                        >
                          {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {isPlayingAudio ? "Playing Audio Stream..." : "Preview Audio Track"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Listen to the audio track before downloading
                          </p>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px] text-indigo-500 border-indigo-500/30">
                        320 kbps MP3
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* 📚 How It Works (Step-by-Step) */}
        <section className="space-y-4 pt-4">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold">
              How to Download Facebook Videos & Reels
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Follow 3 simple steps to save any public Facebook video in high quality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Card className="p-5 rounded-2xl border bg-card hover:border-blue-500/40 transition-colors space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="text-sm font-bold">Copy Facebook Link</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Open Facebook on mobile or web, click the <strong>Share</strong> button on any public video or reel, and choose <strong>Copy Link</strong>.
              </p>
            </Card>

            <Card className="p-5 rounded-2xl border bg-card hover:border-blue-500/40 transition-colors space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="text-sm font-bold">Paste URL Above</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paste the copied link into our search box and click <strong>Get Video</strong>. Our engine automatically parses HD & SD streams.
              </p>
            </Card>

            <Card className="p-5 rounded-2xl border bg-card hover:border-blue-500/40 transition-colors space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="text-sm font-bold">1-Click Fast Download</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose <strong>HD 1080p Video</strong>, <strong>SD 480p</strong>, or <strong>MP3 Audio</strong> and watch the live progress bar download it to your device.
              </p>
            </Card>
          </div>
        </section>

        {/* 🌟 Key Features Grid */}
        <section className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent border border-blue-500/20 space-y-4">
          <div className="text-center space-y-1">
            <Badge className="bg-blue-600 text-white text-[10px]">WHY USE PRACHURJO</Badge>
            <h3 className="text-lg sm:text-xl font-bold">Key Downloader Features</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-background/80 border space-y-1">
              <div className="flex items-center gap-2 text-blue-500 font-bold text-xs">
                <Zap className="w-4 h-4" />
                <span>Ultra Fast Speed</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Direct streaming bypasses rate limits and saves files at maximum speed.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-background/80 border space-y-1">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Free & Unlimited</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                No sign-up, no subscriptions, no API keys, and no daily download limits.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-background/80 border space-y-1">
              <div className="flex items-center gap-2 text-cyan-500 font-bold text-xs">
                <FileAudio className="w-4 h-4" />
                <span>MP3 Audio Extraction</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Extract high-bitrate crystal clear audio from any Facebook video.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-background/80 border space-y-1">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                <Globe className="w-4 h-4" />
                <span>All Devices Supported</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Works seamlessly on Android, iPhone/iOS, Windows PC, Mac, and Linux.
              </p>
            </div>
          </div>
        </section>

        {/* ❓ FAQ Accordion */}
        <section className="space-y-4 pt-4">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              Frequently Asked Questions (FAQ)
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Everything you need to know about downloading Facebook videos with Prachurjo
            </p>
          </div>

          <div className="space-y-2.5 max-w-3xl mx-auto pt-2">
            {[
              {
                q: "Is the Facebook Video Downloader completely free to use?",
                a: "Yes! Prachurjo Facebook Video Downloader is 100% free with unlimited downloads. You do not need to create an account, purchase a subscription, or pay any hidden fees."
              },
              {
                q: "Do I need an API key to download Facebook videos?",
                a: "No API key is required. Our system extracts public Facebook streams directly so you can paste any link and download immediately."
              },
              {
                q: "Can I download Facebook Reels and Shorts?",
                a: "Yes, you can download any Facebook Reel, Watch video, Story, or Feed video as long as the post is set to Public."
              },
              {
                q: "What video resolutions are available for download?",
                a: "We provide Full HD 1080p, 720p HD, and standard 480p/360p MP4 formats depending on the original uploaded video quality."
              },
              {
                q: "Can I extract only the MP3 audio from a Facebook video?",
                a: "Yes! Simply click the 'Download Audio (MP3)' button to download the soundtrack directly without the video file."
              },
              {
                q: "Can I download private Facebook videos?",
                a: "No, our tool only supports public videos. Videos posted in private groups or set to 'Friends Only' cannot be downloaded."
              }
            ].map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <Card
                  key={index}
                  className="rounded-xl border overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => {
                      sound.click();
                      setActiveFaq(isOpen ? null : index);
                    }}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm hover:bg-muted/30 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${
                        isOpen ? "rotate-180 text-blue-500" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 text-xs sm:text-sm text-muted-foreground border-t bg-muted/10 leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
