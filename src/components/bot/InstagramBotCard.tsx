import React, { useState } from 'react';
import { 
  Download, 
  Check, 
  Copy, 
  Play, 
  Sparkles, 
  Music, 
  ImageIcon, 
  Loader2, 
  ShieldCheck, 
  Film, 
  User,
  Instagram,
  Heart,
  MessageCircle,
  Layers
} from 'lucide-react';
import { InstagramVideoData, downloadInstagramFile, MediaFormat } from '@/api/instagramApi';
import { sound } from '@/lib/sound';
import { useToast } from '@/hooks/use-toast';

interface InstagramBotCardProps {
  instagramData: InstagramVideoData;
}

export const InstagramBotCard: React.FC<InstagramBotCardProps> = ({ instagramData }) => {
  const { toast } = useToast();
  const [activeData, setActiveData] = useState<InstagramVideoData>(instagramData);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const cleanTitle = activeData.title || activeData.description || 'instagram_media';
  const baseFilename = cleanTitle.slice(0, 30).replace(/[^a-zA-Z0-9_\-]/g, '_');

  const handleCopyCaption = () => {
    sound.copy();
    navigator.clipboard.writeText(activeData.title || activeData.description || '');
    setCopiedCaption(true);
    toast({ title: 'Caption Copied!' });
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleDownload = async (
    url: string, 
    typeLabel: string, 
    mediaType: 'video' | 'audio' | 'image', 
    targetFmt: MediaFormat
  ) => {
    if (!url) {
      toast({ title: 'Download URL not available' });
      return;
    }

    sound.download();
    setDownloadingType(typeLabel);
    setDownloadProgress(10);

    const filename = `${baseFilename}_${typeLabel}`;

    const success = await downloadInstagramFile(
      url,
      filename,
      mediaType,
      targetFmt,
      (pct) => setDownloadProgress(pct)
    );

    setDownloadingType(null);
    setDownloadProgress(0);

    if (success) {
      sound.success();
      toast({
        title: '✅ Download Complete!',
        description: `Saved as ${filename}.${targetFmt}`,
      });
    } else {
      sound.error();
      toast({
        title: 'Download Triggered',
        description: 'Opened download link in browser as fallback.',
      });
    }
  };

  return (
    <div className="pt-2 border-t space-y-3.5 text-foreground">
      {/* 1. Header Media & Creator Info */}
      <div className="p-3 rounded-xl bg-muted/40 border space-y-3">
        <div className="flex gap-3">
          {/* Thumbnail Preview */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 border bg-black/30 shadow-xs">
            <img 
              src={activeData.thumbnailUrl || undefined} 
              alt="Instagram Media Thumbnail" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-pink-600/90 text-white text-[9px] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1">
              <Instagram className="w-2.5 h-2.5 fill-current" />
              IG
            </span>
            {activeData.videoUrl && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play className="w-6 h-6 text-white fill-white drop-shadow-md" />
              </span>
            )}
          </div>

          {/* Author & Description */}
          <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
            <div>
              {/* Author Badge */}
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-4 h-4 rounded-full bg-pink-600/20 text-pink-600 flex items-center justify-center text-[9px]">
                  <User className="w-2.5 h-2.5" />
                </div>
                <p className="text-xs font-bold truncate leading-none">{activeData.author?.name || 'Instagram Creator'}</p>
              </div>

              {/* Title / Description */}
              <p className="text-xs text-foreground/90 line-clamp-3 leading-snug font-medium">
                {activeData.title || activeData.description || 'Instagram Post / Reel'}
              </p>
            </div>

            {/* Sub-info */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
              <span className="font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Public IG Content
              </span>
              <button
                onClick={handleCopyCaption}
                className="text-xs font-medium text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
              >
                {copiedCaption ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                Copy Caption
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Multi-item selector if present */}
        {activeData.mediaList && activeData.mediaList.length > 1 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-pink-500" />
              Carousel Items ({activeData.mediaList.length}):
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {activeData.mediaList.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sound.click();
                    if (item.type === 'video') {
                      setActiveData({
                        ...activeData,
                        videoUrl: item.url,
                        thumbnailUrl: item.thumbnail || item.url,
                      });
                    } else {
                      setActiveData({
                        ...activeData,
                        videoUrl: '',
                        thumbnailUrl: item.url,
                      });
                    }
                  }}
                  className={`relative w-12 h-12 rounded-md overflow-hidden shrink-0 border ${
                    (item.url === activeData.videoUrl || item.url === activeData.thumbnailUrl)
                      ? 'ring-2 ring-pink-500 border-pink-500'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={item.thumbnail || item.url || undefined} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] text-white px-1">
                    #{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {downloadingType && (
        <div className="p-2.5 rounded-lg bg-pink-500/10 border border-pink-500/20 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Downloading {downloadingType}...
            </span>
            <span className="font-mono text-pink-600 dark:text-pink-400">{downloadProgress}%</span>
          </div>
          <div className="w-full bg-pink-500/20 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-pink-600 h-full transition-all duration-200" 
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. Download Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Download Video MP4 / Photo JPG */}
        {activeData.videoUrl ? (
          <button
            onClick={() => handleDownload(activeData.videoUrl, 'video', 'video', 'mp4')}
            disabled={!!downloadingType}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            <Film className="w-4 h-4" />
            <span>Download Video</span>
          </button>
        ) : (
          <button
            onClick={() => handleDownload(activeData.thumbnailUrl, 'photo', 'image', 'jpg')}
            disabled={!!downloadingType}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Download Image</span>
          </button>
        )}

        {/* Extract Audio MP3 */}
        {activeData.videoUrl ? (
          <button
            onClick={() => handleDownload(activeData.videoUrl, 'mp3_audio', 'audio', 'mp3')}
            disabled={!!downloadingType}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
          >
            <Music className="w-4 h-4" />
            <span>Extract Audio MP3</span>
          </button>
        ) : (
          <button
            onClick={() => handleCopyCaption()}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs shadow-xs transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Caption</span>
          </button>
        )}

        {/* Download Thumbnail / Cover JPG */}
        <button
          onClick={() => handleDownload(activeData.thumbnailUrl, 'cover', 'image', 'jpg')}
          disabled={!!downloadingType}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs border border-border shadow-xs transition-colors disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Download Cover</span>
        </button>
      </div>
    </div>
  );
};
