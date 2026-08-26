/**
 * Universal In-Browser Image Processing Engine
 * High-performance image loading, decoding, format conversion & compression
 * Fully compatible with Mobile Chrome, Safari, Firefox, Edge and WebWorkers.
 */

export type TargetImageFormat = 'webp' | 'png' | 'jpeg' | 'avif' | 'bmp';

export interface ImageWatermarkOptions {
  enabled: boolean;
  text?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  style?: 'badge' | 'shadow' | 'clean';
  opacity?: number;
  fontSizePercent?: number;
}

export interface ImageConversionOptions {
  source: File | Blob | string;
  targetFormat: TargetImageFormat;
  quality?: number; // 0.05 to 1.0 (default 0.85)
  scalePercent?: number; // 1 to 100 (default 100)
  maxWidth?: number;
  maxHeight?: number;
  watermark?: ImageWatermarkOptions;
  fallbackOriginalSize?: number;
}

/**
 * Utility to build branded download filenames including website title (prachurjo), original title/tag, and extension
 * Example: prachurjo-myphoto-compressed.png, prachurjo-myphoto-converted.webp, prachurjo-favicon-32x32.png, prachurjo-favicons-package.zip
 */
export function formatPrachurjoDownloadName(
  originalName: string = '',
  actionTag: string = '',
  extension: string = 'png'
): string {
  const cleanExt = (extension || 'png').replace(/^\./, '').toLowerCase();
  
  // Extract base name without extension
  let baseName = (originalName || '').replace(/\.[^/.]+$/, '').trim();
  
  // Clean special characters into hyphens
  baseName = baseName
    ? baseName.replace(/[^a-zA-Z0-9_\-\s]/g, '').replace(/\s+/g, '-').toLowerCase()
    : 'image';

  const suffix = actionTag ? `-${actionTag}` : '';
  
  return `prachurjo-${baseName}${suffix}.${cleanExt}`;
}

/**
 * Draws custom watermark / brand text onto canvas
 */
