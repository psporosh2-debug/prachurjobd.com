export interface TikTokAuthor {
  id: string;
  uniqueId: string;
  nickname: string;
  avatar: string;
}

export interface TikTokStats {
  playCount: number;
  diggCount: number;
  commentCount: number;
  shareCount: number;
  downloadCount: number;
}

export interface TikTokMusicInfo {
  id: string;
  title: string;
  author: string;
  duration: number;
  cover: string;
}

export interface TikTokVideoData {
  id: string;
  title: string;
  duration: number;
  cover: string;
  originCover: string;
  dynamicCover?: string;
  videoUrl: string; // No watermark standard MP4
  videoHdUrl: string; // No watermark HD MP4
  videoWmUrl: string; // Watermarked original MP4
  audioUrl: string; // MP3 sound
  musicInfo: TikTokMusicInfo;
  author: TikTokAuthor;
  stats: TikTokStats;
  size: {
    nowm: number;
    hd: number;
    wm: number;
  };
  images: string[];
  isSlideShow: boolean;
  sourceUrl: string;
  fetchedAt: string;
}

export interface TikTokExtractResponse {
  success: boolean;
  data?: TikTokVideoData;
  error?: string;
}

// Client Extractor Function (Server first with Direct Browser fallback)
export async function extractTikTokVideo(url: string): Promise<TikTokExtractResponse> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return { success: false, error: 'Please enter a valid TikTok URL.' };
  }

  // 1. Try our Express Backend API first
  try {
    const res = await fetch('/api/tiktok/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json;
      }
      if (json.error) {
        return { success: false, error: json.error };
      }
    }
  } catch (backendErr) {
    console.warn('Backend TikTok extraction failed, attempting direct client fallback:', backendErr);
  }

  // 2. Direct Browser Fallback via TikWM Public Gateway
  try {
    const directRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}&hd=1`, {
      method: 'GET',
    });

    if (directRes.ok) {
      const json: any = await directRes.json();
      if (json && (json.code === 0 || json.msg === 'success') && json.data) {
        const d = json.data;

        const makeAbsolute = (pathStr: string) => {
          if (!pathStr) return '';
          if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) return pathStr;
          return `https://www.tikwm.com${pathStr.startsWith('/') ? '' : '/'}${pathStr}`;
        };

        const data: TikTokVideoData = {
          id: d.id || String(Date.now()),
          title: d.title || 'TikTok Video',
          duration: d.duration || 0,
          cover: makeAbsolute(d.cover || d.origin_cover),
          originCover: makeAbsolute(d.origin_cover || d.cover),
          dynamicCover: makeAbsolute(d.dynamic_cover || ''),
          videoUrl: makeAbsolute(d.play || d.hdplay || d.wmplay),
          videoHdUrl: makeAbsolute(d.hdplay || d.play),
          videoWmUrl: makeAbsolute(d.wmplay || d.play),
          audioUrl: makeAbsolute(d.music || ''),
          musicInfo: {
            id: d.music_info?.id || '',
            title: d.music_info?.title || d.music_info?.album || 'Original Sound',
            author: d.music_info?.author || d.author?.nickname || 'TikTok Creator',
            duration: d.music_info?.duration || d.duration || 0,
            cover: makeAbsolute(d.music_info?.cover || d.cover),
          },
          author: {
            id: d.author?.id || '',
            uniqueId: d.author?.unique_id || 'tiktok_user',
            nickname: d.author?.nickname || 'TikTok User',
            avatar: makeAbsolute(d.author?.avatar || ''),
          },
          stats: {
            playCount: Number(d.play_count) || 0,
            diggCount: Number(d.digg_count) || 0,
            commentCount: Number(d.comment_count) || 0,
            shareCount: Number(d.share_count) || 0,
            downloadCount: Number(d.download_count) || 0,
          },
          size: {
            nowm: d.size || 0,
            hd: d.hd_size || d.size || 0,
            wm: d.wm_size || 0,
          },
          images: Array.isArray(d.images) ? d.images.map((img: string) => makeAbsolute(img)) : [],
          isSlideShow: Array.isArray(d.images) && d.images.length > 0,
          sourceUrl: cleanUrl,
          fetchedAt: new Date().toISOString(),
        };

        return { success: true, data };
      }
    }
  } catch (clientErr: any) {
    console.error('Direct client TikTok extraction failed:', clientErr);
  }

  return {
    success: false,
    error: 'Failed to extract TikTok video. Please make sure the video is public and the link is correct.',
  };
}

export type MediaFormat = 'mp4' | 'webm' | 'mp3' | 'm4a' | 'wav' | 'jpg';
export type MediaQuality = '1080p' | '720p' | '480p' | '360p';

// Helper to ensure correct extension for media files based on format
function ensureMediaExtension(filename: string, format: MediaFormat | string): string {
  const clean = (filename || 'tiktok_download').trim().replace(/\.[a-zA-Z0-9]+$/i, '');
  const formatExtMap: Record<string, string> = {
    webm: '.webm',
    mp3: '.mp3',
    m4a: '.m4a',
    wav: '.wav',
    jpg: '.jpg',
    mp4: '.mp4',
  };
  const ext = formatExtMap[format?.toLowerCase()] || '.mp4';
  return `${clean}${ext}`;
}

