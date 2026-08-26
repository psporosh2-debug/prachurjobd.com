import React, { useState } from 'react';
import { 
  Music2, 
  Download, 
  Check, 
  Copy, 
  Heart, 
  MessageCircle, 
  Share2, 
  Play, 
  Sparkles, 
  Volume2, 
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Film,
  User
} from 'lucide-react';
import { TikTokVideoData, downloadTikTokFile, formatStatNumber, formatDuration, formatFileSize } from '@/api/tiktokApi';
import { sound } from '@/lib/sound';
import { useToast } from '@/hooks/use-toast';

interface TikTokBotCardProps {
  tiktokData: TikTokVideoData;
}

export const TikTokBotCard: React.FC<TikTokBotCardProps> = ({ tiktokData }) => {
  const { toast } = useToast();
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [selectedQuality, setSelectedQuality] = useState<'1080p' | '720p' | '480p' | '360p'>('1080p');
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'webm' | 'mp3' | 'm4a' | 'wav'>('mp4');

  const cleanTitle = tiktokData.title || 'tiktok-video';
  const baseFilename = cleanTitle.slice(0, 30).replace(/[^a-zA-Z0-9_\-]/g, '_');

  const handleCopyCaption = () => {
    sound.copy();
    navigator.clipboard.writeText(tiktokData.title);
    setCopiedCaption(true);
    toast({ title: 'Caption Copied!' });
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleDownload = async (
    url: string, 
    typeLabel: string, 
    mediaType: 'video' | 'audio' | 'image', 
    targetFmt: 'mp4' | 'webm' | 'mp3' | 'm4a' | 'wav' | 'jpg'
  ) => {
    if (!url) {
      toast({ title: 'Download URL not available' });
      return;
    }

    sound.download();
    setDownloadingType(typeLabel);
    setDownloadProgress(10);

    const filename = `${baseFilename}_${typeLabel}`;

    const success = await downloadTikTokFile(
      url,
      filename,
      mediaType,
      targetFmt,
      selectedQuality,
      (pct) => setDownloadProgress(pct)
    );

    setDownloadingType(null);
    setDownloadProgress(0);

    if (success) {
      sound.success();
      toast({
        title: '✅ Download Started!',
        description: `Saved as ${filename}.${targetFmt}`,
      });
    } else {
      sound.error();
      toast({
        title: 'Download Triggered',
        description: 'Opened in browser window as fallback.',
      });
    }
  };

  return (
    <div className="pt-2 border-t space-y-3.5 text-foreground">
      {/* 1. Header Media & Creator Info */}
      <div className="p-3 rounded-xl bg-muted/40 border space-y-3">
        <div className="flex gap-3">
          {/* Thumbnail / Cover Preview */}
          <div className="relative w-20 h-28 sm:w-24 sm:h-32 rounded-lg overflow-hidden shrink-0 border bg-black/30 shadow-xs">
            <img 
              src={tiktokData.cover || tiktokData.originCover || undefined} 
              alt="TikTok Cover" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {tiktokData.duration > 0 && (
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono text-white font-medium flex items-center gap-0.5">
                <Play className="w-2.5 h-2.5 fill-current" />
                {formatDuration(tiktokData.duration)}
              </span>
            )}
            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-cyan-500/90 text-white text-[9px] font-bold tracking-wider uppercase shadow-xs">
              TikTok
            </span>
          </div>

          {/* Author & Stats */}
          <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
            <div>
              {/* Author Badge */}
              <div className="flex items-center gap-1.5 mb-1.5">
                {tiktokData.author?.avatar ? (
                  <img 
                    src={tiktokData.author.avatar} 
                    alt={tiktokData.author.nickname} 
                    className="w-5 h-5 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-500 flex items-center justify-center text-[10px]">
                    <User className="w-3 h-3" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate leading-none">{tiktokData.author?.nickname || 'TikTok Creator'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">@{tiktokData.author?.uniqueId || 'tiktok'}</p>
                </div>
              </div>

              {/* Title / Caption */}
              <p className="text-xs text-foreground/90 line-clamp-2 leading-snug font-medium">
                {tiktokData.title || 'No caption provided.'}
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-1 pt-2 border-t border-border/40 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1 truncate" title="Plays">
                <Play className="w-3 h-3 text-cyan-500 shrink-0" />
                <span>{formatStatNumber(tiktokData.stats.playCount)}</span>
              </div>
              <div className="flex items-center gap-1 truncate" title="Likes">
                <Heart className="w-3 h-3 text-rose-500 shrink-0" />
                <span>{formatStatNumber(tiktokData.stats.diggCount)}</span>
              </div>
              <div className="flex items-center gap-1 truncate" title="Comments">
                <MessageCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{formatStatNumber(tiktokData.stats.commentCount)}</span>
              </div>
              <div className="flex items-center gap-1 truncate" title="Shares">
                <Share2 className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{formatStatNumber(tiktokData.stats.shareCount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copy Caption Action */}
        <div className="flex items-center justify-between pt-1 text-[11px]">
          <span className="text-muted-foreground font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            100% Watermark Removed
          </span>
          <button
            onClick={handleCopyCaption}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            {copiedCaption ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {copiedCaption ? 'Copied' : 'Copy Caption'}
          </button>
        </div>
      </div>

      {/* 2. Mini Audio Preview Player (If available) */}
      {tiktokData.audioUrl && (
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 animate-pulse" />
              TikTok Background Sound MP3
            </span>
            <span className="text-[10px] text-muted-foreground">
              {tiktokData.musicInfo?.title || 'Original Audio'}
            </span>
          </div>
          <audio controls src={tiktokData.audioUrl || undefined} className="w-full h-7 rounded-md accent-cyan-500" />
        </div>
      )}

      {/* 3. Live Download Progress Indicator */}
      {downloadingType && (
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 space-y-1.5 animate-pulse">
          <div className="flex items-center justify-between text-xs font-semibold text-primary">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Downloading {downloadingType}...
            </span>
            <span>{downloadProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-200 rounded-full" 
              style={{ width: `${downloadProgress}%` }} 
            />
          </div>
        </div>
      )}

      {/* 4. Format & Quality Selectors */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Video Quality</label>
          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value as any)}
            className="w-full p-1.5 rounded-lg bg-background border text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="1080p">1080p Full HD</option>
            <option value="720p">720p HD</option>
            <option value="480p">480p SD</option>
            <option value="360p">360p Mobile</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Target Format</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as any)}
            className="w-full p-1.5 rounded-lg bg-background border text-xs font-medium focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="mp4">MP4 Video</option>
            <option value="webm">WebM Video</option>
            <option value="mp3">MP3 Audio</option>
            <option value="m4a">M4A Audio</option>
            <option value="wav">WAV Audio</option>
          </select>
        </div>
      </div>

      {/* 5. Download Buttons Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* HD No Watermark Button */}
        <button
          disabled={Boolean(downloadingType)}
          onClick={() => handleDownload(tiktokData.videoHdUrl || tiktokData.videoUrl, 'NoWM_HD', 'video', selectedFormat)}
          className="p-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Download HD (No Watermark)</span>
        </button>

        {/* Normal MP4 */}
        <button
          disabled={Boolean(downloadingType)}
          onClick={() => handleDownload(tiktokData.videoUrl, 'NoWM_SD', 'video', selectedFormat)}
          className="p-2.5 rounded-xl text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Film className="w-3.5 h-3.5" />
          <span>SD Video ({formatFileSize(tiktokData.size?.nowm)})</span>
        </button>

        {/* MP3 Audio */}
        <button
          disabled={Boolean(downloadingType)}
          onClick={() => handleDownload(tiktokData.audioUrl || tiktokData.videoUrl, 'Audio_MP3', 'audio', 'mp3')}
          className="p-2.5 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Music2 className="w-3.5 h-3.5" />
          <span>Download MP3 Audio</span>
        </button>

        {/* HD Cover Photo */}
        <button
          disabled={Boolean(downloadingType)}
          onClick={() => handleDownload(tiktokData.cover || tiktokData.originCover, 'Cover_Image', 'image', 'jpg')}
          className="p-2.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Save HD Cover</span>
        </button>
      </div>
    </div>
  );
};
