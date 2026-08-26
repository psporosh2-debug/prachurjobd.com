import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Film, 
  Check, 
  Loader2, 
  AlertCircle, 
  AlertTriangle, 
  Link2, 
  Tag, 
  User
} from 'lucide-react';
import { ReelPost, REELS_CATEGORIES, ReelCategory } from '@/types/reels';
import { extractTikTokVideo } from '@/api/tiktokApi';
import { supabase } from '@/lib/supabase';
import { soundEffects } from '@/lib/sound';
import { useToast } from '@/hooks/use-toast';
import { useAuthUser } from '@/hooks/useAuthUser';
import { checkReelUrlIsDuplicate } from '@/lib/reelsDeduplication';

interface UploadReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReelAdded?: (newReel: ReelPost) => void;
  onReelCreated?: (newReel: ReelPost) => void;
}

export const UploadReelModal: React.FC<UploadReelModalProps> = ({
  isOpen,
  onClose,
  onReelAdded,
  onReelCreated
}) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuthUser();

  const [tiktokUrl, setTiktokUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ReelCategory>('AI Prompts');
  const [promptText, setPromptText] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');

  // Duplicate URL state
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    title?: string;
    author?: string;
  } | null>(null);

  // Extracting status
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<{
    streamUrl: string;
    coverUrl: string;
    mediaType: 'video' | 'photo' | 'live_photo';
    images?: string[];
    duration?: number;
    musicTitle?: string;
    musicUrl?: string;
    diggCount?: number;
  } | null>(null);
  const [extractError, setExtractError] = useState<string>('');

  if (!isOpen) return null;

  // Real-time check when user enters URL
  const handleUrlBlur = async () => {
    if (!tiktokUrl.trim()) {
      setDuplicateInfo(null);
      return;
    }

    setIsCheckingDuplicate(true);
    try {
      const dupCheck = await checkReelUrlIsDuplicate(tiktokUrl);
      if (dupCheck.isDuplicate) {
        setDuplicateInfo({
          isDuplicate: true,
          title: dupCheck.duplicateTitle,
          author: dupCheck.author
        });
        soundEffects.play('alert');
      } else {
        setDuplicateInfo(null);
      }
    } catch {
      // Ignore
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  // Handle TikTok Link Extraction
  const handleExtract = async () => {
    if (!tiktokUrl.trim()) {
      setExtractError('Please enter a TikTok video or photo slide link.');
      return;
    }

    // 1. Check for duplicate URL first
    setIsExtracting(true);
    setExtractError('');

    try {
      const dupCheck = await checkReelUrlIsDuplicate(tiktokUrl);
      if (dupCheck.isDuplicate) {
        setDuplicateInfo({
          isDuplicate: true,
          title: dupCheck.duplicateTitle,
          author: dupCheck.author
        });
        setExtractError(`This URL is already uploaded as "${dupCheck.duplicateTitle || 'Reel'}" by @${dupCheck.author || 'Creator'}. Duplicate URLs are not allowed.`);
        soundEffects.play('alert');
        setIsExtracting(false);
        return;
      } else {
        setDuplicateInfo(null);
      }

      const res = await extractTikTokVideo(tiktokUrl);
      if (res.success && res.data) {
        const d = res.data;
        const isPhoto = d.isSlideShow || (d.images && d.images.length > 0);
        
        setExtractedData({
          streamUrl: d.videoHdUrl || d.videoUrl || d.cover,
          coverUrl: d.cover || d.originCover || '',
          mediaType: isPhoto ? 'photo' : 'video',
          images: d.images && d.images.length > 0 ? d.images : undefined,
          duration: d.duration,
          musicTitle: d.musicInfo?.title || 'Original Audio',
          musicUrl: d.audioUrl || '',
          diggCount: d.stats?.diggCount || 0,
        });

        // Autofill title if empty
        if (!title.trim() && d.title) {
          setTitle(d.title.slice(0, 80));
        }

        soundEffects.play('pop');
        toast({
          title: "TikTok Extracted! 🎬",
          description: `Ready to publish clean ${isPhoto ? 'Photo Slideshow' : 'Video'}.`,
        });
      } else {
        setExtractError(res.error || 'Could not extract video. Please check the TikTok link.');
      }
    } catch (err: any) {
      setExtractError(err.message || 'Failed to extract TikTok media.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Submit and Publish Reel (NO auth requirement)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tiktokUrl.trim()) {
      setExtractError('TikTok URL is required.');
      return;
    }

    // Strict Check for Duplicate URL Prevention in Supabase table
    const dupCheck = await checkReelUrlIsDuplicate(tiktokUrl);
    if (dupCheck.isDuplicate) {
      setDuplicateInfo({
        isDuplicate: true,
        title: dupCheck.duplicateTitle,
        author: dupCheck.author
      });
      setExtractError(`Cannot upload: This TikTok URL is already used in "${dupCheck.duplicateTitle || 'Existing Reel'}".`);
      soundEffects.play('alert');
      return;
    }

    if (!title.trim()) {
      setExtractError('Please give this reel a short title.');
      return;
    }

    if (!promptText.trim()) {
      setExtractError('Please enter the prompt or formula text to copy.');
      return;
    }

    setIsPublishing(true);
    setExtractError('');

    try {
      let finalStreamUrl = extractedData?.streamUrl || '';
      let finalCoverUrl = extractedData?.coverUrl || '';
      let finalMediaType = extractedData?.mediaType || 'video';
      let finalImages = extractedData?.images || [];
      let finalLikesCount = extractedData?.diggCount || 0;
      let finalMusicUrl = extractedData?.musicUrl || '';
      let finalMusicTitle = extractedData?.musicTitle || '';

      // If not extracted yet, run extraction on the fly
      if (!extractedData) {
        const res = await extractTikTokVideo(tiktokUrl);
        if (res.success && res.data) {
          const d = res.data;
          const isPhoto = d.isSlideShow || (d.images && d.images.length > 0);
          finalStreamUrl = d.videoHdUrl || d.videoUrl || d.cover;
          finalCoverUrl = d.cover || d.originCover || '';
          finalMediaType = isPhoto ? 'photo' : 'video';
          finalImages = d.images || [];
          finalLikesCount = d.stats?.diggCount || 0;
          finalMusicUrl = d.audioUrl || '';
          finalMusicTitle = d.musicInfo?.title || '';
        } else {
          finalStreamUrl = tiktokUrl;
        }
      }

      const creatorDisplayName = 
        authorName.trim() || 
        currentUser?.user_metadata?.full_name || 
        currentUser?.email?.split('@')[0] || 
        'Anonymous';

      const reelId = `reel_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const createdAt = new Date().toISOString();

      // Database Payload strictly matching Supabase reels_posts table schema
      const dbRecord = {
        id: reelId,
        title: title.trim(),
        tiktok_url: tiktokUrl.trim(),
        media_type: finalMediaType,
        stream_url: finalStreamUrl,
        cover_url: finalCoverUrl || null,
        images: finalImages && finalImages.length > 0 ? finalImages : [],
        category: category === 'All' ? 'AI Prompts' : category,
        prompt_text: promptText.trim(),
        description: description.trim() || null,
        copy_count: 0,
        likes_count: finalLikesCount,
        tiktok_likes: finalLikesCount,
        website_likes: 0,
        music_url: finalMusicUrl || null,
        music_title: finalMusicTitle || null,
        author_name: creatorDisplayName,
        author_id: currentUser?.id ? currentUser.id : null,
        created_at: createdAt
      };

      // 1. Insert directly to Supabase reels_posts table
      const { data, error } = await supabase
        .from('reels_posts')
        .insert([dbRecord])
        .select();

      if (error) {
        console.error('Supabase reels_posts insert error:', error);
        throw new Error(error.message || 'Database insert failed');
      }

      const createdReel: ReelPost = {
        ...dbRecord,
        images: finalImages.length > 0 ? finalImages : undefined,
        description: dbRecord.description || undefined,
        cover_url: dbRecord.cover_url || undefined,
        author_id: dbRecord.author_id || undefined,
      };

      soundEffects.play('resonantHit');
      toast({
        title: "Reel Published! 🚀",
        description: `Successfully added to database table by @${creatorDisplayName}.`,
      });

      if (onReelCreated) onReelCreated(createdReel);
      if (onReelAdded) onReelAdded(createdReel);
      onClose();
    } catch (err: any) {
      console.error('Publish reel error:', err);
      setExtractError(err.message || 'Failed to publish reel to database.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-card border border-border/80 rounded-3xl shadow-2xl p-5 sm:p-7 text-card-foreground my-8 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Upload Reel to Database</h2>
              <p className="text-xs text-muted-foreground">Publish clean TikTok video/photo with 1-Click prompt</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* TikTok URL Input with Auto-extract */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-primary" />
                TikTok Video / Photo Slide URL *
              </span>
              {extractedData && (
                <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Extracted ({extractedData.mediaType})
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                required
                placeholder="https://www.tiktok.com/@username/video/..."
                value={tiktokUrl}
                onChange={(e) => {
                  setTiktokUrl(e.target.value);
                  setExtractedData(null);
                  setDuplicateInfo(null);
                  setExtractError('');
                }}
                onBlur={handleUrlBlur}
                className={`flex-1 px-3.5 py-2.5 rounded-xl bg-muted/40 border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                  duplicateInfo?.isDuplicate 
                    ? 'border-rose-500 focus:ring-rose-500/30' 
                    : 'border-border focus:ring-primary/20 focus:border-primary'
                }`}
              />
              <button
                type="button"
                onClick={handleExtract}
                disabled={isExtracting || !tiktokUrl.trim() || !!duplicateInfo?.isDuplicate}
                className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Preview
                  </>
                )}
              </button>
            </div>
          </div>

          {/* DUPLICATE URL WARNING BANNER */}
          {duplicateInfo?.isDuplicate && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-rose-500">Duplicate URL Detected! 🛑</p>
                <p className="text-foreground/90 mt-0.5 leading-relaxed">
                  This TikTok video is already in the database as <span className="font-semibold text-rose-400 underline">"{duplicateInfo.title || 'Existing Reel'}"</span> by <span className="font-semibold text-foreground">@{duplicateInfo.author || 'Creator'}</span>.
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Duplicate URLs are blocked to prevent repeat posts.
                </p>
              </div>
            </div>
          )}

          {/* Extracted Preview Banner */}
          {extractedData && !duplicateInfo?.isDuplicate && (
            <div className="p-3 bg-muted/50 rounded-xl border border-border flex items-center gap-3 animate-fade-in">
              <img
                src={extractedData.coverUrl || extractedData.streamUrl || undefined}
                alt="Preview"
                className="w-12 h-16 object-cover rounded-lg bg-black border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                  {extractedData.mediaType}
                </span>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  Clean stream extracted successfully (No watermark).
                </p>
              </div>
            </div>
          )}

          {/* Title & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">
                Reel Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cyberpunk Samurai 8K Prompt"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ReelCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                {REELS_CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 1-Click Prompt Text */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                Prompt / Formula / Instructions *
              </span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Enter full Midjourney prompt, CapCut curve settings, FLUX formula or preset recipe..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs sm:text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
            />
          </div>

          {/* Optional Extra Instructions */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Extra Description / Tips (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Set CFG scale to 7.0 and use Niji v6 with raw style"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Creator Name (No Auth Required) */}
          <div>
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              Creator / Author Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Rony, Anonymous, PromptMaster..."
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Error notice */}
          {extractError && !duplicateInfo?.isDuplicate && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{extractError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPublishing || !!duplicateInfo?.isDuplicate}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing to Database...
                </>
              ) : duplicateInfo?.isDuplicate ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-300" />
                  Duplicate Blocked
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Publish Reel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