// Generate direct download URL with quality & format options
export function getTikTokDownloadUrl(
  mediaUrl: string,
  filename: string,
  type: 'video' | 'audio' | 'image' = 'video',
  format?: MediaFormat | string,
  quality?: MediaQuality | string
): string {
  if (!mediaUrl) return '#';
  const targetFormat = format || (type === 'audio' ? 'mp3' : type === 'image' ? 'jpg' : 'mp4');
  const cleanFilename = ensureMediaExtension(filename, targetFormat);
  let proxyUrl = `/api/tiktok/download?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(cleanFilename)}&type=${type}&format=${targetFormat}`;
  if (quality) {
    proxyUrl += `&quality=${encodeURIComponent(quality)}`;
  }
  return proxyUrl;
}

// Helper to trigger direct file download in browser using secure blob approach with stream progress
export async function downloadTikTokFile(
  url: string,
  filename: string,
  type: 'video' | 'audio' | 'image' = 'video',
  format?: MediaFormat | string,
  quality?: MediaQuality | string,
  onProgress?: (progress: number, loadedBytes: number, totalBytes: number) => void
): Promise<boolean> {
  if (!url) return false;
  const targetFormat = format || (type === 'audio' ? 'mp3' : type === 'image' ? 'jpg' : 'mp4');
  const finalFilename = ensureMediaExtension(filename, targetFormat);

  try {
    let blob: Blob | null = null;

    // Helper to read response with stream progress
    async function fetchWithStreamProgress(fetchUrl: string): Promise<Blob | null> {
      const res = await fetch(fetchUrl);
      if (!res.ok) return null;

      const contentLengthHeader = res.headers.get('content-length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

      if (!res.body) {
        const directBlob = await res.blob();
        if (onProgress && totalBytes > 0) onProgress(100, directBlob.size, directBlob.size);
        return directBlob;
      }

      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          receivedBytes += value.length;

          if (onProgress && totalBytes > 0) {
            const pct = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
            onProgress(pct, receivedBytes, totalBytes);
          } else if (onProgress) {
            onProgress(50, receivedBytes, 0);
          }
        }
      }

      if (onProgress) onProgress(100, receivedBytes, totalBytes || receivedBytes);
      const mime = res.headers.get('content-type') || 'application/octet-stream';
      return new Blob(chunks, { type: mime });
    }

    // Strategy 1: Fetch via local proxy endpoint with requested format & quality
    try {
      const proxyUrl = getTikTokDownloadUrl(url, finalFilename, type, targetFormat, quality);
      const candidateBlob = await fetchWithStreamProgress(proxyUrl);
      if (candidateBlob && candidateBlob.size > 500 && !candidateBlob.type.includes('text/html')) {
        blob = candidateBlob;
      }
    } catch (proxyErr) {
      console.warn('Proxy download fetch failed, attempting direct URL fetch:', proxyErr);
    }

    // Strategy 2: Direct browser fetch if proxy is unreachable or returned non-binary content
    if (!blob) {
      try {
        const candidateBlob = await fetchWithStreamProgress(url);
        if (candidateBlob && candidateBlob.size > 500 && !candidateBlob.type.includes('text/html')) {
          blob = candidateBlob;
        }
      } catch (directErr) {
        console.warn('Direct media fetch failed:', directErr);
      }
    }

    // Strategy 3: Save Blob using URL.createObjectURL to trigger browser save dialog
    if (blob) {
      const mimeMap: Record<string, string> = {
        webm: 'video/webm',
        mp3: 'audio/mpeg',
        m4a: 'audio/mp4',
        wav: 'audio/wav',
        jpg: 'image/jpeg',
        mp4: 'video/mp4',
      };
      const mimeType = mimeMap[targetFormat.toLowerCase()] || (type === 'audio' ? 'audio/mpeg' : type === 'image' ? 'image/jpeg' : 'video/mp4');
      const typedBlob = blob.type ? blob : new Blob([blob], { type: mimeType });
      const objectUrl = URL.createObjectURL(typedBlob);

      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = objectUrl;
      link.download = finalFilename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(objectUrl);
      }, 2000);

      return true;
    }

    // Strategy 4: Fallback window trigger if blob construction failed
    const fallbackUrl = getTikTokDownloadUrl(url, finalFilename, type, targetFormat, quality);
    const link = document.createElement('a');
    link.href = fallbackUrl;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1000);
    return true;
  } catch (err) {
    console.error('Download trigger error:', err);
    window.open(url, '_blank', 'noopener,noreferrer');
    return false;
  }
}

// Format numbers (e.g. 1500000 -> 1.5M)
export function formatStatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

// Format bytes to readable MB/KB
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

// Format seconds to mm:ss
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Validate TikTok URL format
export function isValidTikTokUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  const tiktokRegex = /^(https?:\/\/)?((www|vt|vm|m|t)\.)?(tiktok\.com|tiktokv\.com)\/.+$/i;
  return tiktokRegex.test(clean);
}
