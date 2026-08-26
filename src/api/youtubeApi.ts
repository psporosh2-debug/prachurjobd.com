import { API_CONFIG } from './apiKeys';
import { ChannelAnalysisData, VideoAnalysisData, ThumbnailItem } from '@/types';
import { getChannelFromDb, saveChannelToDb, getVideoFromDb, saveVideoToDb } from '@/lib/youtubeDb';

// Helper to extract clean URL host / domain name
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'link';
  }
}

// Extract URLs from text
export function extractUrlsFromText(text: string): { title?: string; url: string; domain: string }[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s<>"'()]+)/gi;
  const matches = text.match(urlRegex) || [];
  
  const uniqueUrls = Array.from(new Set(matches)).map(url => {
    // Clean trailing dots, commas, parens
    const cleanUrl = url.replace(/[.,;)]+$/, '');
    return {
      url: cleanUrl,
      domain: extractDomain(cleanUrl)
    };
  });

  return uniqueUrls;
}

// Extract Channel Identifier (ID, handle, name, or video)
export function parseChannelIdentifier(input: string): { type: 'handle' | 'id' | 'query' | 'video'; value: string } {
  let trimmed = input.trim();
  if (!trimmed) return { type: 'query', value: '' };

  // Remove trailing slashes
  trimmed = trimmed.replace(/\/+$/, '');

  // 1. Check for @handle anywhere in input or URL
  // e.g. https://www.youtube.com/@username, https://youtube.com/@username/videos, @username
  const handleMatch = trimmed.match(/@([a-zA-Z0-9_.-]+)/);
  if (handleMatch && handleMatch[1]) {
    return { type: 'handle', value: `@${handleMatch[1]}` };
  }

  // 2. Check for channel ID in string or URL
  // e.g. https://www.youtube.com/channel/UC... or UC...
  const channelIdMatch = trimmed.match(/(UC[a-zA-Z0-9_-]{22})/);
  if (channelIdMatch && channelIdMatch[1]) {
    return { type: 'id', value: channelIdMatch[1] };
  }

  // 3. Handle URL forms (/c/, /user/, or generic path /customName)
  if (trimmed.includes('youtube.com/') || trimmed.includes('youtu.be/')) {
    try {
      const urlStr = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const url = new URL(urlStr);
      const pathname = url.pathname;

      // Handle /c/name or /user/name
      const cMatch = pathname.match(/\/(?:c|user)\/([a-zA-Z0-9_.-]+)/);
      if (cMatch && cMatch[1]) {
        return { type: 'query', value: cMatch[1] };
      }

      // Check if user pasted a video URL into channel analyzer
      const videoId = extractVideoId(trimmed);
      if (videoId) {
        return { type: 'video', value: videoId };
      }

      // Handle /customName (e.g. youtube.com/PewDiePie)
      const pathParts = pathname.split('/').filter(Boolean);
      if (pathParts.length > 0 && !['watch', 'playlist', 'results', 'feed'].includes(pathParts[0])) {
        return { type: 'handle', value: `@${pathParts[0]}` };
      }
    } catch {
      // Fallback
    }
  }

  // 4. Check if input is a raw video ID
  const rawVideoId = extractVideoId(trimmed);
  if (rawVideoId && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { type: 'video', value: rawVideoId };
  }

  // 5. Handle raw handle without @ or search query
  if (trimmed.startsWith('@')) {
    return { type: 'handle', value: trimmed };
  }

  return { type: 'query', value: trimmed };
}

// Parse Video ID from YouTube URL
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);

  return match && match[2].length === 11 ? match[2] : null;
}

// Helper to calculate channel account age
function calculateAccountAge(publishedAt: string): string {
  if (!publishedAt) return 'N/A';
  const joinedDate = new Date(publishedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - joinedDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);

  if (years > 0) {
    return `${years} Yr${years > 1 ? 's' : ''}${months > 0 ? ` ${months} Mo${months > 1 ? 's' : ''}` : ''}`;
  } else if (months > 0) {
    return `${months} Month${months > 1 ? 's' : ''}`;
  } else {
    return `${diffDays} Days`;
  }
}

