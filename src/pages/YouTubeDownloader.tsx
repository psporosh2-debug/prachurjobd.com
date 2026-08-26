import React, { useState } from "react";
import { Download, AlertCircle, Image as ImageIcon, Check, Copy } from "lucide-react";
import { SeoContentYouTube } from "@/components/seo/SeoContentYouTube";
import { FaqSection } from "@/components/seo/FaqSection";
import { motion } from "motion/react";
import { useHistory } from "@/hooks/useHistory";
import { sound } from "@/lib/sound";
import { useToast } from "@/hooks/use-toast";
import { VersionBadge } from "@/components/VersionBadge";

interface Thumbnail {
  quality: string;
  url: string;
  width: string;
  height: string;
}

export default function YouTubeDownloader() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { addHistoryItem } = useHistory();
  const { toast } = useToast();

  const extractVideoId = (input: string) => {
    // Matches youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID, youtube.com/embed/ID
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = input.match(regex);
    return match ? match[1] : null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    setError("");

    if (!val.trim()) {
      setVideoId(null);
      return;
    }

    const id = extractVideoId(val);
    if (id) {
      if (id !== videoId) {
        sound.success();
      }
      setVideoId(id);
    } else {
      setVideoId(null);
      setError("Please enter a valid YouTube URL.");
    }
  };

  const handleCopyLink = (thumbnail: Thumbnail) => {
    sound.copy();
    navigator.clipboard.writeText(thumbnail.url);
    setCopiedId(thumbnail.quality);
    toast({
      title: "Copied to Clipboard!",
      description: `${thumbnail.quality} thumbnail link copied.`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (thumbnail: Thumbnail) => {
    try {
      sound.download();
      setDownloadingId(thumbnail.quality);
      const response = await fetch(thumbnail.url);
      if (!response.ok) throw new Error("Failed to fetch image");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `youtube-thumbnail-${videoId}-${thumbnail.quality}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      sound.success();

      addHistoryItem({
        type: 'thumbnail',
        title: `Thumbnail Downloaded (${thumbnail.quality})`,
        description: `Video ID: ${videoId}`,
        url: url
      });
    } catch (err) {
      console.error(err);
      sound.error();
      toast({
        title: "Download Failed",
        description: "Failed to download image due to network or cross-origin restrictions.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setDownloadingId(null), 1000); // Keep checkmark briefly
    }
  };

  const thumbnails: Thumbnail[] = videoId ? [
    { quality: "Max Resolution", url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, width: "1280", height: "720" },
    { quality: "High Quality", url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, width: "480", height: "360" },
    { quality: "Medium Quality", url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, width: "320", height: "180" },
    { quality: "Standard Quality", url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`, width: "640", height: "480" },
  ] : [];

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">YouTube Thumbnail Downloader</h1>
          <p className="text-muted-foreground">Extract and download high-quality thumbnails from any YouTube video instantly.</p>
        </div>
        <VersionBadge />
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
        <label htmlFor="youtube-url" className="block text-sm font-medium mb-2">
          Paste YouTube Video URL
        </label>
        <div className="relative">
          <input
            id="youtube-url"
            type="text"
            className={`w-full bg-background border ${error ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-primary'} rounded-md py-3 px-4 outline-none focus:ring-2 focus:ring-opacity-50 transition-all`}
            placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            value={url}
            onChange={handleInputChange}
          />
        </div>
        {error && (
          <p className="flex items-center gap-1 text-destructive text-sm mt-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}
      </div>

      {videoId ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Available Thumbnails</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {thumbnails.map((thumb, idx) => (
              <motion.div
                key={thumb.quality}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col"
              >
                <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                  <img
                    src={thumb.url}
                    alt={`${thumb.quality} thumbnail`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if maxres is missing
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('hqdefault')) {
                         target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                      } else {
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                     <span className="text-sm">Not available in this resolution</span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-lg">{thumb.quality}</h3>
                      <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded-md">
                        {thumb.width} × {thumb.height}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(thumb)}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 px-3 rounded-md font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {downloadingId === thumb.quality ? (
                        <>
                          <Check className="w-4 h-4 animate-in zoom-in" /> Downloaded
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" /> Download Image
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleCopyLink(thumb)}
                      title="Copy Thumbnail Direct Link"
                      className="px-3.5 py-2.5 rounded-md border border-input bg-background hover:bg-muted font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {copiedId === thumb.quality ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500 animate-in zoom-in" />
                          <span className="hidden sm:inline text-emerald-500 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="hidden sm:inline">Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card/50 border border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <ImageIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Ready to extract</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-1">
              Paste a YouTube URL above to view and download all available thumbnail resolutions.
            </p>
          </div>
        </div>
      )}

      {/* SEO: How-to guide + deep dive content */}
      <SeoContentYouTube />

      {/* SEO: FAQ with JSON-LD schema (home page = primary SEO landing) */}
      <FaqSection />
    </div>
  );
}