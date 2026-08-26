export interface PinterestAuthor {
  name: string;
  avatar: string;
}

export interface PinterestVideoData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  author: PinterestAuthor;
  sourceUrl: string;
  fetchedAt: string;
}

export interface PinterestExtractResponse {
  success: boolean;
  data?: PinterestVideoData;
  error?: string;
}

// Client Extractor Function
export async function extractPinterestVideo(url: string): Promise<PinterestExtractResponse> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return { success: false, error: 'Please enter a valid Pinterest URL.' };
  }

  // 1. Primary: Server-side API endpoint
  try {
    const res = await fetch('/api/pinterest/extract', {
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
    } else {
      const errorJson = await res.json().catch(() => null);
      if (errorJson?.error) {
        return { success: false, error: errorJson.error };
      }
    }
  } catch (err: any) {
    console.warn('Primary Pinterest extraction request encountered network issue:', err);
  }

  // 2. Client-side fallback via public CORS proxy if server endpoint is unreachable
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`;
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      const html = await proxyRes.text();
      const cleanSource = html
        .replace(/\\u002F/g, "/")
        .replace(/\\u0026/g, "&")
        .replace(/\\"/g, '"')
        .replace(/\\\//g, "/");

      const rawMp4Regex = /https?:\/\/[^\s"'<>\\]*?pinimg\.com\/videos\/[^\s"'<>\\]+?\.mp4/gi;
      const mp4Matches = cleanSource.match(rawMp4Regex) || [];
      if (mp4Matches.length > 0) {
        const hdMatch = mp4Matches.find(u => u.includes("720w") || u.includes("1080w") || u.includes("expMp4")) || mp4Matches[0];
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace(/\s*\|\s*Pinterest$/i, "").trim() : "Pinterest HD Video";

        return {
          success: true,
          data: {
            id: String(Date.now()),
            title,
            description: "Pinterest video extracted successfully",
            videoUrl: hdMatch,
            thumbnailUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800",
            duration: 30,
            author: {
              name: "Pinterest Creator",
              avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
            },
            sourceUrl: cleanUrl,
            fetchedAt: new Date().toISOString(),
          }
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    success: false,
    error: 'Failed to extract Pinterest video. Please make sure the Pin is a video, is public, and the link is active.',
  };
}

export type MediaFormat = 'mp4' | 'mp3' | 'jpg';

// Generate direct download URL with custom name and format
export function getPinterestDownloadUrl(
  mediaUrl: string,
  filename: string,
  type: 'video' | 'audio' | 'image' = 'video',
  format?: MediaFormat | string
): string {
  if (!mediaUrl) return '#';
  const targetFormat = format || (type === 'audio' ? 'mp3' : type === 'image' ? 'jpg' : 'mp4');
  const cleanFilename = filename.trim().replace(/\.[a-zA-Z0-9]+$/i, '') + `.${targetFormat}`;
  return `/api/pinterest/download?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(cleanFilename)}&type=${type}&format=${targetFormat}`;
}

// Trigger direct file download in browser using secure blob approach with stream progress
export async function downloadPinterestFile(
  url: string,
  filename: string,
  type: 'video' | 'audio' | 'image' = 'video',
  format?: MediaFormat | string,
  onProgress?: (progress: number, loadedBytes: number, totalBytes: number) => void
): Promise<boolean> {
  if (!url) return false;
  const targetFormat = format || (type === 'audio' ? 'mp3' : type === 'image' ? 'jpg' : 'mp4');
  const finalFilename = filename.trim().replace(/\.[a-zA-Z0-9]+$/i, '') + `.${targetFormat}`;

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

    // Attempt proxy download fetch
    try {
      const proxyUrl = getPinterestDownloadUrl(url, finalFilename, type, targetFormat);
      const candidateBlob = await fetchWithStreamProgress(proxyUrl);
      if (candidateBlob && candidateBlob.size > 500 && !candidateBlob.type.includes('text/html')) {
        blob = candidateBlob;
      }
    } catch (proxyErr) {
      console.warn('Proxy download failed, attempting direct download:', proxyErr);
    }

    if (!blob) {
      try {
        const candidateBlob = await fetchWithStreamProgress(url);
        if (candidateBlob && candidateBlob.size > 500 && !candidateBlob.type.includes('text/html')) {
          blob = candidateBlob;
        }
      } catch (directErr) {
        console.warn('Direct download failed:', directErr);
      }
    }

    if (blob) {
      const mimeMap: Record<string, string> = {
        mp3: 'audio/mpeg',
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

    // Direct window trigger fallback
    const fallbackUrl = getPinterestDownloadUrl(url, finalFilename, type, targetFormat);
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
    console.error('Pinterest download error:', err);
    window.open(url, '_blank', 'noopener,noreferrer');
    return false;
  }
}

// Format seconds to mm:ss
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Validate Pinterest URL
export function isValidPinterestUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  const pinterestRegex = /^(https?:\/\/)?((www|assets|m|pin)\.)?(pinterest\.(com|co\.[a-z]{2}|[a-z]{2})|pin\.it)\/.+$/i;
  return pinterestRegex.test(clean);
}