// Analyze YouTube Channel
export async function analyzeYouTubeChannel(input: string, forceFresh: boolean = false): Promise<ChannelAnalysisData> {
  const parsed = parseChannelIdentifier(input);
  if (!parsed.value) {
    throw new Error('Please enter a valid YouTube channel URL, handle (@username), or channel ID.');
  }

  // 1. Check Supabase / Local Database Cache first to save API tokens
  if (!forceFresh) {
    try {
      const cached = await getChannelFromDb(parsed.value);
      if (cached) {
        return {
          ...cached,
          fromCache: true
        };
      }
    } catch {
      // Cache lookup failed, continue with live API fetch
    }
  }

  const apiKey = API_CONFIG.youtubeApiKey;
  if (!apiKey) {
    throw new Error('YouTube API Key is missing.');
  }

  let channelData: any = null;
  const partsQuery = 'snippet,statistics,brandingSettings,contentDetails,topicDetails,status';

  // 1. Fetch channel by ID, Video ID, Handle, or Search
  if (parsed.type === 'id') {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=${partsQuery}&id=${parsed.value}&key=${apiKey}`);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      channelData = data.items[0];
    }
  } else if (parsed.type === 'video') {
    // If user provided a video URL, resolve channel ID from the video metadata
    const videoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${parsed.value}&key=${apiKey}`);
    const videoData = await videoRes.json();
    if (videoData.items && videoData.items.length > 0) {
      const channelId = videoData.items[0].snippet?.channelId;
      if (channelId) {
        const detailRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=${partsQuery}&id=${channelId}&key=${apiKey}`);
        const detailData = await detailRes.json();
        if (detailData.items && detailData.items.length > 0) {
          channelData = detailData.items[0];
        }
      }
    }
  } else if (parsed.type === 'handle') {
    const handleNoAt = parsed.value.replace(/^@/, '');
    // Try forHandle parameter first
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=${partsQuery}&forHandle=${handleNoAt}&key=${apiKey}`);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      channelData = data.items[0];
    } else {
      // Fallback search with handle
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(parsed.value)}&maxResults=1&key=${apiKey}`);
      const searchData = await searchRes.json();
      if (searchData.items && searchData.items.length > 0) {
        const channelId = searchData.items[0].id.channelId || searchData.items[0].snippet?.channelId;
        if (channelId) {
          const detailRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=${partsQuery}&id=${channelId}&key=${apiKey}`);
          const detailData = await detailRes.json();
          if (detailData.items && detailData.items.length > 0) {
            channelData = detailData.items[0];
          }
        }
      }
    }
  } else {
    // Search query - First try forHandle in case user omitted @
    const handleNoAt = parsed.value.replace(/^@/, '');
    const handleRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=${partsQuery}&forHandle=${handleNoAt}&key=${apiKey}`);
    const handleData = await handleRes.json();
    if (handleData.items && handleData.items.length > 0) {
      channelData = handleData.items[0];
    } else {
      // Search query fallback
      const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(parsed.value)}&maxResults=1&key=${apiKey}`);
      const searchData = await searchRes.json();
      if (searchData.items && searchData.items.length > 0) {
        const channelId = searchData.items[0].id.channelId || searchData.items[0].snippet?.channelId;
        if (channelId) {
          const detailRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=${partsQuery}&id=${channelId}&key=${apiKey}`);
          const detailData = await detailRes.json();
          if (detailData.items && detailData.items.length > 0) {
            channelData = detailData.items[0];
          }
        }
      }
    }
  }

  if (!channelData) {
    throw new Error('Channel not found. Please check the handle or URL and try again.');
  }

  const snippet = channelData.snippet || {};
  const stats = channelData.statistics || {};
  const branding = channelData.brandingSettings || {};
  const contentDetails = channelData.contentDetails || {};
  const topicDetails = channelData.topicDetails || {};
  const status = channelData.status || {};

  const channelId = channelData.id;
  const customUrl = snippet.customUrl ? (snippet.customUrl.startsWith('@') ? snippet.customUrl : `@${snippet.customUrl}`) : `@${snippet.title.replace(/\s+/g, '')}`;
  const directUrl = `https://www.youtube.com/${snippet.customUrl || 'channel/' + channelId}`;

  // Keywords extraction
  let keywords: string[] = [];
  if (branding.channel?.keywords) {
    keywords = branding.channel.keywords
      .replace(/"/g, '')
      .split(/\s+/)
      .filter((k: string) => k.trim().length > 0);
  }

  // Social links from description
  const socialLinks = extractUrlsFromText(snippet.description || '');

  // Fetch top 3 videos from Uploads playlist
  let topVideos: ChannelAnalysisData['topVideos'] = [];
  let isActive = false;
  let lastActivityDate: string | undefined = undefined;

  const uploadsPlaylistId = contentDetails.relatedPlaylists?.uploads;
  if (uploadsPlaylistId) {
    try {
      const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${apiKey}`);
      const playlistData = await playlistRes.json();

      if (playlistData.items && playlistData.items.length > 0) {
        const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');
        
        // Check latest video upload date
        const latestUploadDate = new Date(playlistData.items[0].snippet.publishedAt);
        lastActivityDate = playlistData.items[0].snippet.publishedAt;
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - latestUploadDate.getTime()) / (1000 * 60 * 60 * 24));
        // Active if uploaded within last 45 days
        isActive = diffDays <= 45;

        // Fetch stats for these videos
        const videoStatsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`);
        const videoStatsData = await videoStatsRes.json();

        if (videoStatsData.items) {
          const parsedVideos = videoStatsData.items.map((v: any) => ({
            id: v.id,
            title: v.snippet.title,
            thumbnail: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url,
            viewCount: parseInt(v.statistics?.viewCount || '0', 10),
            publishedAt: v.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${v.id}`
          }));

          // Sort by views descending and take top 3
          topVideos = parsedVideos.sort((a: any, b: any) => b.viewCount - a.viewCount).slice(0, 3);
        }
      }
    } catch {
      // Non-blocking fallback for video stats
    }
  }

  const subCount = parseInt(stats.subscriberCount || '0', 10);
  const viewCount = parseInt(stats.viewCount || '0', 10);
  const videoCount = parseInt(stats.videoCount || '0', 10);
  const avgViewsPerVideo = videoCount > 0 ? Math.round(viewCount / videoCount) : 0;

  // Success rate calculation logic based on engagement & activity
  let successScore = 65;
  if (subCount > 0) {
    const avgViewsPerSub = (viewCount / Math.max(videoCount, 1)) / subCount;
    if (avgViewsPerSub > 1.5) successScore += 20;
    else if (avgViewsPerSub > 0.5) successScore += 10;
  }
  if (isActive) successScore += 15;
  if (videoCount > 50) successScore += 10;
  const successRate = Math.min(99, Math.max(25, Math.round(successScore)));

  const unsubscribedTrailerId = branding.channel?.unsubscribedTrailer || undefined;
  const trailerUrl = unsubscribedTrailerId ? `https://www.youtube.com/watch?v=${unsubscribedTrailerId}` : undefined;

  const channelResult: ChannelAnalysisData = {
    id: channelId,
    title: snippet.title || 'YouTube Channel',
    handle: customUrl,
    description: snippet.description || 'No channel description available.',
    customUrl: customUrl,
    directUrl: directUrl,
    publishedAt: snippet.publishedAt,
    accountAge: calculateAccountAge(snippet.publishedAt),
    country: snippet.country || branding.channel?.country || 'Global',
    defaultLanguage: snippet.defaultLanguage || snippet.defaultAudioLanguage || branding.channel?.defaultLanguage || 'Auto / English',
    bannerUrl: branding.image?.bannerExternalUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    logoUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=300&q=80',
    subscribersCount: subCount,
    videoCount: videoCount,
    viewCount: viewCount,
    avgViewsPerVideo: avgViewsPerVideo,
    keywords: keywords,
    socialLinks: socialLinks,
    topicCategories: cleanTopicCategories(topicDetails.topicCategories || []),
    unsubscribedTrailerId: unsubscribedTrailerId,
    trailerUrl: trailerUrl,
    madeForKids: Boolean(status.madeForKids || status.selfDeclaredMadeForKids),
    privacyStatus: status.privacyStatus || 'public',
    successRate: successRate,
    isActive: isActive,
    lastActivityDate: lastActivityDate,
    topVideos: topVideos,
    fromCache: false
  };

  // Asynchronously save to Supabase / Local database cache in background
  saveChannelToDb(channelResult).catch(() => {});

  return channelResult;
}

// Category Map Helper
const YOUTUBE_CATEGORIES: Record<string, string> = {
  '1': 'Film & Animation',
  '2': 'Autos & Vehicles',
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '18': 'Shorts',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology',
  '29': 'Nonprofits & Activism',
  '30': 'Movies',
  '31': 'Anime/Animation',
  '32': 'Action/Adventure',
  '33': 'Classics',
  '34': 'Comedy',
  '35': 'Documentary',
  '36': 'Drama',
  '37': 'Family',
  '38': 'Foreign',
  '39': 'Horror',
  '40': 'Sci-Fi/Fantasy',
  '41': 'Thriller',
  '42': 'Shorts',
  '43': 'Shows',
  '44': 'Trailers'
};

// Helper to format ISO 8601 duration (e.g., PT15M33S -> 15m 33s)
function formatIsoDuration(isoDuration: string): string {
  if (!isoDuration) return 'N/A';
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;

  const hours = match[1] ? `${match[1]}h ` : '';
  const minutes = match[2] ? `${match[2]}m ` : '';
  const seconds = match[3] ? `${match[3]}s` : '0s';

  return `${hours}${minutes}${seconds}`.trim() || '0s';
}

// Helper to extract hashtags (#example) from text
function extractHashtagsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#([a-zA-Z0-9_\u0980-\u09FF]+)/g) || [];
  return Array.from(new Set(matches));
}

// Helper to clean topic category URLs (e.g. https://en.wikipedia.org/wiki/Music -> Music)
function cleanTopicCategories(topics: string[]): string[] {
  if (!topics || !Array.isArray(topics)) return [];
  return topics.map(url => {
    try {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      return decodeURIComponent(lastPart).replace(/_/g, ' ');
    } catch {
      return url;
    }
  });
}

// Analyze YouTube Video
export async function analyzeYouTubeVideo(input: string, forceFresh: boolean = false): Promise<VideoAnalysisData> {
  const videoId = extractVideoId(input);
  if (!videoId) {
    throw new Error('Please enter a valid YouTube Video URL or Video ID.');
  }

  // 1. Check Supabase / Local Database Cache first to save API tokens
  if (!forceFresh) {
    try {
      const cached = await getVideoFromDb(videoId);
      if (cached) {
        return {
          ...cached,
          fromCache: true
        };
      }
    } catch {
      // Cache lookup failed, continue with live API fetch
    }
  }

  const apiKey = API_CONFIG.youtubeApiKey;
  if (!apiKey) {
    throw new Error('YouTube API Key is missing.');
  }

  const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,topicDetails,status,player&id=${videoId}&key=${apiKey}`);
  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found or is private/deleted.');
  }

  const item = data.items[0];
  const snippet = item.snippet || {};
  const stats = item.statistics || {};
  const contentDetails = item.contentDetails || {};
  const topicDetails = item.topicDetails || {};
  const status = item.status || {};

  const extractedLinks = extractUrlsFromText(snippet.description || '');
  const hashtags = extractHashtagsFromText(snippet.description || '');
  const tags = snippet.tags || [];

  // Keywords extraction (tags + words from title)
  const titleWords = (snippet.title || '')
    .split(/\s+/)
    .map((w: string) => w.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, ''))
    .filter((w: string) => w.length > 3);

  const keywords = Array.from(new Set([...tags, ...titleWords])).slice(0, 30);

  const viewCount = parseInt(stats.viewCount || '0', 10);
  const likeCount = parseInt(stats.likeCount || '0', 10);
  const commentCount = parseInt(stats.commentCount || '0', 10);

  // Engagement Rate calculation
  const engagementRate = viewCount > 0
    ? Number((((likeCount + commentCount) / viewCount) * 100).toFixed(2))
    : 0;

  const categoryId = snippet.categoryId || '';
  const categoryName = YOUTUBE_CATEGORIES[categoryId] || `Category (${categoryId})`;

  const thumbnails: ThumbnailItem[] = [
    {
      quality: 'Maximum Resolution (1080p)',
      url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      width: '1920',
      height: '1080'
    },
    {
      quality: 'Standard Quality (720p)',
      url: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      width: '640',
      height: '480'
    },
    {
      quality: 'High Quality (480p)',
      url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      width: '480',
      height: '360'
    },
    {
      quality: 'Medium Quality (360p)',
      url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      width: '320',
      height: '180'
    }
  ];

  const videoResult: VideoAnalysisData = {
    id: videoId,
    title: snippet.title || 'YouTube Video',
    description: snippet.description || 'No video description available.',
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    thumbnails: thumbnails,
    publishedAt: snippet.publishedAt,
    viewCount: viewCount,
    likeCount: likeCount,
    commentCount: commentCount,
    engagementRate: engagementRate,
    channelId: snippet.channelId,
    channelTitle: snippet.channelTitle || 'YouTube Channel',
    categoryId: categoryId,
    categoryName: categoryName,
    duration: formatIsoDuration(contentDetails.duration || ''),
    durationISO: contentDetails.duration || '',
    definition: (contentDetails.definition || 'hd').toUpperCase(),
    dimension: (contentDetails.dimension || '2d').toUpperCase(),
    caption: contentDetails.caption === 'true' ? 'Available' : 'None',
    licensedContent: Boolean(contentDetails.licensedContent),
    defaultAudioLanguage: snippet.defaultAudioLanguage || snippet.defaultLanguage || 'Auto / English',
    defaultLanguage: snippet.defaultLanguage || 'Not specified',
    tags: tags,
    hashtags: hashtags,
    keywords: keywords,
    extractedLinks: extractedLinks,
    topicCategories: cleanTopicCategories(topicDetails.topicCategories || []),
    embeddable: status.embeddable ?? true,
    privacyStatus: status.privacyStatus || 'public',
    fromCache: false
  };

  // Asynchronously save to Supabase / Local database cache in background
  saveVideoToDb(videoResult).catch(() => {});

  return videoResult;
}
