import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Video, 
  Upload, 
  Link2, 
  Check, 
  Loader2, 
  AlertCircle, 
  AlertTriangle, 
  Tag, 
  User, 
  FileText, 
  RotateCw, 
  Copy, 
  HelpCircle, 
  Languages, 
  Lightbulb 
} from 'lucide-react';
import { ReelPost, REELS_CATEGORIES, ReelCategory } from '@/types/reels';
import { extractTikTokVideo } from '@/api/tiktokApi';
import { supabase } from '@/lib/supabase';
import { soundEffects } from '@/lib/sound';
import { useToast } from '@/hooks/use-toast';
import { useAuthUser } from '@/hooks/useAuthUser';
import { checkReelUrlIsDuplicate } from '@/lib/reelsDeduplication';

export default function ReelsUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: currentUser } = useAuthUser();

  // Form States
  const [tiktokUrl, setTiktokUrl] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ReelCategory>('AI Prompts');
  const [promptText, setPromptText] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');

  // Duplication & Extraction States
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    title?: string;
    author?: string;
  } | null>(null);

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string>('');
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

  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Gemini AI States
  const [aiAction, setAiAction] = useState<'enhance' | 'translate' | 'ideas'>('enhance');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiExtraInstructions, setAiExtraInstructions] = useState<string>('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string>('');

  // Handle URL Blur - check duplicates
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

  // Extract Clean TikTok Stream Details
  const handleExtract = async () => {
    if (!tiktokUrl.trim()) {
      setExtractError('Please enter a TikTok video or photo slide link.');
      return;
    }

    setIsExtracting(true);
    setExtractError('');

    try {
      // 1. Double check duplicates
      const dupCheck = await checkReelUrlIsDuplicate(tiktokUrl);
      if (dupCheck.isDuplicate) {
        setDuplicateInfo({
          isDuplicate: true,
          title: dupCheck.duplicateTitle,
          author: dupCheck.author
        });
        setExtractError(`This URL is already uploaded as "${dupCheck.duplicateTitle || 'Reel'}" by @${dupCheck.author || 'Creator'}.`);
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
        setExtractError(res.error || 'Could not extract video. Check your TikTok link.');
      }
    } catch (err: any) {
      setExtractError(err.message || 'Failed to extract TikTok media.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Run Gemini Prompt Engineering Assistant
  const handleRunAi = async () => {
    if (aiAction === 'enhance' && !promptText.trim()) {
      setAiError('Please type a base prompt or instruction first to enhance.');
      return;
    }
    if (aiAction === 'translate' && !promptText.trim()) {
      setAiError('Please enter some text in the Prompt field to translate.');
      return;
    }

    setIsAiLoading(true);
    setAiError('');
    setAiResult(null);
    soundEffects.play('click');

    try {
      const response = await fetch('/api/ai/reels-prompt-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: aiAction,
          promptText: promptText,
          title: title,
          category: category,
          extraInstructions: aiExtraInstructions,
        })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setAiResult(resData.data);
        soundEffects.play('pop');
        toast({
          title: "Gemini Assisted! 🧠✨",
          description: "AI prompt formulation is ready to apply.",
        });
      } else {
        setAiError(resData.message || 'Gemini error processing your prompt.');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Failed to connect to prompt assistant server.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply Gemini Generated Output directly to Form fields
  const handleApplyAi = (data: any) => {
    if (aiAction === 'enhance') {
      if (data.enhancedPrompt) setPromptText(data.enhancedPrompt);
      if (data.tips && data.tips.length > 0 && !description.trim()) {
        setDescription(data.tips.join('. '));
      }
    } else if (aiAction === 'translate') {
      if (data.translatedPrompt) setPromptText(data.translatedPrompt);
    }
    soundEffects.play('success');
    toast({
      title: "Applied to Form! ✅",
      description: "Prompt text has been updated with Gemini's response.",
    });
  };

  // Apply a Concept from Idea Generation
  const handleApplyConcept = (concept: any) => {
    if (concept.title) setTitle(concept.title.slice(0, 80));
    if (concept.prompt) setPromptText(concept.prompt);
    if (concept.hook && !description.trim()) {
      setDescription(`Hook: ${concept.hook}`);
    }
    soundEffects.play('success');
    toast({
      title: "Concept Applied! 🚀",
      description: `Title and prompt replaced with "${concept.title}".`,
    });
  };

  // Submit and Publish Reel directly to database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tiktokUrl.trim()) {
      setExtractError('TikTok URL is required to extract clean video stream.');
      return;
    }

    const dupCheck = await checkReelUrlIsDuplicate(tiktokUrl);
    if (dupCheck.isDuplicate) {
      setDuplicateInfo({
        isDuplicate: true,
        title: dupCheck.duplicateTitle,
        author: dupCheck.author
      });
      setExtractError(`Cannot upload: Duplicate TikTok URL detected.`);
      soundEffects.play('alert');
      return;
    }

    if (!title.trim()) {
      setExtractError('Please give this reel a short title.');
      return;
    }

    if (!promptText.trim()) {
      setExtractError('Please enter the prompt, curve recipe, or copyable formula.');
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

      // Force instant extraction if the user bypassed preview
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

      const { error } = await supabase
        .from('reels_posts')
        .insert([dbRecord]);

      if (error) {
        console.error('Supabase reels_posts insert error:', error);
        throw new Error(error.message || 'Database insert failed');
      }

      soundEffects.play('resonantHit');
      toast({
        title: "Reel Published! 🚀",
        description: `Successfully added to feed database by @${creatorDisplayName}.`,
      });

      // Clear states and redirect
      setLocation('/reels');
    } catch (err: any) {
      console.error('Publish reel error:', err);
      setExtractError(err.message || 'Failed to publish reel to database.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 1. Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/80 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              soundEffects.play('click');
              setLocation('/reels');
            }}
            className="w-10 h-10 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Video className="w-6 h-6 text-primary" />
              Upload Reels Prompt
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create a dedicated prompt, extract clean video stream, and assist with Gemini AI
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundEffects.play('click');
            setLocation('/reels');
          }}
          className="text-xs font-bold text-primary hover:underline self-start sm:self-auto"
        >
          View Reels Feed →
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ==================== LEFT COLUMN: EXTRACTION & GEMINI AI ASSISTANT ==================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* TikTok link Extraction box */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xl">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-4 text-foreground uppercase tracking-wide">
              <Link2 className="w-4 h-4 text-primary" />
              1. Clean Stream Extractor
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  TikTok Video or Photo Slideshow Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://www.tiktok.com/@username/video/..."
                    value={tiktokUrl}
                    onChange={(e) => {
                      setTiktokUrl(e.target.value);
                      setExtractedData(null);
                      setDuplicateInfo(null);
                      setExtractError('');
                    }}
                    onBlur={handleUrlBlur}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl bg-muted/40 border text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                      duplicateInfo?.isDuplicate 
                        ? 'border-rose-500 focus:ring-rose-500/30' 
                        : 'border-border focus:ring-primary/20 focus:border-primary'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleExtract}
                    disabled={isExtracting || !tiktokUrl.trim() || !!duplicateInfo?.isDuplicate}
                    className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 h-[42px]"
                  >
                    {isExtracting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-primary" />
                    )}
                    Extract
                  </button>
                </div>
              </div>

              {/* Duplicate Detection Alert */}
              {duplicateInfo?.isDuplicate && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs flex items-start gap-2.5 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-rose-500">Already in Database! 🛑</p>
                    <p className="text-foreground/90 mt-0.5 leading-relaxed">
                      This link has been published as <span className="font-semibold text-rose-400">"{duplicateInfo.title || 'Existing Reel'}"</span> by <span className="font-semibold">@{duplicateInfo.author || 'Creator'}</span>.
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Duplicate links are blocked to preserve feed quality.
                    </p>
                  </div>
                </div>
              )}

              {/* Extraction Preview Detail */}
              {extractedData && !duplicateInfo?.isDuplicate && (
                <div className="p-4 bg-muted/30 rounded-2xl border border-border flex gap-4 animate-fade-in">
                  <img
                    src={extractedData.coverUrl || extractedData.streamUrl || undefined}
                    alt="Preview Cover"
                    className="w-14 h-20 object-cover rounded-xl bg-black border border-white/10 shrink-0 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">
                        {extractedData.mediaType} Ready
                      </span>
                      <p className="text-xs text-muted-foreground mt-1.5 truncate">
                        {extractedData.musicTitle || 'Original Audio'}
                      </p>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Clean watermark-free stream resolved.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GEMINI AI ASSISTANT PANEL */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <h2 className="text-sm font-bold flex items-center gap-2 mb-4 text-foreground uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
              2. Gemini AI Prompt Crafter
            </h2>

            <div className="space-y-4">
              {/* Segmented Actions */}
              <div className="grid grid-cols-3 p-1 rounded-xl bg-muted/60 border border-border text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAiAction('enhance');
                    setAiResult(null);
                    setAiError('');
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    aiAction === 'enhance'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                  Enhance
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAiAction('translate');
                    setAiResult(null);
                    setAiError('');
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    aiAction === 'translate'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Languages className="w-3.5 h-3.5 text-indigo-500" />
                  Translate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAiAction('ideas');
                    setAiResult(null);
                    setAiError('');
                  }}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                    aiAction === 'ideas'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Ideas
                </button>
              </div>

              {/* Instructions field */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  {aiAction === 'ideas' 
                    ? 'Theme/Topic of interest (e.g. Vintage Cyberpunk)' 
                    : 'Extra guidelines for Gemini (Optional)'
                  }
                </label>
                <input
                  type="text"
                  placeholder={
                    aiAction === 'ideas'
                      ? 'e.g. Neon Bengal, CapCut Cinematic, VFX Curve'
                      : 'e.g. Photorealistic 8k, Midjourney aspect 16:9, Niji style'
                  }
                  value={aiExtraInstructions}
                  onChange={(e) => setAiExtraInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <button
                type="button"
                onClick={handleRunAi}
                disabled={isAiLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating details via Gemini 3.7...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze & Craft with Gemini AI
                  </>
                )}
              </button>

              {aiError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* GEMINI AI OUTPUT CONTAINER */}
              <AnimatePresence mode="wait">
                {aiResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-2xl border border-border bg-muted/30 space-y-3 max-h-[300px] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between border-b border-border/80 pb-2">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Gemini Proposal
                      </span>
                      {aiAction !== 'ideas' && (
                        <button
                          type="button"
                          onClick={() => handleApplyAi(aiResult)}
                          className="px-2.5 py-1 rounded bg-primary/20 hover:bg-primary/35 text-[10px] font-black text-primary transition-all"
                        >
                          Apply to Form
                        </button>
                      )}
                    </div>

                    {/* Enhance Prompt Proposal */}
                    {aiAction === 'enhance' && (
                      <div className="space-y-2.5 text-xs text-foreground/95">
                        <div>
                          <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Enhanced Copyable Prompt:</p>
                          <p className="p-2.5 bg-background border border-border/60 rounded-lg font-mono text-xs select-all mt-1 whitespace-pre-wrap leading-relaxed">
                            {aiResult.enhancedPrompt}
                          </p>
                        </div>
                        {aiResult.suggestedTags && aiResult.suggestedTags.length > 0 && (
                          <div>
                            <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">Suggested Tags:</p>
                            <div className="flex flex-wrap gap-1">
                              {aiResult.suggestedTags.map((t: string) => (
                                <span key={t} className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] border border-cyan-500/15">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {aiResult.tips && aiResult.tips.length > 0 && (
                          <div>
                            <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Usage Tips:</p>
                            <ul className="list-disc pl-4 space-y-1 mt-1 font-medium text-muted-foreground">
                              {aiResult.tips.map((t: string, i: number) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Translate Prompt Proposal */}
                    {aiAction === 'translate' && (
                      <div className="space-y-2.5 text-xs text-foreground/95">
                        <div>
                          <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Translated Copyable Result:</p>
                          <p className="p-2.5 bg-background border border-border/60 rounded-lg font-mono text-xs select-all mt-1 whitespace-pre-wrap">
                            {aiResult.translatedPrompt}
                          </p>
                        </div>
                        {aiResult.explanation && (
                          <div>
                            <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Translation Insight:</p>
                            <p className="text-muted-foreground mt-1 leading-relaxed">{aiResult.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Concept Ideas Proposal */}
                    {aiAction === 'ideas' && aiResult.concepts && (
                      <div className="space-y-3.5">
                        {aiResult.concepts.map((concept: any, index: number) => (
                          <div key={index} className="p-3 bg-background border border-border/60 rounded-xl space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <p className="font-extrabold text-foreground">{concept.title}</p>
                              <button
                                type="button"
                                onClick={() => handleApplyConcept(concept)}
                                className="px-2 py-0.5 bg-primary/20 hover:bg-primary/35 text-[9px] font-black text-primary rounded transition-all"
                              >
                                Apply Idea
                              </button>
                            </div>
                            <p className="text-muted-foreground leading-normal"><span className="font-bold text-emerald-400">Hook:</span> {concept.hook}</p>
                            <div className="p-2 bg-muted/60 border border-border/40 rounded font-mono text-[11px] select-all whitespace-pre-wrap leading-relaxed">
                              {concept.prompt}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT COLUMN: REELS POSTS FORM DETAILS ==================== */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl space-y-5">
          <h2 className="text-sm font-bold flex items-center gap-2 pb-3 border-b border-border/80 text-foreground uppercase tracking-wide">
            <FileText className="w-4 h-4 text-primary" />
            3. Reels Metadata Details
          </h2>

          {/* Title input */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Reel / Prompt Title *
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

          {/* Category Dropdown */}
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

          {/* Prompt Formula textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                Prompt / Formula / Instructions *
              </label>
              <span className="text-[10px] text-muted-foreground font-medium">This will be copied with 1-Click</span>
            </div>
            <textarea
              required
              rows={5}
              placeholder="Enter full Midjourney prompt, CapCut curve settings, FLUX formula, or VFX preset recipe..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-xs sm:text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y leading-relaxed"
            />
          </div>

          {/* Description input */}
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

          {/* Author input */}
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

          {/* Extract Error Alert */}
          {extractError && !duplicateInfo?.isDuplicate && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{extractError}</span>
            </div>
          )}

          {/* Submit Action Block */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/80">
            <button
              type="button"
              onClick={() => {
                soundEffects.play('click');
                setLocation('/reels');
              }}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPublishing || !!duplicateInfo?.isDuplicate}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 h-[42px]"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing to Feed...
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
}
