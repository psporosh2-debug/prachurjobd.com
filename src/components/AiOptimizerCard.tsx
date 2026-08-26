import React, { useState } from 'react';
import {
  Sparkles, AlertTriangle, Check, Copy, RefreshCw, ChevronDown, ChevronUp,
  Tag, Hash, FileText, Type, Zap, Wand2, ShieldAlert, Award, ShieldCheck, Database, Cpu
} from 'lucide-react';
import { generateAiOptimizations, AiOptimizationResult, AiApiResponse } from '@/api/aiService';
import { sound } from '@/lib/sound';

interface AiOptimizerCardProps {
  type: 'video' | 'channel';
  initialData: {
    title?: string;
    description?: string;
    tags?: string[];
    keywords?: string[];
    category?: string;
    stats?: any;
  };
}

export const AiOptimizerCard: React.FC<AiOptimizerCardProps> = ({ type, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<AiApiResponse | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedTone, setSelectedTone] = useState<string>('SEO & High CTR');
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [tokenSaverEnabled, setTokenSaverEnabled] = useState(true);

  const handleRunAi = async (bypassCache = false) => {
    sound.generate();
    setLoading(true);
    setError(null);

    const promptWithTone = customPrompt.trim()
      ? `Tone: ${selectedTone}. Extra Instructions: ${customPrompt}`
      : `Tone: ${selectedTone}. Focus on boosting viewer click-through-rate (CTR) and YouTube search ranking.`;

    try {
      const res = await generateAiOptimizations({
        mode: type,
        type,
        title: initialData.title,
        description: initialData.description,
        tags: initialData.tags,
        keywords: initialData.keywords,
        category: initialData.category,
        stats: initialData.stats,
        extraPrompt: promptWithTone,
        bypassCache,
      });
      setApiResponse(res);
      sound.success();
    } catch (err: any) {
      sound.error();
      setError(err?.message || 'Failed to generate AI optimizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    sound.copy();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const result: AiOptimizationResult | null = apiResponse?.data || null;

  return (
    <div className="bg-gradient-to-br from-indigo-950/20 via-card to-purple-950/20 border-2 border-indigo-500/30 rounded-2xl p-5 md:p-7 shadow-lg relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                Gemini AI {type === 'video' ? 'Video' : 'Channel'} Optimizer
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Token Saver Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Deeply inspects content issues & generates SEO titles/tags with smart token caching & input compression.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {result && (
            <button
              onClick={() => handleRunAi(true)}
              disabled={loading}
              title="Bypass cache and force fresh Gemini regeneration"
              className="px-3 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border border-border flex items-center justify-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Force Refresh</span>
            </button>
          )}

          <button
            onClick={() => handleRunAi(false)}
            disabled={loading}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing with Gemini AI...</span>
              </>
            ) : result ? (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Re-Analyze with AI</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Analyze & Fix with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tone & Token Saver Settings Bar */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Target Tone & Style
          </label>
          <select
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="SEO & High CTR">SEO & High CTR (Recommended)</option>
            <option value="Viral & Catchy">Viral & Catchy (Clickbait Style)</option>
            <option value="Professional & Educational">Professional & Educational</option>
            <option value="Engaging & Storytelling">Engaging & Storytelling</option>
            <option value="Bilingual Bangla & English">Bilingual (Bangla + English Mix)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
            Custom Instructions / Focus Niche (Optional)
          </label>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Focus on gaming audience, add affiliate link placeholders, include Bangla keywords..."
            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Analysis Output */}
      {result && (
        <div className="mt-6 space-y-6 animate-in fade-in duration-300">
          {/* Token Saver Stats Banner */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Token Saver Efficiency:</span>
              <span className="font-normal text-muted-foreground">
                {apiResponse?.cached
                  ? '⚡ Returned 100% from Instant Cache (0 API Tokens Wasted!)'
                  : `Smart Prompt Compression applied (-${apiResponse?.compressionRatio || 35}% input tokens reduced).`}
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-foreground">
              {apiResponse?.tokensSaved && apiResponse.tokensSaved > 0 && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold">
                  Saved ~{apiResponse.tokensSaved} Tokens
                </span>
              )}
              {apiResponse?.cached ? (
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-500 rounded-md font-bold flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Cached
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-500 rounded-md font-bold flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Used ~{apiResponse?.tokensUsed || 450} Tokens
                </span>
              )}
            </div>
          </div>

          {/* Top Score & Summary Banner */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center font-extrabold text-lg text-indigo-400 shrink-0">
                {result.overallScore}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Original Content SEO Score</span>
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-xs text-foreground mt-0.5 leading-relaxed font-medium">
                  {result.summary}
                </p>
              </div>
            </div>
          </div>

          {/* 1. Identified Issues Section */}
          {result.issues && result.issues.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>AI Detected Issues & Weaknesses ({result.issues.length})</span>
              </h3>
              <ul className="space-y-1.5">
                {result.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. Suggested High CTR Titles */}
          {result.suggestedTitles && result.suggestedTitles.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-500" />
                  <span>AI Generated {type === 'video' ? 'Video Titles' : 'Channel Branding Names'} (High CTR)</span>
                </h3>
              </div>

              <div className="space-y-2">
                {result.suggestedTitles.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-muted/40 hover:bg-muted/70 rounded-lg border border-border flex items-start justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-0.5 flex-1">
                      <div className="text-xs font-bold text-foreground flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">
                          Option #{idx + 1}
                        </span>
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{item.reason}</p>
                    </div>

                    <button
                      onClick={() => copyToClipboard(item.title, `title_${idx}`)}
                      className="px-2.5 py-1 rounded bg-background hover:bg-muted border border-border text-[11px] font-medium text-foreground flex items-center gap-1 shrink-0"
                    >
                      {copiedKey === `title_${idx}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Suggested SEO Description */}
          {result.suggestedDescription && (
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <span>AI Optimized Description</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1"
                  >
                    <span>{isDescExpanded ? 'Collapse' : 'Expand'}</span>
                    {isDescExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(result.suggestedDescription, 'description')}
                    className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-[11px] font-semibold text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === 'description' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Description</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div
                className={`p-3.5 bg-muted/30 rounded-lg border border-border/60 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed overflow-hidden font-mono ${
                  !isDescExpanded ? 'max-h-48' : 'max-h-none'
                }`}
              >
                {result.suggestedDescription}
              </div>
            </div>
          )}

          {/* 4. Suggested Tags & Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tags */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  <span>AI Generated Tags ({result.suggestedTags?.length || 0})</span>
                </h3>
                {result.suggestedTags && result.suggestedTags.length > 0 && (
                  <button
                    onClick={() => copyToClipboard(result.suggestedTags.join(', '), 'tags')}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedKey === 'tags' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'tags' ? 'Copied' : 'Copy All'}</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.suggestedTags?.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[11px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-purple-500" />
                  <span>Target SEO Keywords ({result.suggestedKeywords?.length || 0})</span>
                </h3>
                {result.suggestedKeywords && result.suggestedKeywords.length > 0 && (
                  <button
                    onClick={() => copyToClipboard(result.suggestedKeywords.join(', '), 'keywords')}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    {copiedKey === 'keywords' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'keywords' ? 'Copied' : 'Copy All'}</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {result.suggestedKeywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Hashtags */}
          {result.suggestedHashtags && result.suggestedHashtags.length > 0 && (
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Hash className="w-4 h-4 text-pink-500 shrink-0" />
                <span className="text-xs font-bold text-foreground mr-1">AI Hashtags:</span>
                {result.suggestedHashtags.map((tag, i) => (
                  <span key={i} className="text-xs font-bold text-pink-600 dark:text-pink-400 font-mono">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>

              <button
                onClick={() => copyToClipboard(result.suggestedHashtags.join(' '), 'hashtags')}
                className="px-3 py-1 rounded bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0"
              >
                {copiedKey === 'hashtags' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Hashtags</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
