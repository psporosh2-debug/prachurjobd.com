import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Wand2,
  RefreshCw,
  Zap,
  TrendingUp,
  SlidersHorizontal,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  Database,
  Cpu,
  Flame,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Tag,
  Share2,
  ChevronRight,
  RotateCcw
} from "lucide-react";
import { generateTitleIdeas, GeneratedTitleItem, TitleGeneratorApiResponse } from "@/api/aiService";
import { saveGeneratedTitlesToDb } from "@/lib/youtubeDb";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/useHistory";
import { sound } from "@/lib/sound";
import { VersionBadge } from "@/components/VersionBadge";

const PRESET_TEMPLATES = [
  { topic: "iPhone 16 Pro Review after 30 Days", category: "Tech & Gadgets", tone: "High CTR & Viral" },
  { topic: "Learn Python Programming in 1 Hour", category: "Education & Coding", tone: "How-To & Educational" },
  { topic: "How I Made $1,000/Month with AI", category: "Finance & Business", tone: "Curiosity & Hook" },
  { topic: "10 Mind-Blowing Travel Spots in Bali", category: "Travel & Vlogs", tone: "Listicle & Numbers" },
  { topic: "Minecraft Hardcore Survival Day 100", category: "Gaming", tone: "Storytelling & Vlog" },
  { topic: "Easy 10 Minute Healthy Breakfast", category: "Food & Fitness", tone: "How-To & Educational" },
];

const CATEGORIES = [
  "General / All",
  "Tech & Gadgets",
  "Gaming",
  "Education & Tutorials",
  "Finance & Business",
  "Entertainment & Vlogs",
  "Travel & Lifestyle",
  "Fitness & Health",
  "Food & Cooking",
  "News & Reaction",
  "Music & Podcasts",
];

const TONES = [
  "High CTR & Viral",
  "Curiosity & Hook",
  "How-To & Educational",
  "Listicle & Numbers",
  "Storytelling & Vlog",
  "Professional & Authoritative",
  "Shocking & Bold",
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Global / Multilingual",
];

