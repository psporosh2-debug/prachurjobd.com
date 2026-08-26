import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileVideo, 
  FileAudio, 
  Share2, 
  Sparkles, 
  Bot, 
  FileText, 
  ExternalLink, 
  Music, 
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  ArrowDownToLine,
  Loader2,
  Send,
  MessageCircle
} from 'lucide-react';
import { ReelPost } from '@/types/reels';
import { soundEffects } from '@/lib/sound';
import { useToast } from '@/hooks/use-toast';
import { useAuthUser } from '@/hooks/useAuthUser';
import { downloadTikTokFile, formatFileSize } from '@/api/tiktokApi';
import { useTaskProgress } from '@/context/TaskProgressContext';
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal';

interface ReelShareSheetModalProps {
  reel: ReelPost | null;
  isOpen: boolean;
  onClose: () => void;
  onCopySuccess?: (newCount: number) => void;
}

export const ReelShareSheetModal: React.FC<ReelShareSheetModalProps> = ({
  reel,
  isOpen,
  onClose,
  onCopySuccess
}) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthUser();
  const { startTask, updateTask, completeTask, failTask } = useTaskProgress();

  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [downloadingFormat, setDownloadingFormat] = useState<'mp4' | 'mp3' | 'jpg' | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  if (!isOpen || !reel) return null;

  const shareUrl = `${window.location.origin}/prompt/${reel.id}`;
  const creatorName = reel.author_name || 'Prachurjo Creator';
  const promptText = reel.prompt_text || reel.title;

  // 1-Click Copy Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      soundEffects.play('chime');
      toast({
        title: "Link Copied! 🔗",
        description: "Reel direct share link copied to clipboard.",
      });
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Ignored
    }
  };

  // 1-Click Copy Prompt
  const handleCopyPrompt = async () => {
    if (!isAuthenticated) {
      soundEffects.play('alert');
      setShowAuthModal(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      soundEffects.play('chime');
      toast({
        title: "Prompt Copied! ✨",
        description: "Full AI Prompt copied. Ready to paste in Midjourney, ChatGPT or Smart AI Bot.",
      });
      if (onCopySuccess) {
        onCopySuccess((reel.copy_count || 0) + 1);
      }
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // Ignored
    }
  };

  // Download Media Helper (MP4 Video, MP3 Song, JPG Image)
  const handleDownloadMedia = async (type: 'video' | 'audio' | 'image', fmt: 'mp4' | 'mp3' | 'jpg') => {
    soundEffects.play('click');
    setDownloadingFormat(fmt);
    setDownloadProgress(5);

    const safeTitle = reel.title.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 30) || 'prachurjo_reel';
    const filename = `${safeTitle}_prachurjo.${fmt}`;
    const taskTitle = fmt === 'mp3' ? `Downloading Audio: ${filename}` : `Downloading Video: ${filename}`;
    const taskId = startTask(taskTitle, "Initializing media stream download...");

    // Choose target source URL
    let mediaUrl = reel.stream_url;
    if (type === 'audio' && reel.music_url) {
      mediaUrl = reel.music_url;
    } else if (type === 'image' && (reel.cover_url || reel.images?.[0])) {
      mediaUrl = reel.cover_url || reel.images?.[0] || reel.stream_url;
    } else if (type === 'video' && reel.tiktok_url) {
      mediaUrl = reel.tiktok_url;
    }

    try {
      const ok = await downloadTikTokFile(
        mediaUrl,
        filename,
        type,
        fmt,
        'hd',
        (pct, loaded, total) => {
          setDownloadProgress(pct);
          const loadedMb = (loaded / (1024 * 1024)).toFixed(1);
          const totalMb = total > 0 ? (total / (1024 * 1024)).toFixed(1) : '';
          const subtitle = total > 0 ? `${loadedMb} MB / ${totalMb} MB (${pct}%)` : `${loadedMb} MB downloaded`;

          updateTask(taskId, {
            progress: pct,
            subtitle,
            loadedBytes: loaded,
            totalBytes: total > 0 ? total : undefined,
          });
        }
      );

      if (ok) {
        soundEffects.play('chime');
        completeTask(taskId, `Saved to downloads as ${filename}`);
        toast({
          title: `Download Complete! 🎉`,
          description: `Successfully downloaded ${fmt.toUpperCase()} (${filename})`,
        });
      } else {
        failTask(taskId, "Could not fetch media stream. Opening direct URL.");
        toast({
          title: "Opening Media Direct Link",
          description: "Starting browser direct download...",
        });
      }
    } catch (err: any) {
      failTask(taskId, err.message || "Download failed");
      toast({
        title: "Download Failed",
        description: err.message || "Could not complete media download.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setDownloadingFormat(null);
        setDownloadProgress(0);
      }, 1500);
    }
  };

  // Social Share Handlers
  const handleSocialShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'telegram' | 'native') => {
    soundEffects.play('click');
    const text = encodeURIComponent(`Check out this ${reel.category} AI Reel by @${creatorName} on Prachurjo!`);
    const url = encodeURIComponent(shareUrl);

    if (platform === 'native') {
      if (navigator.share) {
        navigator.share({
          title: reel.title,
          text: `Check out this AI Reel by @${creatorName}`,
          url: shareUrl,
        }).catch(() => {});
        return;
      }
      handleCopyLink();
      return;
    }

    let targetUrl = '';
    switch (platform) {
      case 'whatsapp':
        targetUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
        break;
      case 'facebook':
        targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        targetUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'telegram':
        targetUrl = `https://t.me/share/url?url=${url}&text=${text}`;
        break;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenSmartBot = () => {
    soundEffects.play('launch');
    onClose();
    const encoded = encodeURIComponent(promptText);
    setLocation(`/smart-bot?prompt=${encoded}`);
  };

  const handleGoToPromptDetails = () => {
    soundEffects.play('click');
    onClose();
    setLocation(`/prompt/${reel.id}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md transition-opacity animate-fade-in flex items-end justify-center"
        onClick={onClose}
      >
        {/* TikTok Bottom Sheet Drawer */}
        <div 
          className="relative w-full max-w-xl bg-zinc-950/95 border-t border-white/15 rounded-t-[32px] p-5 sm:p-6 shadow-2xl text-white backdrop-blur-2xl animate-slide-up flex flex-col max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Pull Handle Indicator */}
          <div className="w-12 h-1.5 bg-white/20 hover:bg-white/40 rounded-full mx-auto mb-4 transition-colors cursor-pointer" onClick={onClose} />

          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 overflow-hidden border border-white/15 shrink-0 flex items-center justify-center">
                {reel.cover_url || reel.stream_url ? (
                  <img src={reel.cover_url || reel.stream_url || undefined} alt={reel.title} className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                )}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-sm font-extrabold text-white truncate max-w-[220px] sm:max-w-xs leading-snug">
                  {reel.title}
                </h3>
                <p className="text-xs text-white/60 truncate">
                  @{creatorName} • <span className="text-cyan-400 font-medium">{reel.category}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* SECTION 1: TikTok-Style MEDIA DOWNLOAD OPTIONS (MP4 / MP3 / JPG) */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                <span>Quick Media Downloads</span>
              </h4>
              <span className="text-[10px] font-mono text-white/50">HD No Watermark</span>
            </div>

            {/* Live Download Progress Bar if downloading */}
            {downloadingFormat && (
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs space-y-1.5 animate-pulse">
                <div className="flex justify-between font-mono text-cyan-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    Downloading .{downloadingFormat.toUpperCase()} Media...
                  </span>
                  <span>{downloadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-200"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* MP4 Video Download Button */}
              <button
                onClick={() => handleDownloadMedia('video', 'mp4')}
                disabled={!!downloadingFormat}
                className="p-3 rounded-2xl bg-gradient-to-b from-zinc-900 to-black border border-white/15 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all flex flex-col items-center justify-center gap-1.5 text-center group active:scale-95 disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <FileVideo className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Download MP4</span>
                  <span className="text-[10px] text-cyan-300/80 font-mono">Video (HD)</span>
                </div>
              </button>

              {/* MP3 Audio Download Button */}
              <button
                onClick={() => handleDownloadMedia('audio', 'mp3')}
                disabled={!!downloadingFormat}
                className="p-3 rounded-2xl bg-gradient-to-b from-zinc-900 to-black border border-white/15 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all flex flex-col items-center justify-center gap-1.5 text-center group active:scale-95 disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Download MP3</span>
                  <span className="text-[10px] text-purple-300/80 font-mono">Audio / Song</span>
                </div>
              </button>

              {/* Cover Image Download Button */}
              <button
                onClick={() => handleDownloadMedia('image', 'jpg')}
                disabled={!!downloadingFormat}
                className="p-3 rounded-2xl bg-gradient-to-b from-zinc-900 to-black border border-white/15 hover:border-emerald-400/50 hover:bg-emerald-500/10 transition-all flex flex-col items-center justify-center gap-1.5 text-center group active:scale-95 col-span-2 sm:col-span-1 disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Cover Image</span>
                  <span className="text-[10px] text-emerald-300/80 font-mono">JPG Format</span>
                </div>
              </button>
            </div>
          </div>

          {/* SECTION 2: TikTok-Style SOCIAL SHARE TRAY (Horizontal Scroll) */}
          <div className="space-y-2 mb-5">
            <h4 className="text-xs font-extrabold text-white/80 uppercase tracking-wider">
              Share to Friends & Social Apps
            </h4>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-md ${
                  copiedLink ? 'bg-emerald-500 text-white' : 'bg-white/10 text-cyan-400 border border-white/15'
                }`}>
                  {copiedLink ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Copy className="w-5 h-5" />}
                </div>
                <span className="text-[11px] text-white/80 font-medium">
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => handleSocialShare('whatsapp')}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/90 text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-md border border-emerald-400/30">
                  <MessageCircle className="w-5 h-5 fill-white" />
                </div>
                <span className="text-[11px] text-white/80 font-medium">WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                onClick={() => handleSocialShare('telegram')}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-sky-500/90 text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-md border border-sky-300/30">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-white/80 font-medium">Telegram</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleSocialShare('facebook')}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600/90 text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-md border border-blue-400/30 font-black text-lg">
                  f
                </div>
                <span className="text-[11px] text-white/80 font-medium">Facebook</span>
              </button>

              {/* Twitter / X */}
              <button
                onClick={() => handleSocialShare('twitter')}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-md border border-white/20 font-extrabold text-base">
                  𝕏
                </div>
                <span className="text-[11px] text-white/80 font-medium">Twitter / X</span>
              </button>

              {/* Native System Share */}
              <button
                onClick={() => handleSocialShare('native')}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center transition-transform group-hover:scale-105 shadow-md border border-purple-400/30">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-white/80 font-medium">More...</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: PROMPT SHORTCUTS & BOT LAUNCHER */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <button
              onClick={handleCopyPrompt}
              className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all border shadow-md active:scale-95 ${
                copiedPrompt
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
              }`}
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Prompt Copied!</span>
                </>
              ) : !isAuthenticated ? (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Sign In to Copy AI Prompt</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>1-Click Copy AI Prompt Formula</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleOpenSmartBot}
                className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md"
              >
                <Bot className="w-4 h-4" />
                <span>Open in Smart AI Bot</span>
              </button>

              <button
                onClick={handleGoToPromptDetails}
                className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-white/15 active:scale-95"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Full Details Page</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        mode="copy_prompt"
        onClose={() => setShowAuthModal(false)}
        onSuccess={async () => {
          setShowAuthModal(false);
          await handleCopyPrompt();
        }}
      />
    </>
  );
};
