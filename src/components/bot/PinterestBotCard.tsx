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
  Pin
} from 'lucide-react';
import { PinterestVideoData, downloadPinterestFile, formatDuration } from '@/api/pinterestApi';
import { sound } from '@/lib/sound';
import { useToast } from '@/hooks/use-toast';

interface PinterestBotCardProps {
  pinterestData: PinterestVideoData;
}

export const PinterestBotCard: React.FC<PinterestBotCardProps> = ({ pinterestData }) => {
  const { toast } = useToast();
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const cleanTitle = pinterestData.title || pinterestData.description || 'pinterest_video';
  const baseFilename = cleanTitle.slice(0, 30).replace(/[^a-zA-Z0-9_\-]/g, '_');

  const handleCopyCaption = () => {
    sound.copy();
    navigator.clipboard.writeText(pinterestData.title || pinterestData.description || '');
    setCopiedCaption(true);
    toast({ title: 'Title Copied!' });
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleDownload = async (
    url: string, 
    typeLabel: string, 
    mediaType: 'video' | 'audio' | 'image', 
    targetFmt: 'mp4' | 'mp3' | 'jpg'
  ) => {
    if (!url) {
      toast({ title: 'Download URL not available' });
      return;
    }

    sound.download();
    setDownloadingType(typeLabel);
    setDownloadProgress(10);

    const filename = `${baseFilename}_${typeLabel}`;

    const success = await downloadPinterestFile(
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
          <div className="relative w-24 h-16 sm:w-28 sm:h-20 rounded-lg overflow-hidden shrink-0 border bg-black/30 shadow-xs">
            <img 
              src={pinterestData.thumbnailUrl || undefined} 
              alt="Pinterest Video Thumbnail" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {pinterestData.duration > 0 && (
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-white font-medium flex items-center gap-0.5">
                <Play className="w-2.5 h-2.5 fill-current" />
                {formatDuration(pinterestData.duration)}
              </span>
            )}
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-red-600/90 text-white text-[9px] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1">
              <Pin className="w-2.5 h-2.5 fill-current" />
              PIN
            </span>
          </div>

          {/* Author & Description */}
          <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
            <div>
              {/* Author Badge */}
              <div className="flex items-center gap-1.5 mb-1">
                {pinterestData.author?.avatar ? (
                  <img 
                    src={pinterestData.author.avatar || undefined} 
                    alt={pinterestData.author.name} 
                    className="w-4 h-4 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-red-600/20 text-red-600 flex items-center justify-center text-[9px]">
                    <User className="w-2.5 h-2.5" />
                  </div>
                )}
                <p className="text-xs font-bold truncate leading-none">{pinterestData.author?.name || 'Pinterest Creator'}</p>
              </div>

              {/* Title / Description */}
              <p className="text-xs text-foreground/90 line-clamp-2 leading-snug font-medium">
                {pinterestData.title || pinterestData.description || 'Pinterest Video Pin'}
              </p>
            </div>

            {/* Sub-info */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
              <span className="font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Public Pin Video
              </span>
              <button
                onClick={handleCopyCaption}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                {copiedCaption ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                Copy Title
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {downloadingType && (
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1.5 text-primary">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Downloading {downloadingType}...
            </span>
            <span className="font-mono text-primary">{downloadProgress}%</span>
          </div>
          <div className="w-full bg-primary/20 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-200" 
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. Download Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Download Video MP4 */}
        <button
          onClick={() => handleDownload(pinterestData.videoUrl, 'hd_video', 'video', 'mp4')}
          disabled={!!downloadingType || !pinterestData.videoUrl}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
        >
          <Film className="w-4 h-4" />
          <span>Download Video</span>
        </button>

        {/* Extract Audio MP3 */}
        <button
          onClick={() => handleDownload(pinterestData.videoUrl, 'mp3_audio', 'audio', 'mp3')}
          disabled={!!downloadingType || !pinterestData.videoUrl}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-50"
        >
          <Music className="w-4 h-4" />
          <span>Extract Audio MP3</span>
        </button>

        {/* Download Thumbnail / Cover JPG */}
        <button
          onClick={() => handleDownload(pinterestData.thumbnailUrl, 'thumbnail', 'image', 'jpg')}
          disabled={!!downloadingType}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs border border-border shadow-xs transition-colors disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Download Thumbnail</span>
        </button>
      </div>
    </div>
  );
};