export default function TitleGenerator() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [category, setCategory] = useState("General / All");
  const [tone, setTone] = useState("High CTR & Viral");
  const [language, setLanguage] = useState("English");
  const [extraPrompt, setExtraPrompt] = useState("");
  const { addHistoryItem } = useHistory();

  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<TitleGeneratorApiResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedHookIndex, setCopiedHookIndex] = useState<number | null>(null);
  const [copiedKeywordIndex, setCopiedKeywordIndex] = useState<number | null>(null);

  const [selectedFilter, setSelectedFilter] = useState("All");
  const [savedTitles, setSavedTitles] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("prachurjo_saved_titles");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("prachurjo_saved_titles", JSON.stringify(savedTitles));
    } catch (_) {}
  }, [savedTitles]);

  const handleGenerate = async (bypassCache = false) => {
    if (!topic.trim() && !currentTitle.trim()) {
      sound.error();
      toast({
        title: "Topic Required",
        description: "Please enter a video topic, keyword, or current title to generate ideas.",
        variant: "destructive",
      });
      return;
    }

    sound.generate();
    setLoading(true);
    try {
      const response = await generateTitleIdeas({
        topic: topic.trim(),
        currentTitle: currentTitle.trim(),
        category: category !== "General / All" ? category : undefined,
        tone,
        language,
        extraPrompt: extraPrompt.trim(),
        bypassCache,
      });

      setApiResponse(response);
      sound.success();

      // Asynchronously store generated titles in Supabase / Local database cache
      if (response?.data?.titles && response.data.titles.length > 0) {
        saveGeneratedTitlesToDb(
          topic.trim() || currentTitle.trim(),
          category,
          tone,
          language,
          response.data.titles
        ).catch(() => {});
      }

      toast({
        title: "Titles Generated!",
        description: `Created ${response.data.titles.length} high-CTR title variations.`,
      });

      addHistoryItem({
        type: 'title_gen',
        title: topic || currentTitle || 'Generated Title',
        description: `Generated ${response.data.titles.length} titles in ${tone}`
      });
    } catch (err: any) {
      sound.error();
      toast({
        title: "Generation Failed",
        description: err?.message || "Failed to generate AI titles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number, type: "title" | "hook" | "keyword") => {
    sound.copy();
    navigator.clipboard.writeText(text);
    if (type === "title") {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else if (type === "hook") {
      setCopiedHookIndex(index);
      setTimeout(() => setCopiedHookIndex(null), 2000);
    } else {
      setCopiedKeywordIndex(index);
      setTimeout(() => setCopiedKeywordIndex(null), 2000);
    }

    toast({
      title: "Copied to Clipboard!",
      description: `"${text.slice(0, 40)}..." is ready to paste.`,
    });
  };

  const toggleSaveTitle = (titleText: string) => {
    sound.bookmark();
    if (savedTitles.includes(titleText)) {
      setSavedTitles(savedTitles.filter((t) => t !== titleText));
      toast({ description: "Removed from saved titles." });
    } else {
      setSavedTitles([...savedTitles, titleText]);
      toast({ description: "Saved title to your bookmarks!" });
    }
  };

  const applyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    sound.click();
    setTopic(preset.topic);
    setCategory(preset.category);
    setTone(preset.tone);
  };

  const resultData = apiResponse?.data;

  // Filter titles based on tab selection
  const filteredTitles = resultData?.titles.filter((item) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Saved") return savedTitles.includes(item.title);
    return item.style.toLowerCase().includes(selectedFilter.toLowerCase());
  }) || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto relative">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/30 via-card to-purple-900/30 border border-indigo-500/20 p-6 md:p-10 shadow-xl">
        <div className="absolute top-4 right-4 z-20">
          <VersionBadge />
        </div>
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gemini AI Engine + Token Saver</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              YouTube Title Generator
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              Generate 10+ viral, high-CTR, SEO-optimized YouTube video titles in seconds. Boost your views, clicks, and ranking with AI psychology.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hidden sm:block">
              <Zap className="w-8 h-8 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Preset Fast Chips */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          Quick Ideas & Topic Templates:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_TEMPLATES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 rounded-xl bg-card hover:bg-muted border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>{preset.topic}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Input Panel */}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-7 shadow-md space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Topic Input */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Video Topic, Keyword, or Main Concept *</span>
              <span className="text-[10px] text-muted-foreground font-normal">e.g. iPhone 16 review, Python tutorial</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What is your video about? (e.g. How to get 1,000 subscribers fast)"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium outline-none transition-all pr-10"
              />
              {topic && (
                <button
                  onClick={() => setTopic("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Current Title to improve (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Current Title to Refine <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              placeholder="Paste existing title if you want to fix it..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-indigo-500 text-xs font-medium outline-none transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Video Niche / Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-indigo-500 text-xs font-medium outline-none transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tone Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Title Style & Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-indigo-500 text-xs font-medium outline-none transition-all"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Language Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Target Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-indigo-500 text-xs font-medium outline-none transition-all"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>AI Token Saver Active (Instant Cache + Optimized Prompts)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {apiResponse && (
              <button
                onClick={() => handleGenerate(true)}
                disabled={loading}
                title="Bypass cache and generate fresh AI ideas"
                className="px-3.5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border border-border flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            )}

            <button
              onClick={() => handleGenerate(false)}
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Viral Titles...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate AI Titles</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Output Results Section */}
      {resultData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Token Saver Banner */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Token Saver Status:</span>
              <span className="font-normal text-muted-foreground">
                {apiResponse.cached
                  ? "⚡ Served from Instant Cache (0 Tokens Used)"
                  : "Optimized prompt token reduction applied."}
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] text-foreground">
              {apiResponse.tokensSaved && apiResponse.tokensSaved > 0 && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-md font-bold">
                  Saved ~{apiResponse.tokensSaved} Tokens
                </span>
              )}
              {apiResponse.cached ? (
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-500 rounded-md font-bold flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Cached
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-500 rounded-md font-bold flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Used ~{apiResponse.tokensUsed || 300} Tokens
                </span>
              )}
            </div>
          </div>

          {/* Strategy Summary Card */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                AI Title Strategy Recommendation
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {resultData.summary}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              {["All", "Viral", "Curiosity", "How-To", "Listicle", "SEO", "Saved"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                    selectedFilter === filter
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-card hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {filter === "Saved" && <Bookmark className="w-3 h-3" />}
                  <span>{filter} {filter === "Saved" ? `(${savedTitles.length})` : ""}</span>
                </button>
              ))}
            </div>

            <span className="text-xs text-muted-foreground font-medium">
              Showing {filteredTitles.length} of {resultData.titles.length} titles
            </span>
          </div>

          {/* Title List */}
          <div className="grid grid-cols-1 gap-3.5">
            {filteredTitles.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-2xl p-6">
                <p className="text-sm text-muted-foreground font-medium">No titles found for this filter.</p>
              </div>
            ) : (
              filteredTitles.map((item, idx) => {
                const isSaved = savedTitles.includes(item.title);
                const isGoodLength = item.charCount <= 65;

                return (
                  <div
                    key={idx}
                    className="group bg-card hover:bg-card/90 border border-border hover:border-indigo-500/30 rounded-2xl p-4 md:p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      {/* Top Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                          {item.style}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-extrabold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          CTR Score: {item.ctrScore}/100
                        </span>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                            isGoodLength
                              ? "bg-muted text-muted-foreground"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {item.charCount} chars {isGoodLength ? "(Optimal YouTube Length)" : "(May truncate on mobile)"}
                        </span>
                      </div>

                      {/* Title Text */}
                      <h3 className="text-base md:text-lg font-bold text-foreground leading-snug tracking-tight">
                        {item.title}
                      </h3>

                      {/* Reason & Power Words */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>💡 {item.reason}</span>
                        {item.powerWords && item.powerWords.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] uppercase font-bold text-indigo-400">Power Words:</span>
                            {item.powerWords.map((pw, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground font-semibold">
                                {pw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                      <button
                        onClick={() => toggleSaveTitle(item.title)}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isSaved
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                            : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                        }`}
                        title={isSaved ? "Remove from saved" : "Save title"}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleCopy(item.title, idx, "title")}
                        className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Title</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Script Intro Hooks & Keywords Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
            {/* Script Hooks */}
            {resultData.viralHooks && resultData.viralHooks.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>30-Second Video Intro Hooks</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Say one of these hooks in the first 5 seconds of your video to maximize retention:
                </p>
                <div className="space-y-2">
                  {resultData.viralHooks.map((hook, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-muted/50 border border-border/50 text-xs text-foreground flex items-center justify-between gap-2"
                    >
                      <p className="italic font-medium">"{hook}"</p>
                      <button
                        onClick={() => handleCopy(hook, i, "hook")}
                        className="p-1.5 rounded-lg bg-background hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 border border-border"
                      >
                        {copiedHookIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Target Keywords */}
            {resultData.suggestedKeywords && resultData.suggestedKeywords.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  <span>Target SEO Keywords</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Primary keywords embedded inside these titles for search ranking:
                </p>
                <div className="flex flex-wrap gap-2">
                  {resultData.suggestedKeywords.map((kw, i) => (
                    <button
                      key={i}
                      onClick={() => handleCopy(kw, i, "keyword")}
                      className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 border border-border text-xs font-semibold text-foreground flex items-center gap-1.5 transition-all"
                    >
                      <span>{kw}</span>
                      {copiedKeywordIndex === i ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Educational & SEO FAQ Section */}
      <section className="bg-card border border-border rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>How to Choose the Best YouTube Video Title</span>
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Your title and thumbnail determine over 80% of your video's Click-Through-Rate (CTR). Here are the rules of high-performing YouTube titles:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Character Count</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Keep titles between <strong>40 and 65 characters</strong>. Longer titles get cut off with "..." on mobile devices.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>2. Curiosity Gap</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create a tension between what the viewer knows and what they want to find out, without resorting to fake clickbait.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>3. Power Words</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Use high-converting trigger words like <em>Tested, Secret, Tested, Ultimate, Stop, Don't, Proven</em> to trigger emotion.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
