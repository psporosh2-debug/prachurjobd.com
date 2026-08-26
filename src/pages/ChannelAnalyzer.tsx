import React, { useState } from 'react';
import {
  Search, ExternalLink, Copy, Check, Users, Video, Eye, Globe, TrendingUp,
  Radio, AlertCircle, Sparkles, Tag, Link2, Calendar, Languages, PlayCircle,
  Baby, Shield, Layers, Hash, Database, RefreshCw, Zap
} from 'lucide-react';
import { analyzeYouTubeChannel } from '@/api/youtubeApi';
import { ChannelAnalysisData } from '@/types';
import { FaqSection } from '@/components/seo/FaqSection';
import { AiOptimizerCard } from '@/components/AiOptimizerCard';
import { useHistory } from '@/hooks/useHistory';

import { WorkflowScanner } from '@/components/WorkflowScanner';
import { sound } from '@/lib/sound';

export default function ChannelAnalyzer() {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChannelAnalysisData | null>(null);
  const { addHistoryItem } = useHistory();

  // Copy feedback state
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.FormEvent, forceFresh: boolean = false) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    sound.scan();
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeYouTubeChannel(inputUrl, forceFresh);
      setData(result);
      sound.success();
      
      addHistoryItem({
        type: 'channel_analysis',
        title: `Analyzed Channel: ${result.title}`,
        description: `Subscribers: ${result.subscribersCount.toLocaleString()}`,
        url: inputUrl
      });
    } catch (err: any) {
      sound.error();
      setError(err?.message || 'Failed to analyze channel. Please check the channel handle/URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, typeLabel: string) => {
    sound.copy();
    navigator.clipboard.writeText(text);
    setCopiedType(typeLabel);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Preset example handlers for quick testing
  const loadExample = (handle: string) => {
    sound.click();
    setInputUrl(handle);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center flex flex-col gap-2">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold w-fit mx-auto border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>YouTube V3 Deep Channel Inspection</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          YouTube Channel Analyzer
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
          Deep inspect any YouTube channel to extract creation date, account age, language, country, avg views, channel keywords, top videos, and social links.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
        <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter @username, channel URL, or Channel ID (e.g. @MrBeast)"
              className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputUrl.trim()}
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Analyzing...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Analyze Channel</span>
              </>
            )}
          </button>
        </form>

        {/* Example Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span className="font-medium">Try examples:</span>
          {['@MrBeast', '@MKBHD', '@veritasium', '@PewDiePie'].map((ex) => (
            <button
              key={ex}
              onClick={() => loadExample(ex)}
              className="px-2 py-1 rounded bg-muted/50 hover:bg-muted text-foreground transition-colors font-mono"
            >
              {ex}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <WorkflowScanner isLoading={loading} targetName={inputUrl} type="channel" />

      {/* Channel Analysis Results */}
      {data && (
        <div className="flex flex-col gap-6">
          {/* Database Cache Banner & Quick Refresh */}
          {data.fromCache && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs md:text-sm">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <span className="p-1 rounded-lg bg-emerald-500/20">
                  <Zap className="w-4 h-4 text-emerald-500" />
                </span>
                <span>
                  <strong>Database Instant Cache:</strong> Loaded from persistent database (Saved YouTube API Quota tokens).
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleAnalyze(undefined, true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 active:scale-95 transition-all text-xs shrink-0 disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Fetch Live API</span>
              </button>
            </div>
          )}

          {/* Banner & Main Card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-md">
            {/* Banner Image */}
            <div className="w-full h-36 md:h-48 bg-muted relative overflow-hidden">
              <img
                src={data.bannerUrl}
                alt={`${data.title} banner`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            {/* Profile Info Row */}
            <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6 items-start -mt-12 relative z-10">
              {/* Logo */}
              <div className="relative shrink-0">
                <img
                  src={data.logoUrl}
                  alt={data.title}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-card object-cover bg-muted shadow-lg"
                  referrerPolicy="no-referrer"
                />
                {/* Active Indicator Light */}
                <div
                  className={`absolute bottom-1 right-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                    data.isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                  title={data.isActive ? 'Active channel (recently uploaded)' : 'Inactive channel'}
                >
                  <span className={`w-2 h-2 rounded-full ${data.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  {data.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Title & Details */}
              <div className="flex-1 flex flex-col gap-2 w-full pt-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{data.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                      <span>{data.handle}</span>
                      <span>•</span>
                      <span className="text-xs">ID: {data.id}</span>
                      <button
                        onClick={() => handleCopyText(data.id, 'channelId')}
                        className="text-primary hover:underline text-[11px] font-sans flex items-center gap-1 ml-1"
                        title="Copy Channel ID"
                      >
                        {copiedType === 'channelId' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedType === 'channelId' ? 'Copied' : 'Copy ID'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {data.trailerUrl && (
                      <a
                        href={data.trailerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Watch Trailer</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleCopyText(data.directUrl, 'channelUrl')}
                      className="px-3 py-1.5 rounded-md border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      {copiedType === 'channelUrl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === 'channelUrl' ? 'Copied' : 'Copy URL'}</span>
                    </button>
                    <a
                      href={data.directUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Channel</span>
                    </a>
                  </div>
                </div>

                {/* Country, Joined & Language */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Joined: <strong>{new Date(data.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</strong> ({data.accountAge})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>Country: <strong>{data.country || 'Global'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-purple-500" />
                    <span>Language: <strong>{data.defaultLanguage}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Success Rate: <strong className="text-emerald-500 font-bold">{data.successRate}%</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-border divide-x divide-y md:divide-y-0 divide-border bg-muted/20">
              <div className="p-4 flex flex-col items-center text-center">
                <Users className="w-5 h-5 text-primary mb-1" />
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Subscribers</span>
                <span className="text-xl font-extrabold text-foreground mt-0.5">
                  {data.subscribersCount.toLocaleString()}
                </span>
              </div>

              <div className="p-4 flex flex-col items-center text-center">
                <Video className="w-5 h-5 text-indigo-500 mb-1" />
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Videos</span>
                <span className="text-xl font-extrabold text-foreground mt-0.5">
                  {data.videoCount.toLocaleString()}
                </span>
              </div>

              <div className="p-4 flex flex-col items-center text-center">
                <Eye className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total Views</span>
                <span className="text-xl font-extrabold text-foreground mt-0.5">
                  {data.viewCount.toLocaleString()}
                </span>
              </div>

              <div className="p-4 flex flex-col items-center text-center">
                <Radio className="w-5 h-5 text-emerald-500 mb-1" />
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Status Light</span>
                <span className={`text-sm font-bold mt-1 px-2.5 py-0.5 rounded-full border ${data.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                  {data.isActive ? '● Active' : '● Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid Card */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Channel Operational & Audience Parameters</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Joined Date</span>
                <strong className="text-foreground">{new Date(data.publishedAt).toLocaleDateString()}</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Channel Age</span>
                <strong className="text-foreground">{data.accountAge}</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Avg Views / Video</span>
                <strong className="text-foreground">{data.avgViewsPerVideo.toLocaleString()}</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Primary Language</span>
                <strong className="text-foreground">{data.defaultLanguage}</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Country</span>
                <strong className="text-foreground">{data.country}</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Made For Kids</span>
                <strong className={data.madeForKids ? 'text-amber-500' : 'text-foreground'}>
                  {data.madeForKids ? 'Yes (Kids Content)' : 'No (General)'}
                </strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Privacy Status</span>
                <strong className="text-foreground uppercase">{data.privacyStatus}</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Last Upload Activity</span>
                <strong className="text-foreground">
                  {data.lastActivityDate ? new Date(data.lastActivityDate).toLocaleDateString() : 'N/A'}
                </strong>
              </div>
            </div>
          </div>

          {/* AI Optimizer Card (Gemini Powered) */}
          <AiOptimizerCard
            type="channel"
            initialData={{
              title: data.title,
              description: data.description,
              keywords: data.keywords,
              category: data.topicCategories?.join(', '),
              stats: {
                subscribers: data.subscribersCount,
                videos: data.videoCount,
                views: data.viewCount,
                avgViewsPerVideo: data.avgViewsPerVideo,
                country: data.country,
                language: data.defaultLanguage,
              },
            }}
          />

          {/* Top 3 Most Viewed Videos */}
          {data.topVideos && data.topVideos.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Top 3 Most Viewed Recent Videos</span>
                </h3>
                <span className="text-xs text-muted-foreground font-medium">Sorted by Views</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.topVideos.map((vid, idx) => (
                  <div key={vid.id} className="bg-background border border-border rounded-lg overflow-hidden flex flex-col justify-between group">
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 left-2 bg-black/80 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                        #{idx + 1} Top View
                      </span>
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1 gap-3">
                      <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
                        {vid.title}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                        <span className="font-semibold text-primary">{vid.viewCount.toLocaleString()} views</span>
                        <a
                          href={vid.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-foreground hover:text-primary font-medium flex items-center gap-1"
                        >
                          <span>Watch</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel Description */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Channel About & Description</h3>
              <button
                onClick={() => handleCopyText(data.description, 'description')}
                className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded font-medium flex items-center gap-1.5 transition-colors"
              >
                {copiedType === 'description' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'description' ? 'Copied' : 'Copy Description'}</span>
              </button>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-4 rounded-lg border border-border/50 max-h-60 overflow-y-auto">
              {data.description}
            </p>
          </div>

          {/* Channel Keywords & Tags */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span>Channel Keywords & Tags ({data.keywords.length})</span>
              </h3>
              {data.keywords.length > 0 && (
                <button
                  onClick={() => handleCopyText(data.keywords.join(', '), 'keywords')}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedType === 'keywords' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'keywords' ? 'Copied' : 'Copy All Keywords'}</span>
                </button>
              )}
            </div>

            {data.keywords.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-border">
                No channel keywords specified by creator.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.keywords.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Topic Categories (Wikipedia Classification) */}
          {data.topicCategories && data.topicCategories.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Channel Niche & Topics (Wikipedia Categorized)</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.topicCategories.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Links List */}
          {data.socialLinks && data.socialLinks.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-500" />
                <span>Extracted Links & Socials ({data.socialLinks.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {data.socialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 transition-colors text-xs text-foreground group"
                  >
                    <span className="font-semibold text-primary capitalize">{link.domain}</span>
                    <span className="text-muted-foreground truncate max-w-[180px] font-mono text-[11px]">{link.url}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEO FAQ Section */}
      <FaqSection
        title="Frequently Asked Questions about YouTube Channel Analysis"
        faqs={[
          {
            question: "How do I extract YouTube channel creation time and age?",
            answer: "Simply enter the channel handle (e.g. @MrBeast) or link. Our analyzer calculates the exact creation date, channel age in years and months, primary language, country, and average video views."
          },
          {
            question: "What does the Active Status Light mean?",
            answer: "The Green Active light indicates that the creator has uploaded a video recently (within the last 45 days). A Red light indicates the channel has been inactive for a longer period."
          },
          {
            question: "How is the Channel Success Rate calculated?",
            answer: "Success rate evaluates channel subscriber count, total views, upload frequency, and average views per video into an algorithmic percentage score."
          }
        ]}
      />
    </div>
  );
}

