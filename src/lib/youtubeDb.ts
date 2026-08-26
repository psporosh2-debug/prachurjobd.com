import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { ChannelAnalysisData, VideoAnalysisData } from '@/types';

export function isSupabaseReady(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('placeholder'));
}

// Local Storage Fallback Keys
const LOCAL_CHANNELS_KEY = 'prachurjo_yt_channels_db_cache_v1';
const LOCAL_VIDEOS_KEY = 'prachurjo_yt_videos_db_cache_v1';
const LOCAL_TITLES_KEY = 'prachurjo_yt_titles_db_cache_v1';
const LOCAL_DESCRIPTIONS_KEY = 'prachurjo_yt_descriptions_db_cache_v1';

// In-Memory Fast Cache
const memChannelCache = new Map<string, ChannelAnalysisData>();
const memVideoCache = new Map<string, VideoAnalysisData>();

// Helper to get local storage record
function getLocalRecords<T>(key: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Helper to set local storage record
function saveLocalRecord<T>(key: string, recordId: string, data: T): void {
  try {
    const current = getLocalRecords<T>(key);
    current[recordId] = data;
    // Cap to 150 items to avoid localStorage limits
    const keys = Object.keys(current);
    if (keys.length > 150) {
      delete current[keys[0]];
    }
    localStorage.setItem(key, JSON.stringify(current));
  } catch (err) {
    console.warn(`Local storage save error (${key}):`, err);
  }
}

// ─────────────────────────────────────────────────────────────
// 1. YouTube Channels Storage & Retrieval
// ─────────────────────────────────────────────────────────────

export async function saveChannelToDb(data: ChannelAnalysisData): Promise<void> {
  if (!data || !data.id) return;

  const normalizedChannel: ChannelAnalysisData = {
    ...data,
    fromCache: true,
    cachedAt: new Date().toISOString()
  };

  // 1. Save to In-Memory & LocalStorage immediately
  memChannelCache.set(data.id.toLowerCase(), normalizedChannel);
  if (data.handle) memChannelCache.set(data.handle.toLowerCase(), normalizedChannel);
  if (data.customUrl) memChannelCache.set(data.customUrl.toLowerCase(), normalizedChannel);
  saveLocalRecord(LOCAL_CHANNELS_KEY, data.id, normalizedChannel);

  // 2. Upsert to Supabase if connected
  if (isSupabaseReady()) {
    try {
      const payload = {
        channel_id: data.id,
        title: data.title || 'YouTube Channel',
        handle: data.handle || null,
        custom_url: data.customUrl || null,
        direct_url: data.directUrl || null,
        description: data.description || null,
        published_at: data.publishedAt || null,
        account_age: data.accountAge || null,
        country: data.country || 'Global',
        default_language: data.defaultLanguage || 'Auto / English',
        banner_url: data.bannerUrl || null,
        logo_url: data.logoUrl || null,
        subscribers_count: Number(data.subscribersCount) || 0,
        video_count: Number(data.videoCount) || 0,
        view_count: Number(data.viewCount) || 0,
        avg_views_per_video: Number(data.avgViewsPerVideo) || 0,
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        social_links: Array.isArray(data.socialLinks) ? data.socialLinks : [],
        topic_categories: Array.isArray(data.topicCategories) ? data.topicCategories : [],
        top_videos: Array.isArray(data.topVideos) ? data.topVideos : [],
        success_rate: Number(data.successRate) || 75,
        is_active: Boolean(data.isActive),
        last_activity_date: data.lastActivityDate || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('yt_channels')
        .upsert(payload, { onConflict: 'channel_id' });

      if (error) {
        // Table might not exist yet; gracefully handled
        console.info('Supabase yt_channels table notice:', error.message);
      }
    } catch (dbErr) {
      console.info('Supabase channel upsert skipped:', dbErr);
    }
  }
}

export async function getChannelFromDb(identifier: string): Promise<ChannelAnalysisData | null> {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return null;

  // 1. Check in-memory cache
  if (memChannelCache.has(clean)) {
    return memChannelCache.get(clean) || null;
  }

  // 2. Check LocalStorage cache
  const localMap = getLocalRecords<ChannelAnalysisData>(LOCAL_CHANNELS_KEY);
  for (const key of Object.keys(localMap)) {
    const item = localMap[key];
    if (
      item.id?.toLowerCase() === clean ||
      item.handle?.toLowerCase() === clean ||
      item.customUrl?.toLowerCase() === clean ||
      clean.includes(item.id?.toLowerCase() || '') ||
      (item.title && item.title.toLowerCase() === clean)
    ) {
      memChannelCache.set(clean, item);
      return item;
    }
  }

  // 3. Check Supabase Database
  if (isSupabaseReady()) {
    try {
      let query = supabase.from('yt_channels').select('*');

      if (clean.startsWith('uc') || clean.length === 24) {
        query = query.eq('channel_id', identifier.trim());
      } else if (clean.startsWith('@')) {
        query = query.eq('handle', identifier.trim());
      } else {
        query = query.or(`channel_id.eq.${identifier.trim()},handle.eq.${identifier.trim()},custom_url.ilike.%${clean}%,title.ilike.%${clean}%`);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (data && !error) {
        const parsed: ChannelAnalysisData = {
          id: data.channel_id,
          title: data.title || 'YouTube Channel',
          handle: data.handle || `@${data.channel_id}`,
          description: data.description || '',
          customUrl: data.custom_url || '',
          directUrl: data.direct_url || `https://www.youtube.com/channel/${data.channel_id}`,
          publishedAt: data.published_at || '',
          accountAge: data.account_age || '',
          country: data.country || 'Global',
          defaultLanguage: data.default_language || 'Auto / English',
          bannerUrl: data.banner_url || '',
          logoUrl: data.logo_url || '',
          subscribersCount: Number(data.subscribers_count) || 0,
          videoCount: Number(data.video_count) || 0,
          viewCount: Number(data.view_count) || 0,
          avgViewsPerVideo: Number(data.avg_views_per_video) || 0,
          keywords: Array.isArray(data.keywords) ? data.keywords : [],
          socialLinks: Array.isArray(data.social_links) ? data.social_links : [],
          topicCategories: Array.isArray(data.topic_categories) ? data.topic_categories : [],
          topVideos: Array.isArray(data.top_videos) ? data.top_videos : [],
          madeForKids: false,
          privacyStatus: 'public',
          successRate: Number(data.success_rate) || 75,
          isActive: Boolean(data.is_active),
          lastActivityDate: data.last_activity_date || undefined,
          fromCache: true,
          cachedAt: data.updated_at || new Date().toISOString()
        };

        memChannelCache.set(clean, parsed);
        saveLocalRecord(LOCAL_CHANNELS_KEY, parsed.id, parsed);
        return parsed;
      }
    } catch {
      // Supabase query skip fallback
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// 2. YouTube Videos Storage & Retrieval
// ─────────────────────────────────────────────────────────────

export async function saveVideoToDb(data: VideoAnalysisData): Promise<void> {
  if (!data || !data.id) return;

  const normalizedVideo: VideoAnalysisData = {
    ...data,
    fromCache: true,
    cachedAt: new Date().toISOString()
  };

  // 1. Save to Memory & LocalStorage
  memVideoCache.set(data.id.toLowerCase(), normalizedVideo);
  saveLocalRecord(LOCAL_VIDEOS_KEY, data.id, normalizedVideo);

  // 2. Upsert to Supabase
  if (isSupabaseReady()) {
    try {
      const payload = {
        video_id: data.id,
        channel_id: data.channelId || null,
        channel_title: data.channelTitle || null,
        title: data.title || 'YouTube Video',
        description: data.description || null,
        category_id: data.categoryId || null,
        category_name: data.categoryName || 'Entertainment',
        published_at: data.publishedAt || null,
        thumbnail_url: data.thumbnailUrl || null,
        thumbnails: Array.isArray(data.thumbnails) ? data.thumbnails : [],
        duration: data.duration || null,
        duration_iso: data.durationISO || null,
        view_count: Number(data.viewCount) || 0,
        like_count: Number(data.likeCount) || 0,
        comment_count: Number(data.commentCount) || 0,
        engagement_rate: Number(data.engagementRate) || 0,
        tags: Array.isArray(data.tags) ? data.tags : [],
        hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        extracted_links: Array.isArray(data.extractedLinks) ? data.extractedLinks : [],
        topic_categories: Array.isArray(data.topicCategories) ? data.topicCategories : [],
        embeddable: Boolean(data.embeddable),
        privacy_status: data.privacyStatus || 'public',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('yt_videos')
        .upsert(payload, { onConflict: 'video_id' });

      if (error) {
        console.info('Supabase yt_videos table notice:', error.message);
      }
    } catch (dbErr) {
      console.info('Supabase video upsert skipped:', dbErr);
    }
  }
}

export async function getVideoFromDb(videoId: string): Promise<VideoAnalysisData | null> {
  const cleanId = videoId.trim();
  if (!cleanId) return null;

  // 1. Memory Cache
  if (memVideoCache.has(cleanId.toLowerCase())) {
    return memVideoCache.get(cleanId.toLowerCase()) || null;
  }

  // 2. LocalStorage Cache
  const localMap = getLocalRecords<VideoAnalysisData>(LOCAL_VIDEOS_KEY);
  if (localMap[cleanId]) {
    const item = localMap[cleanId];
    memVideoCache.set(cleanId.toLowerCase(), item);
    return item;
  }

  // 3. Supabase Query
  if (isSupabaseReady()) {
    try {
      const { data, error } = await supabase
        .from('yt_videos')
        .select('*')
        .eq('video_id', cleanId)
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const parsed: VideoAnalysisData = {
          id: data.video_id,
          title: data.title || 'YouTube Video',
          description: data.description || '',
          thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`,
          thumbnails: Array.isArray(data.thumbnails) && data.thumbnails.length > 0 ? data.thumbnails : [
            { quality: 'MaxRes HD (1080p)', url: `https://i.ytimg.com/vi/${data.video_id}/maxresdefault.jpg`, width: '1920', height: '1080' },
            { quality: 'High Quality (720p)', url: `https://i.ytimg.com/vi/${data.video_id}/hqdefault.jpg`, width: '480', height: '360' }
          ],
          publishedAt: data.published_at || '',
          viewCount: Number(data.view_count) || 0,
          likeCount: Number(data.like_count) || 0,
          commentCount: Number(data.comment_count) || 0,
          engagementRate: Number(data.engagement_rate) || 0,
          channelId: data.channel_id || '',
          channelTitle: data.channel_title || 'YouTube Channel',
          categoryId: data.category_id || '24',
          categoryName: data.category_name || 'Entertainment',
          duration: data.duration || '0:00',
          durationISO: data.duration_iso || 'PT0M0S',
          definition: 'hd',
          dimension: '2d',
          caption: 'false',
          licensedContent: true,
          defaultAudioLanguage: 'en',
          defaultLanguage: 'en',
          tags: Array.isArray(data.tags) ? data.tags : [],
          hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
          keywords: Array.isArray(data.keywords) ? data.keywords : [],
          extractedLinks: Array.isArray(data.extracted_links) ? data.extracted_links : [],
          topicCategories: Array.isArray(data.topic_categories) ? data.topic_categories : [],
          embeddable: Boolean(data.embeddable),
          privacyStatus: data.privacy_status || 'public',
          fromCache: true,
          cachedAt: data.updated_at || new Date().toISOString()
        };

        memVideoCache.set(cleanId.toLowerCase(), parsed);
        saveLocalRecord(LOCAL_VIDEOS_KEY, parsed.id, parsed);
        return parsed;
      }
    } catch {
      // Fallback
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// 3. YouTube Title & Description Generations Storage
// ─────────────────────────────────────────────────────────────

export interface StoredGeneratedTitlesRecord {
  id: string;
  topic: string;
  category: string;
  tone: string;
  language: string;
  titles: Array<{
    title: string;
    score: number;
    hook: string;
    charCount: number;
    format: string;
    ctrRating?: string;
  }>;
  created_at: string;
}

export async function saveGeneratedTitlesToDb(
  topic: string,
  category: string,
  tone: string,
  language: string,
  titles: any[]
): Promise<void> {
  if (!topic || !titles || titles.length === 0) return;

  const recordId = `title_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const record: StoredGeneratedTitlesRecord = {
    id: recordId,
    topic,
    category: category || 'General',
    tone: tone || 'High CTR',
    language: language || 'English',
    titles,
    created_at: new Date().toISOString()
  };

  saveLocalRecord(LOCAL_TITLES_KEY, recordId, record);

  if (isSupabaseReady()) {
    try {
      await supabase.from('yt_generated_titles').insert({
        id: recordId,
        topic,
        category: category || 'General',
        tone: tone || 'High CTR',
        language: language || 'English',
        titles_data: titles,
        created_at: record.created_at
      });
    } catch (err) {
      console.info('Supabase title insert skipped:', err);
    }
  }
}

export async function getRecentGeneratedTitles(category?: string): Promise<StoredGeneratedTitlesRecord[]> {
  const localMap = getLocalRecords<StoredGeneratedTitlesRecord>(LOCAL_TITLES_KEY);
  let localList = Object.values(localMap).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (category && category !== 'All' && category !== 'General / All') {
    localList = localList.filter(item => item.category.toLowerCase() === category.toLowerCase());
  }

  if (isSupabaseReady()) {
    try {
      let query = supabase.from('yt_generated_titles').select('*').order('created_at', { ascending: false }).limit(20);
      if (category && category !== 'All' && category !== 'General / All') {
        query = query.eq('category', category);
      }
      const { data, error } = await query;
      if (data && !error && data.length > 0) {
        return data.map(d => ({
          id: d.id,
          topic: d.topic,
          category: d.category,
          tone: d.tone,
          language: d.language,
          titles: Array.isArray(d.titles_data) ? d.titles_data : [],
          created_at: d.created_at
        }));
      }
    } catch {
      // Fallback
    }
  }

  return localList.slice(0, 20);
}

export async function saveGeneratedDescriptionToDb(
  topic: string,
  category: string,
  data: any
): Promise<void> {
  if (!topic || !data) return;

  const recordId = `desc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const record = {
    id: recordId,
    topic,
    category: category || 'General',
    description_data: data,
    created_at: new Date().toISOString()
  };

  saveLocalRecord(LOCAL_DESCRIPTIONS_KEY, recordId, record);

  if (isSupabaseReady()) {
    try {
      await supabase.from('yt_generated_descriptions').insert({
        id: recordId,
        topic,
        category: category || 'General',
        description_data: data,
        created_at: record.created_at
      });
    } catch (err) {
      console.info('Supabase description insert skipped:', err);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 4. SmartBot Brain Knowledge Aggregation Engine
// ─────────────────────────────────────────────────────────────

export interface DbKnowledgeSummary {
  totalChannels: number;
  totalVideos: number;
  totalTitles: number;
  topCategories: Array<{ name: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
  topKeywords: Array<{ keyword: string; count: number }>;
  recentChannels: Array<{ title: string; handle: string; subscribers: number }>;
  recentVideos: Array<{ title: string; views: number; channel: string }>;
}

export async function getDatabaseKnowledgeSummary(): Promise<DbKnowledgeSummary> {
  const localChannels = Object.values(getLocalRecords<ChannelAnalysisData>(LOCAL_CHANNELS_KEY));
  const localVideos = Object.values(getLocalRecords<VideoAnalysisData>(LOCAL_VIDEOS_KEY));
  const localTitles = Object.values(getLocalRecords<StoredGeneratedTitlesRecord>(LOCAL_TITLES_KEY));

  // Tag Frequency Aggregator
  const tagCounts: Record<string, number> = {};
  const keywordCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  localVideos.forEach(v => {
    if (Array.isArray(v.tags)) {
      v.tags.forEach(t => {
        const clean = t.trim().toLowerCase();
        if (clean && clean.length > 1) tagCounts[clean] = (tagCounts[clean] || 0) + 1;
      });
    }
    if (v.categoryName) {
      categoryCounts[v.categoryName] = (categoryCounts[v.categoryName] || 0) + 1;
    }
  });

  localChannels.forEach(c => {
    if (Array.isArray(c.keywords)) {
      c.keywords.forEach(k => {
        const clean = k.trim().toLowerCase();
        if (clean && clean.length > 1) keywordCounts[clean] = (keywordCounts[clean] || 0) + 1;
      });
    }
    if (Array.isArray(c.topicCategories)) {
      c.topicCategories.forEach(cat => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
    }
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag, count]) => ({ tag, count }));

  const sortedKeywords = Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, count]) => ({ keyword, count }));

  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  return {
    totalChannels: localChannels.length,
    totalVideos: localVideos.length,
    totalTitles: localTitles.length,
    topCategories: sortedCategories,
    topTags: sortedTags,
    topKeywords: sortedKeywords,
    recentChannels: localChannels.slice(-5).map(c => ({
      title: c.title,
      handle: c.handle,
      subscribers: c.subscribersCount
    })),
    recentVideos: localVideos.slice(-5).map(v => ({
      title: v.title,
      views: v.viewCount,
      channel: v.channelTitle
    }))
  };
}

/**
 * Natural language search on the stored database for SmartBot knowledge queries
 */
export async function queryKnowledgeForBot(queryText: string): Promise<{
  found: boolean;
  summary: string;
  channels?: any[];
  videos?: any[];
  topTags?: string[];
  suggestedTitles?: string[];
}> {
  const clean = queryText.toLowerCase().trim();
  const summary = await getDatabaseKnowledgeSummary();

  const localChannels = Object.values(getLocalRecords<ChannelAnalysisData>(LOCAL_CHANNELS_KEY));
  const localVideos = Object.values(getLocalRecords<VideoAnalysisData>(LOCAL_VIDEOS_KEY));
  const localTitles = Object.values(getLocalRecords<StoredGeneratedTitlesRecord>(LOCAL_TITLES_KEY));

  // 1. Check if user is asking for channel info
  const matchedChannel = localChannels.find(
    c => c.title.toLowerCase().includes(clean) || (c.handle && c.handle.toLowerCase().includes(clean))
  );

  if (matchedChannel) {
    return {
      found: true,
      summary: `📺 **Channel Database Match: ${matchedChannel.title}**\n- **Handle**: ${matchedChannel.handle}\n- **Subscribers**: ${matchedChannel.subscribersCount.toLocaleString()}\n- **Total Views**: ${matchedChannel.viewCount.toLocaleString()}\n- **Account Age**: ${matchedChannel.accountAge}\n- **Top Keywords**: ${matchedChannel.keywords?.slice(0, 6).join(', ') || 'N/A'}\n- **Success Score**: ${matchedChannel.successRate}%`,
      channels: [matchedChannel]
    };
  }

  // 2. Check if user is asking for trending tags / keywords in database
  if (clean.includes('tag') || clean.includes('keyword') || clean.includes('popular') || clean.includes('trend')) {
    const tagsList = summary.topTags.map(t => `#${t.tag} (${t.count}x)`).join(', ');
    const keywordsList = summary.topKeywords.map(k => `${k.keyword}`).join(', ');

    return {
      found: true,
      summary: `🧠 **Prachurjo YouTube Knowledge Brain Insights:**\n\n🔥 **Top Stored Tags**: ${tagsList || 'No tags cached yet'}\n\n🔑 **Top Channel Keywords**: ${keywordsList || 'No keywords cached yet'}\n\n📊 **Database Corpus**: ${summary.totalChannels} Channels, ${summary.totalVideos} Analyzed Videos, ${summary.totalTitles} Generated Titles.`,
      topTags: summary.topTags.map(t => t.tag)
    };
  }

  // 3. Check for Category Match
  const matchedCategory = summary.topCategories.find(c => clean.includes(c.name.toLowerCase()));
  if (matchedCategory) {
    const categoryVideos = localVideos.filter(
      v => v.categoryName?.toLowerCase() === matchedCategory.name.toLowerCase()
    );
    const categoryTags = categoryVideos.flatMap(v => v.tags || []).slice(0, 10);

    return {
      found: true,
      summary: `🎯 **Category Knowledge: ${matchedCategory.name}**\n- Analyzed Videos: ${categoryVideos.length}\n- Typical Tags in Database: ${categoryTags.length > 0 ? categoryTags.join(', ') : 'Tech, Gaming, Tutorial'}\n- Average Engagement: High (Top video views: ${categoryVideos[0]?.viewCount.toLocaleString() || 'N/A'})`
    };
  }

  // 4. Check for Title Ideas
  const matchedTitles = localTitles.filter(t => t.topic.toLowerCase().includes(clean) || clean.includes(t.topic.toLowerCase()));
  if (matchedTitles.length > 0) {
    const titlesList = matchedTitles[0].titles.slice(0, 4).map(t => `• ${t.title}`).join('\n');
    return {
      found: true,
      summary: `💡 **Saved Viral Titles for "${matchedTitles[0].topic}":**\n${titlesList}`,
      suggestedTitles: matchedTitles[0].titles.map(t => t.title)
    };
  }

  // 5. Default Knowledge Overview
  return {
    found: summary.totalChannels > 0 || summary.totalVideos > 0,
    summary: `🧠 **YouTube Database Brain:**\n- **Stored Channels**: ${summary.totalChannels}\n- **Stored Videos**: ${summary.totalVideos}\n- **Cached Titles**: ${summary.totalTitles}\n- **Top Categories**: ${summary.topCategories.map(c => c.name).join(', ') || 'Tech, Gaming, Vlogs'}`
  };
}

// ─────────────────────────────────────────────────────────────
// 5. Supabase SQL Schema Generator
// ─────────────────────────────────────────────────────────────

export function getSupabaseSqlSchema(): string {
  return `-- ════════════════════════════════════════════════════════════════
-- PRACHURJO YOUTUBE KNOWLEDGE BASE & CACHING TABLES (SUPABASE SQL)
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ════════════════════════════════════════════════════════════════

-- 1. YouTube Channels Table
CREATE TABLE IF NOT EXISTS yt_channels (
    channel_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    handle TEXT,
    custom_url TEXT,
    direct_url TEXT,
    description TEXT,
    published_at TEXT,
    account_age TEXT,
    country TEXT DEFAULT 'Global',
    default_language TEXT DEFAULT 'Auto / English',
    banner_url TEXT,
    logo_url TEXT,
    subscribers_count BIGINT DEFAULT 0,
    video_count BIGINT DEFAULT 0,
    view_count BIGINT DEFAULT 0,
    avg_views_per_video BIGINT DEFAULT 0,
    keywords JSONB DEFAULT '[]'::jsonb,
    social_links JSONB DEFAULT '[]'::jsonb,
    topic_categories JSONB DEFAULT '[]'::jsonb,
    top_videos JSONB DEFAULT '[]'::jsonb,
    success_rate NUMERIC DEFAULT 75,
    is_active BOOLEAN DEFAULT true,
    last_activity_date TEXT,
    query_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. YouTube Videos Table
CREATE TABLE IF NOT EXISTS yt_videos (
    video_id TEXT PRIMARY KEY,
    channel_id TEXT,
    channel_title TEXT,
    title TEXT NOT NULL,
    description TEXT,
    category_id TEXT,
    category_name TEXT DEFAULT 'Entertainment',
    published_at TEXT,
    thumbnail_url TEXT,
    thumbnails JSONB DEFAULT '[]'::jsonb,
    duration TEXT,
    duration_iso TEXT,
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    engagement_rate NUMERIC DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    hashtags JSONB DEFAULT '[]'::jsonb,
    keywords JSONB DEFAULT '[]'::jsonb,
    extracted_links JSONB DEFAULT '[]'::jsonb,
    topic_categories JSONB DEFAULT '[]'::jsonb,
    embeddable BOOLEAN DEFAULT true,
    privacy_status TEXT DEFAULT 'public',
    query_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. YouTube Generated Titles Table
CREATE TABLE IF NOT EXISTS yt_generated_titles (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    tone TEXT DEFAULT 'High CTR',
    language TEXT DEFAULT 'English',
    titles_data JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. YouTube Generated Descriptions Table
CREATE TABLE IF NOT EXISTS yt_generated_descriptions (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    description_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) & Public Read/Write Access
ALTER TABLE yt_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_generated_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_generated_descriptions ENABLE ROW LEVEL SECURITY;

-- Allow Public Read & Insert/Upsert
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public select yt_channels" ON yt_channels;
    CREATE POLICY "Public select yt_channels" ON yt_channels FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public insert yt_channels" ON yt_channels;
    CREATE POLICY "Public insert yt_channels" ON yt_channels FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public select yt_videos" ON yt_videos;
    CREATE POLICY "Public select yt_videos" ON yt_videos FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public insert yt_videos" ON yt_videos;
    CREATE POLICY "Public insert yt_videos" ON yt_videos FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public select yt_generated_titles" ON yt_generated_titles;
    CREATE POLICY "Public select yt_generated_titles" ON yt_generated_titles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public select yt_generated_descriptions" ON yt_generated_descriptions;
    CREATE POLICY "Public select yt_generated_descriptions" ON yt_generated_descriptions FOR ALL USING (true) WITH CHECK (true);
END $$;
`;
}