export function drawWatermarkOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermark: ImageWatermarkOptions
) {
  const text = watermark.text?.trim() || "prachurjo";
  if (!text) return;

  const opacity = Math.min(Math.max(watermark.opacity ?? 0.85, 0.1), 1.0);
  const pos = watermark.position || "bottom-right";
  const style = watermark.style || "badge";
  const fontSizePct = watermark.fontSizePercent || 4;

  const minDim = Math.min(width, height);
  const baseSize = Math.round((minDim * fontSizePct) / 100);
  const fontSize = Math.max(12, baseSize);

  ctx.save();
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const paddingX = Math.round(fontSize * 0.6);
  const paddingY = Math.round(fontSize * 0.4);
  const badgeWidth = textWidth + paddingX * 2;
  const badgeHeight = fontSize + paddingY * 2;

  const margin = Math.max(10, Math.round(minDim * 0.025));

  let x = 0;
  let y = 0;

  switch (pos) {
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-right':
      x = width - badgeWidth - margin;
      y = margin;
      break;
    case 'bottom-left':
      x = margin;
      y = height - badgeHeight - margin;
      break;
    case 'center':
      x = (width - badgeWidth) / 2;
      y = (height - badgeHeight) / 2;
      break;
    case 'bottom-right':
    default:
      x = width - badgeWidth - margin;
      y = height - badgeHeight - margin;
      break;
  }

  if (style === 'badge') {
    ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * opacity})`;
    const radius = Math.round(badgeHeight / 3);
    if (typeof (ctx as any).roundRect === 'function') {
      ctx.beginPath();
      (ctx as any).roundRect(x, y, badgeWidth, badgeHeight, radius);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, badgeWidth, badgeHeight);
    }

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * opacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fillText(text, x + paddingX, y + badgeHeight / 2);
  } else if (style === 'shadow') {
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.shadowColor = `rgba(0, 0, 0, ${0.85 * opacity})`;
    ctx.shadowBlur = Math.round(fontSize / 2.5);
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(text, x + paddingX, y + badgeHeight / 2);
  } else {
    // Clean text
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fillText(text, x + paddingX, y + badgeHeight / 2);
  }

  ctx.restore();
}

export interface ImageConversionResult {
  dataUrl: string;
  blob: Blob;
  blobUrl: string;
  width: number;
  height: number;
  newSizeBytes: number;
  newSizeStr: string;
  savingsPercent: number;
  formatName: string;
  mimeType: string;
}

/**
 * Pure JS BMP generator for universal browser export
 */
export function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context missing');
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const extraBytes = (4 - ((width * 3) % 4)) % 4;
  const rowSize = width * 3 + extraBytes;
  const imageSize = rowSize * height;
  const totalFileSize = 54 + imageSize;

  const buffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(buffer);

  // File Header
  view.setUint16(0, 0x4d42, false); // BM
  view.setUint32(2, totalFileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, 54, true); // Offset

  // BITMAPINFOHEADER
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // 24-bit
  view.setUint32(30, 0, true); // BI_RGB
  view.setUint32(34, imageSize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  const bytes = new Uint8Array(buffer);
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      bytes[offset++] = data[idx + 2]; // B
      bytes[offset++] = data[idx + 1]; // G
      bytes[offset++] = data[idx];     // R
    }
    for (let p = 0; p < extraBytes; p++) {
      bytes[offset++] = 0;
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Robust, resilient Image element loader supporting File, Blob, DataURL, ObjectURL & Remote URLs
 */
export async function loadImageElement(source: File | Blob | string | any): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let resolvedUrl = '';
    let isCreatedBlobUrl = false;
    let isResolved = false;

    // Unwrap object source if an attachment/info object was passed directly
    let effectiveSource: any = source;
    if (effectiveSource && typeof effectiveSource === 'object' && !(effectiveSource instanceof Blob)) {
      const stringDataUrl = effectiveSource.originalUrl || effectiveSource.convertedUrl || effectiveSource.croppedDataUrl || effectiveSource.dataUrl || effectiveSource.previewUrl || effectiveSource.url || effectiveSource.imageUrl || effectiveSource.src;
      if (typeof stringDataUrl === 'string' && stringDataUrl.trim().length > 0) {
        effectiveSource = stringDataUrl.trim();
      } else if (effectiveSource.fileObj instanceof Blob) {
        effectiveSource = effectiveSource.fileObj;
      }
    }

    const delayedCleanup = () => {
      if (isCreatedBlobUrl && resolvedUrl) {
        const urlToRevoke = resolvedUrl;
        setTimeout(() => {
          try {
            URL.revokeObjectURL(urlToRevoke);
          } catch {
            // Ignore revoke error
          }
        }, 10000);
      }
    };

    const immediateCleanup = () => {
      if (isCreatedBlobUrl && resolvedUrl) {
        try {
          URL.revokeObjectURL(resolvedUrl);
        } catch {
          // Ignore
        }
      }
    };

    const handleSuccess = (img: HTMLImageElement) => {
      if (isResolved) return;
      isResolved = true;
      delayedCleanup();
      resolve(img);
    };

    const handleError = (msg: string) => {
      if (isResolved) return;
      isResolved = true;
      immediateCleanup();
      reject(new Error(msg));
    };

    // Safety timeout: abort if image load hangs longer than 8 seconds
    const timer = setTimeout(() => {
      handleError('Image loading timed out after 8 seconds');
    }, 8000);

    const wrapSuccess = (img: HTMLImageElement) => {
      clearTimeout(timer);
      handleSuccess(img);
    };

    const wrapError = (msg: string) => {
      clearTimeout(timer);
      handleError(msg);
    };

    // CASE 1: Blob or File source
    if (effectiveSource instanceof Blob) {
      const blobSource = effectiveSource;
      try {
        resolvedUrl = URL.createObjectURL(blobSource);
        isCreatedBlobUrl = true;

        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            wrapSuccess(img);
          } else {
            fallbackFileReader();
          }
        };
        img.onerror = () => {
          fallbackFileReader();
        };

        img.src = resolvedUrl;

        if (img.complete && img.naturalWidth > 0) {
          wrapSuccess(img);
          return;
        }

        if ('decode' in img && typeof img.decode === 'function') {
          img.decode().then(() => {
            if (img.naturalWidth > 0) wrapSuccess(img);
          }).catch(() => {
            // onload / onerror fallback will handle this
          });
        }
        return;
      } catch {
        fallbackFileReader();
        return;
      }

      function fallbackFileReader() {
        immediateCleanup();
        isCreatedBlobUrl = false;
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (!dataUrl) {
            wrapError('Failed to read image file data');
            return;
          }
          const img2 = new Image();
          img2.onload = () => wrapSuccess(img2);
          img2.onerror = () => wrapError('Image decoding failed in browser');
          img2.src = dataUrl;
          if (img2.complete && img2.naturalWidth > 0) {
            wrapSuccess(img2);
          }
        };
        reader.onerror = () => wrapError('FileReader encountered an error reading the file');
        reader.readAsDataURL(blobSource);
      }
    }

    // CASE 2: String URL / Data URL source
    if (typeof effectiveSource === 'string') {
      resolvedUrl = effectiveSource.trim();
      if (!resolvedUrl) {
        wrapError('Empty image source provided');
        return;
      }

      const img = new Image();
      if (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => wrapSuccess(img);
      img.onerror = () => {
        if (img.crossOrigin === 'anonymous') {
          const imgFallback = new Image();
          imgFallback.onload = () => wrapSuccess(imgFallback);
          imgFallback.onerror = () => wrapError('Failed to load image from remote URL');
          imgFallback.src = resolvedUrl;
        } else {
          wrapError('Failed to load image from URL');
        }
      };

      img.src = resolvedUrl;

      if (img.complete && img.naturalWidth > 0) {
        wrapSuccess(img);
      }
      return;
    }

    wrapError('Unsupported or invalid image source provided. Please re-upload your image.');
  });
}

/**
 * Universal Image Conversion & Compression Method
 */
export async function convertImage(options: ImageConversionOptions): Promise<ImageConversionResult> {
  const {
    source,
    targetFormat,
    quality = 0.85,
    scalePercent = 100,
    maxWidth,
    maxHeight,
    fallbackOriginalSize = 0
  } = options;

  let effectiveSource: any = source;
  if (effectiveSource && typeof effectiveSource === 'object' && !(effectiveSource instanceof Blob)) {
    const stringDataUrl = effectiveSource.originalUrl || effectiveSource.convertedUrl || effectiveSource.croppedDataUrl || effectiveSource.dataUrl || effectiveSource.previewUrl || effectiveSource.url || effectiveSource.imageUrl || effectiveSource.src;
    if (typeof stringDataUrl === 'string' && stringDataUrl.trim().length > 0) {
      effectiveSource = stringDataUrl.trim();
    } else if (effectiveSource.fileObj instanceof Blob) {
      effectiveSource = effectiveSource.fileObj;
    }
  }

  let originalSizeBytes = 0;
  if (effectiveSource instanceof Blob) {
    originalSizeBytes = effectiveSource.size;
  } else if (fallbackOriginalSize > 0) {
    originalSizeBytes = fallbackOriginalSize;
  }

  let canvasWidth = 0;
  let canvasHeight = 0;
  let drawableSource: ImageBitmap | HTMLImageElement | null = null;

  // 1. Attempt High-Performance ImageBitmap decoding first if source is a Blob/File
  if (effectiveSource instanceof Blob && typeof window.createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(effectiveSource);
      if (bitmap && bitmap.width > 0 && bitmap.height > 0) {
        drawableSource = bitmap;
        canvasWidth = bitmap.width;
        canvasHeight = bitmap.height;
      }
    } catch {
      drawableSource = null;
    }
  }

  // 2. Fallback to HTMLImageElement loader if ImageBitmap failed or source is a URL
  if (!drawableSource) {
    const img = await loadImageElement(effectiveSource);
    drawableSource = img;
    canvasWidth = img.naturalWidth || img.width;
    canvasHeight = img.naturalHeight || img.height;
  }

  if (canvasWidth <= 0 || canvasHeight <= 0) {
    throw new Error('Image has invalid dimensions');
  }

  // 3. Apply optional dimension scaling (scalePercent + maxWidth/maxHeight in 1 single pass)
  let targetWidth = canvasWidth;
  let targetHeight = canvasHeight;

  if (scalePercent && scalePercent > 0 && scalePercent < 100) {
    targetWidth = Math.max(1, Math.round((canvasWidth * scalePercent) / 100));
    targetHeight = Math.max(1, Math.round((canvasHeight * scalePercent) / 100));
  }

  if (maxWidth && targetWidth > maxWidth) {
    targetHeight = Math.max(1, Math.round((targetHeight * maxWidth) / targetWidth));
    targetWidth = maxWidth;
  }
  if (maxHeight && targetHeight > maxHeight) {
    targetWidth = Math.max(1, Math.round((targetWidth * maxHeight) / targetHeight));
    targetHeight = maxHeight;
  }

  // 4. Render to Canvas
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, targetWidth);
  canvas.height = Math.max(1, targetHeight);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to initialize 2D canvas context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // For JPEG or BMP, fill white background to handle transparency
  if (targetFormat === 'jpeg' || targetFormat === 'bmp') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(drawableSource as any, 0, 0, canvas.width, canvas.height);

  // Apply optional Watermark / Brand text
  if (options.watermark && options.watermark.enabled) {
    drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, options.watermark);
  }

  // Close ImageBitmap if used to free GPU memory immediately
  if (typeof (drawableSource as any).close === 'function') {
    try {
      (drawableSource as any).close();
    } catch {
      // Ignore cleanup error
    }
  }

  // 5. Generate Target Format Blob & Data URL
  const clampedQuality = Math.min(Math.max(quality, 0.05), 1.0);
  const mimeType = targetFormat === 'jpeg' ? 'image/jpeg' 
    : targetFormat === 'webp' ? 'image/webp'
    : targetFormat === 'png' ? 'image/png'
    : targetFormat === 'avif' ? 'image/avif'
    : 'image/bmp';

  let finalBlob: Blob;
  let finalDataUrl: string = '';

  if (targetFormat === 'bmp') {
    finalBlob = canvasToBmpBlob(canvas);
    finalDataUrl = canvas.toDataURL('image/png'); // for preview display
  } else {
    // Generate Blob safely
    finalBlob = await new Promise<Blob>((resolve) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size > 0) {
              resolve(blob);
            } else {
              try {
                const dUrl = canvas.toDataURL(mimeType, clampedQuality);
                const parts = dUrl.split(',');
                const byteString = atob(parts[1]);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                resolve(new Blob([ab], { type: mimeType }));
              } catch {
                const dUrl = canvas.toDataURL('image/png');
                const parts = dUrl.split(',');
                const byteString = atob(parts[1]);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                resolve(new Blob([ab], { type: 'image/png' }));
              }
            }
          },
          mimeType,
          clampedQuality
        );
      } catch {
        const dUrl = canvas.toDataURL('image/png');
        const parts = dUrl.split(',');
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve(new Blob([ab], { type: 'image/png' }));
      }
    });

    try {
      finalDataUrl = canvas.toDataURL(mimeType, clampedQuality);
    } catch {
      finalDataUrl = URL.createObjectURL(finalBlob);
    }
  }

  const newSizeBytes = finalBlob.size;
  const newSizeStr = newSizeBytes > 1024 * 1024
    ? `${(newSizeBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(newSizeBytes / 1024).toFixed(1)} KB`;

  const baseRefSize = originalSizeBytes || (newSizeBytes * 1.5);
  const savingsPercent = Math.max(0, Math.round(((baseRefSize - newSizeBytes) / baseRefSize) * 100));

  const formatName = targetFormat === 'webp' ? 'WebP'
    : targetFormat === 'png' ? 'PNG'
    : targetFormat === 'jpeg' ? 'JPG'
    : targetFormat === 'avif' ? 'AVIF'
    : 'BMP';

  const blobUrl = URL.createObjectURL(finalBlob);

  return {
    dataUrl: finalDataUrl || blobUrl,
    blob: finalBlob,
    blobUrl,
    width: canvas.width,
    height: canvas.height,
    newSizeBytes,
    newSizeStr,
    savingsPercent,
    formatName,
    mimeType
  };
}
