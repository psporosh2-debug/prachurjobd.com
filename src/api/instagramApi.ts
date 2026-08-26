export interface InstagramMediaItem {
  url: string;
  type: "video" | "image";
  resolution: string;
  thumbnail: string;
}

export interface InstagramVideoData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  author: {
    name: string;
    avatar: string;
  };
  sourceUrl: string;
  fetchedAt: string;
  mediaList: InstagramMediaItem[];
}

export interface InstagramExtractResponse {
  success: boolean;
  data?: InstagramVideoData;
  error?: string;
}

export type MediaFormat = "mp4" | "mp3" | "jpg";

// Client Extractor Function
export async function extractInstagramVideo(url: string): Promise<InstagramExtractResponse> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return { success: false, error: "Please enter a valid Instagram URL." };
  }

  try {
    const res = await fetch("/api/instagram/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    return { success: false, error: "Server returned an error while processing the link." };
  } catch (err: any) {
    console.error("Instagram extraction network error:", err);
    return {
      success: false,
      error: err?.message || "Failed to connect to extraction server. Please try again.",
    };
  }
}

// Generate the fully configured proxy download URL
export function getInstagramDownloadUrl(
  mediaUrl: string,
  filename: string,
  type: "video" | "audio" | "image",
  format: string
): string {
  const safeFilename = filename
    .replace(/[^a-zA-Z0-9_\.-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);

  return `/api/instagram/download?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(
    safeFilename
  )}&type=${type}&format=${format}`;
}

// Stream download helper with browser progress callback
export async function downloadInstagramFile(
  mediaUrl: string,
  filename: string,
  type: "video" | "audio" | "image" = "video",
  format: MediaFormat = "mp4",
  onProgress?: (progress: number, loadedBytes: number, totalBytes: number) => void
): Promise<boolean> {
  try {
    const downloadUrl = getInstagramDownloadUrl(mediaUrl, filename, type, format);
    const response = await fetch(downloadUrl);

    if (!response.ok || !response.body) {
      throw new Error("Failed to download media file.");
    }

    const reader = response.body.getReader();
    const contentLength = Number(response.headers.get("Content-Length") || "0");

    let receivedLength = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
      receivedLength += value.length;

      if (onProgress) {
        const progress = contentLength > 0 ? Math.round((receivedLength / contentLength) * 100) : 0;
        onProgress(progress, receivedLength, contentLength);
      }
    }

    const blob = new Blob(chunks, {
      type: type === "audio" ? "audio/mpeg" : type === "image" ? "image/jpeg" : "video/mp4",
    });
    
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadLink.href);

    return true;
  } catch (err) {
    console.error("Stream download failed:", err);
    return false;
  }
}

// Validate Instagram URL
export function isValidInstagramUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim();
  const instagramRegex = /^(https?:\/\/)?((www|m)\.)?(instagram\.com|instagr\.am)\/.+$/i;
  return instagramRegex.test(clean);
}
