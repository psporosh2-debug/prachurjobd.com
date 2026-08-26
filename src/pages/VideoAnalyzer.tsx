import React, { useState } from 'react';
import {
  Search, Download, ExternalLink, Eye, ThumbsUp, MessageSquare, Calendar,
  Tag, Link2, AlertCircle, Sparkles, Youtube, Copy, Check, Clock, Film,
  Globe, Shield, Hash, Layers, Share2, Percent, Database, RefreshCw, Zap
} from 'lucide-react';
import { analyzeYouTubeVideo } from '@/api/youtubeApi';
import { VideoAnalysisData } from '@/types';
import { FaqSection } from '@/components/seo/FaqSection';
import { AiOptimizerCard } from '@/components/AiOptimizerCard';
import { WorkflowScanner } from '@/components/WorkflowScanner';
import { useHistory } from '@/hooks/useHistory';
import { sound } from '@/lib/sound';

export default function VideoAnalyzer() {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VideoAnalysisData | null>(null);
  const { addHistoryItem } = useHistory();

  // Copy feedback state
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleAnalyze = async (e?: React.FormEvent, forceFresh: boolean = false) => {
    if (e) e.preventDefault();
    if (!videoUrl.trim()) return;

    sound.scan();
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeYouTubeVideo(videoUrl, forceFresh);
      setData(result);
      sound.success();
      
      addHistoryItem({
        type: 'video_analysis',
        title: `Analyzed Video: ${result.title}`,
        description: `Views: ${result.viewCount.toLocaleString()}`,
        url: videoUrl
      });
    } catch (err: any) {
      sound.error();
      setError(err?.message || 'Failed to analyze video. Please verify the URL and try again.');
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

  const handleDownloadThumbnail = async (imageUrl: string, qualityName: string) => {
    sound.download();
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `YouTube_Thumbnail_${data?.id || 'video'}_${qualityName.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  const loadExample = (url: string) => {
    sound.click();
    setVideoUrl(url);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center flex flex-col gap-2">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold w-fit mx-auto border border-primary/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>YouTube Video Comprehensive Inspection</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          YouTube Video Analyzer
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
          Extract all video metadata: Tags, #Hashtags, SEO Keywords, Category, Duration, Engagement %, Captions, Wikipedia Topics, and HD Thumbnails.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
        <form onSubmit={handleAnalyze} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste YouTube Video URL or ID (e.g. https://www.youtube.com/watch?v=...)"
              className="w-full pl-11 pr-4 py-3 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !videoUrl.trim()}
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Analyzing...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Analyze Video</span>
              </>
            )}
          </button>
        </form>

        {/* Examples */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span className="font-medium">Try sample video:</span>
          <button
            onClick={() => loadExample('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
            className="px-2 py-1 rounded bg-muted/50 hover:bg-muted text-foreground transition-colors font-mono"
          >
            dQw4w9WgXcQ
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <WorkflowScanner isLoading={loading} targetName={videoUrl} type="video" />

      {/* Results Section */}
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

          {/* Main Card: Thumbnail + Info */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row gap-6">
            {/* Left: Thumbnail Preview & Actions */}
            <div className="w-full md:w-80 flex flex-col gap-3 shrink-0">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border border-border shadow-sm">
                <img
                  src={data.thumbnailUrl}
                  alt={data.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {data.duration}
                </span>
              </div>

              {/* HD Download Button */}
              <button
                onClick={() => handleDownloadThumbnail(data.thumbnails[0].url, 'HD_MaxRes')}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download HD Thumbnail (1080p)</span>
              </button>

              <a
                href={`https://www.youtube.com/watch?v=${data.id}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Youtube className="w-4 h-4" />
                <span>Watch on YouTube</span>
              </a>
            </div>

            {/* Right: Primary Info */}
            <div className="flex-1 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-foreground leading-snug">{data.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">{data.channelTitle}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{new Date(data.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <span>•</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-medium text-[11px]">
                    {data.categoryName}
                  </span>
                </div>
              </div>

              {/* Primary Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-muted/30 rounded-lg border border-border text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                    <Eye className="w-3.5 h-3.5 text-amber-500" />
                    <span>Views</span>
                  </div>
                  <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                    {data.viewCount.toLocaleString()}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Likes</span>
                  </div>
                  <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                    {data.likeCount.toLocaleString()}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Comments</span>
                  </div>
                  <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                    {data.commentCount.toLocaleString()}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                    <Percent className="w-3.5 h-3.5 text-rose-500" />
                    <span>Engagement</span>
                  </div>
                  <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                    {data.engagementRate}%
                  </span>
                </div>
              </div>

              {/* Resolution options */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <span className="text-xs font-bold text-foreground">Thumbnail Resolutions:</span>
                <div className="grid grid-cols-2 gap-2">
                  {data.thumbnails.map((thumb) => (
                    <button
                      key={thumb.quality}
                      onClick={() => handleDownloadThumbnail(thumb.url, thumb.quality)}
                      className="p-2 border border-border rounded-md bg-background hover:bg-muted text-[11px] text-foreground flex items-center justify-between transition-colors"
                    >
                      <span className="font-medium truncate">{thumb.quality}</span>
                      <Download className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Technical Overview Card */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
            <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <Film className="w-4 h-4 text-primary" />
              <span>Technical & Quality Parameters</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Video Duration</span>
                <strong className="text-foreground font-mono">{data.duration} ({data.durationISO})</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Definition</span>
                <strong className="text-foreground">{data.definition} Quality</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Dimension</span>
                <strong className="text-foreground uppercase">{data.dimension}</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Captions</span>
                <strong className="text-foreground">{data.caption}</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">License</span>
                <strong className="text-foreground">{data.licensedContent ? 'Licensed' : 'Standard'}</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Audio Language</span>
                <strong className="text-foreground">{data.defaultAudioLanguage}</strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Embeddable</span>
                <strong className={data.embeddable ? 'text-emerald-500' : 'text-rose-500'}>
                  {data.embeddable ? 'Yes (Allowed)' : 'No (Blocked)'}
                </strong>
              </div>

              <div className="p-3 bg-muted/20 border border-border rounded-lg">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Privacy Status</span>
                <strong className="text-foreground uppercase">{data.privacyStatus}</strong>
              </div>
            </div>
          </div>

          {/* AI Optimizer Card (Gemini Powered) */}
          <AiOptimizerCard
            type="video"
            initialData={{
              title: data.title,
              description: data.description,
              tags: data.tags,
              keywords: data.keywords,
              category: data.categoryName,
              stats: {
                views: data.viewCount,
                likes: data.likeCount,
                comments: data.commentCount,
                engagement: data.engagementRate,
              },
            }}
          />

          {/* Video Tags Section */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span>Video Tags ({data.tags.length})</span>
              </h3>
              {data.tags.length > 0 && (
                <button
                  onClick={() => handleCopyText(data.tags.join(', '), 'tags')}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedType === 'tags' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'tags' ? 'Copied' : 'Copy All Tags'}</span>
                </button>
              )}
            </div>

            {data.tags.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-border">
                No tags specified for this video by the creator.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-muted text-foreground border border-border text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hashtags Section */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" />
                <span>Extracted #Hashtags ({data.hashtags.length})</span>
              </h3>
              {data.hashtags.length > 0 && (
                <button
                  onClick={() => handleCopyText(data.hashtags.join(' '), 'hashtags')}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedType === 'hashtags' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'hashtags' ? 'Copied' : 'Copy Hashtags'}</span>
                </button>
              )}
            </div>

            {data.hashtags.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-border">
                No hashtags found in the video description.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.hashtags.map((ht, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-xs font-semibold"
                  >
                    {ht}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Extracted SEO Keywords */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Generated SEO Keywords ({data.keywords.length})</span>
              </h3>
              {data.keywords.length > 0 && (
                <button
                  onClick={() => handleCopyText(data.keywords.join(', '), 'keywords')}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedType === 'keywords' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'keywords' ? 'Copied' : 'Copy Keywords'}</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {data.keywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Links Used in Description List */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <span>Links Used in Description ({data.extractedLinks.length})</span>
              </h3>
            </div>

            {data.extractedLinks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-border">
                No external links detected in this video's description.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {data.extractedLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/50 transition-colors text-xs text-foreground group"
                  >
                    <span className="font-semibold text-emerald-500 capitalize">{link.domain}</span>
                    <span className="text-muted-foreground truncate max-w-[200px] font-mono text-[11px]">{link.url}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Topic Categories (Wikipedia Topics) */}
          {data.topicCategories && data.topicCategories.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
              <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Topic Categories (Wikipedia Classified)</span>
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

          {/* Full Description */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Full Video Description</h3>
              <button
                onClick={() => handleCopyText(data.description, 'description')}
                className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground text-xs rounded font-medium flex items-center gap-1.5 transition-colors"
              >
                {copiedType === 'description' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'description' ? 'Copied' : 'Copy Description'}</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-4 rounded-lg border border-border/50 max-h-64 overflow-y-auto font-sans">
              {data.description}
            </p>
          </div>
        </div>
      )}

      {/* FAQ */}
      <FaqSection
        title="Frequently Asked Questions about YouTube Video Analysis"
        faqs={[
          {
            question: "How do I extract tags and hashtags from a YouTube video?",
            answer: "Enter any YouTube video link into the search bar. The tool extracts all tags, description #hashtags, SEO keywords, and metadata with 1-click copy buttons."
          },
          {
            question: "Can I download 1080p high resolution thumbnails?",
            answer: "Yes! Click 'Download HD Thumbnail' to download maximum 1080p resolution images directly to your device."
          },
          {
            question: "What is Engagement Rate?",
            answer: "Engagement rate is calculated by dividing total video interactions (likes + comments) by total view count to measure audience engagement intensity."
          }
        ]}
      />
    </div>
  );
}

