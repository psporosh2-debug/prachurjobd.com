import React, { useState, useEffect } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { 
  ChevronLeft, 
  Copy, 
  Check, 
  Sparkles, 
  Bot, 
  Share2, 
  Download, 
  Heart, 
  FileCode2, 
  User, 
  ExternalLink,
  Flame,
  Zap,
  Sliders,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { ReelPost } from '@/types/reels';
import { soundEffects } from '@/lib/sound';
import { useToast } from '@/hooks/use-toast';
import { ReelShareSheetModal } from '@/components/reels/ReelShareSheetModal';
import { extractTikTokVideo } from '@/api/tiktokApi';
import { supabase } from '@/lib/supabase';

export default function PromptDetailsPage() {
  const [match, params] = useRoute<{ id: string }>('/prompt/:id');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const promptId = match && params ? params.id : undefined;
  const [reel, setReel] = useState<ReelPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [copiesCount, setCopiesCount] = useState<number>(0);
  const [shareSheetOpen, setShareSheetOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!promptId) return;

    async function fetchPrompt() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('reels_posts')
          .select('*')
          .eq('id', promptId)
          .single();

        if (!error && data) {
          const reelData = data as ReelPost;
          setReel(reelData);

          const isLocalLiked = localStorage.getItem(`prachurjo_liked_reel_${reelData.id}`) === 'true';
          setIsLiked(isLocalLiked);

          const tiktokLikes = typeof reelData.tiktok_likes === 'number'
            ? reelData.tiktok_likes
            : (reelData.likes_count || 0);
          const websiteLikes = reelData.website_likes || 0;
          
          setLikesCount(tiktokLikes + websiteLikes);
          setCopiesCount(reelData.copy_count || 0);

          // Sync original TikTok likes if unpopulated or 0
          if ((reelData.tiktok_likes === undefined || reelData.tiktok_likes === null || reelData.tiktok_likes === 0) && reelData.tiktok_url) {
            extractTikTokVideo(reelData.tiktok_url).then(res => {
              if (res.success && res.data?.stats?.diggCount && res.data.stats.diggCount > 0) {
                const originalLikes = res.data.stats.diggCount;
                const newTotal = originalLikes + websiteLikes;
                setLikesCount(newTotal);
                supabase.from('reels_posts').update({ 
                  tiktok_likes: originalLikes,
                  likes_count: newTotal 
                }).eq('id', reelData.id);
              }
            }).catch(() => {});
          }
        } else {
          setReel(null);
        }
      } catch (err) {
        console.error('Error fetching prompt from reels_posts:', err);
        setReel(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPrompt();
  }, [promptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-white/70">Loading Prompt Details...</span>
        </div>
      </div>
    );
  }

  if (!reel) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Prompt Not Found</h2>
        <p className="text-xs text-white/60 mb-6 max-w-sm">
          The requested prompt details may have been removed or are not in the database.
        </p>
        <Link
          href="/reels"
          className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-lg shadow-cyan-500/20"
        >
          Back to Reels & Prompts Feed
        </Link>
      </div>
    );
  }

  const promptText = reel.prompt_text || reel.title;
  const creatorName = reel.author_name || 'Anonymous';
  const totalLikes = likesCount;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      const newCount = copiesCount + 1;
      setCopiesCount(newCount);
      soundEffects.play('chime');
      toast({
        title: "Prompt Copied! ✨",
        description: "Ready to paste into Midjourney, ChatGPT, or Smart AI Bot.",
      });

      try {
        await supabase.from('reels_posts').update({ copy_count: newCount }).eq('id', reel.id);
      } catch (err) {
        console.warn('Could not sync copy_count:', err);
      }

      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignored
    }
  };

  const handleToggleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    localStorage.setItem(`prachurjo_liked_reel_${reel.id}`, nextLiked ? 'true' : 'false');

    const curWebsite = reel.website_likes || 0;
    const newWebsite = nextLiked ? curWebsite + 1 : Math.max(0, curWebsite - 1);
    const tiktokLikes = typeof reel.tiktok_likes === 'number' ? reel.tiktok_likes : (reel.likes_count || 0);
    const newTotal = tiktokLikes + newWebsite;

    setLikesCount(newTotal);
    soundEffects.play('heart');

    try {
      await supabase.from('reels_posts').update({ 
        website_likes: newWebsite,
        likes_count: newTotal 
      }).eq('id', reel.id);
    } catch (err) {
      console.warn('Could not sync likes_count:', err);
    }
  };

  const handleOpenInSmartBot = () => {
    soundEffects.play('launch');
    const encoded = encodeURIComponent(promptText);
    setLocation(`/smart-bot?prompt=${encoded}`);
  };

  const handleShare = () => {
    soundEffects.play('pop');
    setShareSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500 selection:text-black">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between max-w-4xl mx-auto">
        <button
          onClick={() => {
            soundEffects.play('click');
            if (window.history.length > 1) {
              window.history.back();
            } else {
              setLocation('/reels');
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            {reel.category || 'AI Prompt'}
          </span>
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
            title="Share Prompt"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Banner Section: Media Preview + Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/80 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-md overflow-hidden">
          {/* Media Preview Box */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-[9/16] max-h-[420px] md:max-h-[500px] flex items-center justify-center border border-white/10 group shadow-2xl mx-auto w-full max-w-sm">
            {reel.cover_url || reel.stream_url ? (
              <img
                src={reel.cover_url || reel.stream_url || undefined}
                alt={reel.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <Sparkles className="w-12 h-12 text-cyan-400" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-white/90">
              <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20">
                Category: {reel.category}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                {formatNumber(totalLikes)}
              </span>
            </div>
          </div>

          {/* Details & Action Column */}
          <div className="flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Creator Info */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    @{creatorName}
                  </h4>
                  <p className="text-xs text-white/60">AI Content Creator & Prompt Engineer</p>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
                {reel.title}
              </h1>

              {/* Stats Bar */}
              <div className="flex flex-wrap gap-2.5 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  {formatNumber(copiesCount)} Copies
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-bold flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-400" />
                  {formatNumber(totalLikes)} Likes
                </span>
              </div>

              {/* Creator Instructions if any */}
              {reel.description && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                  <strong className="block font-bold text-amber-400 mb-1">💡 Instructions / Tip:</strong>
                  {reel.description}
                </div>
              )}
            </div>

            {/* Quick Bot Launcher & Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleOpenInSmartBot}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
              >
                <Bot className="w-5 h-5" />
                <span>Open & Generate in Smart AI Bot</span>
              </button>

              <button
                onClick={handleCopy}
                className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all border shadow-md active:scale-95 ${
                  copied
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Prompt Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-cyan-400" />
                    <span>1-Click Copy Full Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Full Prompt Box Section */}
        <div className="p-5 md:p-6 bg-zinc-950/80 border border-white/10 rounded-3xl space-y-3 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-extrabold text-white">Full AI Prompt Formula</h3>
            </div>

            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Formula</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-black border border-white/15 font-mono text-xs md:text-sm text-cyan-100/90 leading-relaxed select-all whitespace-pre-wrap overflow-x-auto shadow-inner">
            {promptText}
          </div>

          {/* Prompt Formula Parameter Badges */}
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-white/70">
              Aspect Ratio: 9:16
            </span>
            <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-white/70">
              Style: Ultra-Realistic Cinematic
            </span>
            <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-white/70">
              Engine: Midjourney v6 / FLUX.1 / Gemini
            </span>
          </div>
        </div>
      </div>

      {/* Share & Media Download Bottom Sheet */}
      <ReelShareSheetModal
        reel={reel}
        isOpen={shareSheetOpen}
        onClose={() => setShareSheetOpen(false)}
      />
    </div>
  );
}
