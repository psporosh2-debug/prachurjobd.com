import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, Sparkles, Copy, Check, Zap, AlertCircle, RefreshCw, 
  Tag, Hash, BookOpen, Layers, CheckCircle2, Share2, CornerDownRight
} from "lucide-react";
import { generateDescriptionIdeas, DescriptionGeneratorResult } from "@/api/aiService";
import { saveGeneratedDescriptionToDb } from "@/lib/youtubeDb";
import { useHistory } from "@/hooks/useHistory";
import { sound } from "@/lib/sound";
import { VersionBadge } from "@/components/VersionBadge";

const presetIdeas = [
  { label: "iPhone 16 Pro Review & Unboxing", type: "video" as const, tone: "Clicky & Energetic" },
  { label: "Complete Python Course for Beginners", type: "video" as const, tone: "SEO Heavy & Professional" },
  { label: "How to Make Money on YouTube in 2026", type: "video" as const, tone: "Engaging & Friendly", language: "English" },
  { label: "Gaming & Tech Review Channel About", type: "channel" as const, tone: "Engaging & Friendly" },
  { label: "Daily Vlogs & Travel Adventures", type: "video" as const, tone: "Storytelling & Relatable" },
];

export default function DescriptionGenerator() {
  const [descType, setDescType] = useState<"video" | "channel">("video");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Engaging & Friendly");
  const [language, setLanguage] = useState("English");
  const [timestamps, setTimestamps] = useState(true);
  const [socialLinks, setSocialLinks] = useState(true);
  const [extraPrompt, setExtraPrompt] = useState("");
  const { addHistoryItem } = useHistory();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DescriptionGeneratorResult | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{ cached?: boolean; tokensSaved?: number; tokensUsed?: number } | null>(null);

  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedHook, setCopiedHook] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);

  const handlePresetSelect = (preset: typeof presetIdeas[0]) => {
    sound.click();
    setDescType(preset.type);
    if (preset.type === "channel") {
      setTitle(preset.label);
      setTopic("Daily tech tutorials, gadget reviews, and gaming benchmarks.");
    } else {
      setTitle(preset.label);
      setTopic("Comprehensive breakdown, pros and cons, buying guide, and practical tips.");
    }
    setTone(preset.tone);
    if (preset.language) setLanguage(preset.language);
  };

  const handleSubmit = async (e?: React.FormEvent, bypassCache: boolean = false) => {
    if (e) e.preventDefault();
    if (!title.trim() && !topic.trim()) {
      sound.error();
      setError("Please enter a Video Title, Channel Name, or Topic details.");
      return;
    }

    sound.generate();
    setLoading(true);
    setError(null);

    try {
      const res = await generateDescriptionIdeas({
        type: descType,
        title: title.trim(),
        topic: topic.trim(),
        tone,
        language,
        timestamps: descType === "video" ? timestamps : false,
        socialLinks,
        extraPrompt: extraPrompt.trim(),
        bypassCache,
      });

      setResult(res.data);
      sound.success();

      // Asynchronously store generated description in Supabase / Local database cache
      if (res?.data) {
        saveGeneratedDescriptionToDb(
          title.trim() || topic.trim(),
          descType === 'video' ? 'Video' : 'Channel',
          res.data
        ).catch(() => {});
      }

      setTokenInfo({
        cached: res.cached,
        tokensSaved: res.tokensSaved,
        tokensUsed: res.tokensUsed,
      });
      
      addHistoryItem({
        type: 'desc_gen',
        title: title || topic || 'Generated Description',
        description: `Type: ${descType}, Tone: ${tone}`
      });
    } catch (err: any) {
      sound.error();
      setError(err?.message || "Failed to generate description. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, setCopiedState: (v: boolean) => void) => {
    sound.copy();
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const charCount = result ? result.fullDescription.length : 0;
  const wordCount = result ? result.fullDescription.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 relative">
        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/10 via-teal-500/10 to-indigo-600/10 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-indigo-900/30 border border-emerald-500/20 p-8 text-center sm:text-left">
          <div className="absolute top-4 right-4 z-20">
            <VersionBadge />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini AI Engine + Token Saver
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                YouTube Description Generator
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                Create search-optimized video descriptions and channel "About" sections in seconds. Built with search snippets, chapter placeholders, call-to-actions, and hashtags.
              </p>
            </div>
            <div className="hidden lg:flex items-center justify-center p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl">
              <FileText className="w-16 h-16 text-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Quick Ideas / Presets */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Templates & Example Topics:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {presetIdeas.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="text-xs bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 rounded-lg px-3 py-1.5 transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>{preset.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  {preset.type}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form & Options */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-6">
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            
            {/* Type Switcher */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Description Type
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setDescType("video")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                    descType === "video"
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Video Description
                </button>
                <button
                  type="button"
                  onClick={() => setDescType("channel")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all ${
                    descType === "channel"
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Channel About
                </button>
              </div>
            </div>

            {/* Title / Name & Topic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {descType === "video" ? "Video Title (or Main Idea) *" : "Channel Name *"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={descType === "video" ? "e.g., iPhone 16 Pro Review After 30 Days" : "e.g., TechVerse Bangla"}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Key Topics / Points Covered
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., camera comparison, battery test, price, verdict"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            {/* Tone & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Writing Tone & Style
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                >
                  <option value="Engaging & Friendly">Engaging & Friendly</option>
                  <option value="SEO Heavy & Professional">SEO Heavy & Professional</option>
                  <option value="Clicky & Energetic">Clicky & Energetic</option>
                  <option value="Minimalist & Clean">Minimalist & Clean</option>
                  <option value="Storytelling & Relatable">Storytelling & Relatable</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Target Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                >
                  <option value="English">English</option>
                  <option value="Bangla / Banglish">Bangla / Banglish</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2 md:col-span-1">
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Extra Focus / Specific Request
                </label>
                <input
                  type="text"
                  value={extraPrompt}
                  onChange={(e) => setExtraPrompt(e.target.value)}
                  placeholder="e.g., mention 10% discount link"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Checkbox Features */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
              {descType === "video" && (
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timestamps}
                    onChange={(e) => setTimestamps(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  />
                  Include Chapter Timestamps (00:00)
                </label>
              )}

              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={socialLinks}
                  onChange={(e) => setSocialLinks(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                />
                Include Social Links & Subscribe CTA
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>AI Token Saver Active (Instant Cache + Optimized Tokens)</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Generating Description...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate AI Description</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Token Saver Banner */}
            {tokenInfo && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                  <span className="font-semibold">
                    {tokenInfo.cached ? "Served instantly from AI Token Saver Cache!" : "Generated via Gemini AI Engine"}
                  </span>
                </div>
                {tokenInfo.tokensSaved && (
                  <span className="font-mono bg-emerald-500/20 px-2.5 py-1 rounded-md">
                    ⚡ Tokens Saved: ~{tokenInfo.tokensSaved}
                  </span>
                )}
              </div>
            )}

            {/* Main Output Box */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-800 space-y-6">
              
              {/* Box Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    Generated Description
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {charCount} characters • {wordCount} words (YouTube Max Limit: 5,000 chars)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSubmit(undefined, true)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all"
                    title="Regenerate with fresh AI variation"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>

                  <button
                    onClick={() => handleCopyText(result.fullDescription, setCopiedFull)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
                  >
                    {copiedFull ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedFull ? "Copied Full!" : "Copy Full Description"}</span>
                  </button>
                </div>
              </div>

              {/* Hook Snippet Preview */}
              {result.hookParagraph && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <CornerDownRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Search Snippet Hook (First 2 Lines)
                    </span>
                    <button
                      onClick={() => handleCopyText(result.hookParagraph, setCopiedHook)}
                      className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      {copiedHook ? "Copied!" : "Copy Hook"}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium">
                    {result.hookParagraph}
                  </p>
                </div>
              )}

              {/* Full Description Textarea / Pre */}
              <div className="relative rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4">
                <pre className="whitespace-pre-wrap text-xs sm:text-sm font-sans text-slate-800 dark:text-slate-200 leading-relaxed max-h-[450px] overflow-y-auto">
                  {result.fullDescription}
                </pre>
              </div>

              {/* Hashtags & Keywords Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Hashtags */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-indigo-500" />
                      Suggested #Hashtags ({result.suggestedHashtags.length})
                    </span>
                    <button
                      onClick={() => handleCopyText(result.suggestedHashtags.join(" "), setCopiedHashtags)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {copiedHashtags ? "Copied!" : "Copy Hashtags"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.suggestedHashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium"
                      >
                        {tag.startsWith("#") ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Search Keywords */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-500" />
                    <span>Included SEO Keywords ({result.suggestedKeywords.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.suggestedKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategy Tip Summary */}
              {result.summary && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-3">
                  <BookOpen className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white mr-1.5">Pro Strategy Tip:</span>
                    <span>{result.summary}</span>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </div>
  );
}
