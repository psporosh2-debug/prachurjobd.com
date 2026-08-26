import React, { useState, useRef, useCallback } from "react";
import { 
  Upload, 
  FileImage, 
  Settings2, 
  Download, 
  RefreshCw, 
  X, 
  ChevronDown,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  Check
} from "lucide-react";
import { SeoContentImage } from "@/components/seo/SeoContentImage";
import { motion, AnimatePresence } from "motion/react";
import { useHistory } from "@/hooks/useHistory";
import { sound } from "@/lib/sound";
import { useToast } from "@/hooks/use-toast";
import { useTaskProgress } from "@/context/TaskProgressContext";
import { TaskProgressCard } from "@/components/TaskProgressCard";
import { convertImage, formatPrachurjoDownloadName } from "@/lib/imageProcessor";
import { VersionBadge } from "@/components/VersionBadge";
import { Type, Shield } from "lucide-react";

export type SupportedTargetFormat = "image/jpeg" | "image/png" | "image/webp" | "image/avif" | "image/bmp";

interface FormatOption {
  value: SupportedTargetFormat;
  label: string;
  extension: string;
  hasQuality: boolean;
  tag: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { value: "image/jpeg", label: "JPEG", extension: "jpg", hasQuality: true, tag: "Popular" },
  { value: "image/png", label: "PNG", extension: "png", hasQuality: false, tag: "Lossless" },
  { value: "image/webp", label: "WebP", extension: "webp", hasQuality: true, tag: "Recommended" },
  { value: "image/avif", label: "AVIF", extension: "avif", hasQuality: true, tag: "Next-Gen" },
  { value: "image/bmp", label: "BMP", extension: "bmp", hasQuality: false, tag: "Raw Bitmap" },
];

interface ConvertedResult {
  originalSize: number;
  newSize: number;
  dataUrl: string;
  blobUrl: string;
  formatLabel: string;
  extension: string;
  width: number;
  height: number;
}

// Pure JS BMP generator for universal browser compatibility
function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context missing");
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

  return new Blob([buffer], { type: "image/bmp" });
}

export function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<SupportedTargetFormat>("image/webp");
  const [quality, setQuality] = useState<number>(85);
  
  // Watermark Settings
  const [enableWatermark, setEnableWatermark] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>("prachurjo");
  const [watermarkPos, setWatermarkPos] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'>("bottom-right");
  const [watermarkStyle, setWatermarkStyle] = useState<'badge' | 'shadow' | 'clean'>("badge");

  const [isProcessing, setIsProcessing] = useState(false);
  const [convertProgress, setConvertProgress] = useState<{
    progress: number;
    subtitle: string;
    stepMessage: string;
  } | null>(null);
  const [result, setResult] = useState<ConvertedResult | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedDataUrl, setCopiedDataUrl] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useHistory();
  const { toast } = useToast();
  const { startTask, updateTask, completeTask, failTask } = useTaskProgress();

  const handleCopyDataUrl = () => {
    if (!result?.dataUrl) return;
    sound.copy();
    navigator.clipboard.writeText(result.dataUrl);
    setCopiedDataUrl(true);
    toast({
      title: "Image Data Copied!",
      description: "Converted image Data URL has been copied to your clipboard.",
    });
    setTimeout(() => setCopiedDataUrl(false), 2000);
  };

  const convertImageUsingCanvas = useCallback(
    async (
      sourceDataUrl: string,
      sourceFile: File,
      targetFormat: SupportedTargetFormat,
      targetQuality: number
    ) => {
      setIsProcessing(true);
      setProcessError(null);

      const formatConfig = FORMAT_OPTIONS.find((f) => f.value === targetFormat) || FORMAT_OPTIONS[2];
      const taskTitle = `Converting ${sourceFile?.name || 'Image'} to ${formatConfig.label}`;
      const taskId = startTask({
        title: taskTitle,
        subtitle: `Encoding into ${formatConfig.label} format...`,
        category: "conversion",
        initialProgress: 20,
      });

      setConvertProgress({
        progress: 20,
        subtitle: `Reading image buffer...`,
        stepMessage: "Step 1/3: Reading image bitmap",
      });

      try {
        const fmtKey = targetFormat === "image/jpeg" ? "jpeg"
          : targetFormat === "image/png" ? "png"
          : targetFormat === "image/webp" ? "webp"
          : targetFormat === "image/avif" ? "avif"
          : "bmp";

        const qualityRatio = Math.min(Math.max(targetQuality / 100, 0.1), 1.0);

        updateTask(taskId, {
          progress: 60,
          subtitle: `Transcoding pixel channels into ${formatConfig.label}...`,
          stepMessage: `Step 2/3: Applying ${formatConfig.label} encoder`,
        });
        setConvertProgress({
          progress: 60,
          subtitle: `Transcoding pixel channels into ${formatConfig.label}...`,
          stepMessage: `Step 2/3: Applying ${formatConfig.label} encoder`,
        });

        const convRes = await convertImage({
          source: sourceFile || sourceDataUrl,
          targetFormat: fmtKey,
          quality: qualityRatio,
          watermark: enableWatermark ? {
            enabled: true,
            text: watermarkText || "prachurjo",
            position: watermarkPos,
            style: watermarkStyle,
            opacity: 0.85
          } : undefined,
          fallbackOriginalSize: sourceFile?.size
        });

        const naturalWidth = convRes.width;
        const naturalHeight = convRes.height;
        setDimensions({ width: naturalWidth, height: naturalHeight });

        updateTask(taskId, {
          progress: 90,
          subtitle: `Generating ${formatConfig.extension.toUpperCase()} file blob (${(convRes.newSizeBytes / 1024).toFixed(1)} KB)...`,
          stepMessage: "Step 3/3: Constructing final output",
        });
        setConvertProgress({
          progress: 90,
          subtitle: `Generating ${formatConfig.extension.toUpperCase()} file blob...`,
          stepMessage: "Step 3/3: Constructing final output",
        });

        const converted: ConvertedResult = {
          originalSize: sourceFile ? sourceFile.size : convRes.newSizeBytes * 1.5,
          newSize: convRes.newSizeBytes,
          dataUrl: convRes.dataUrl,
          blobUrl: convRes.blobUrl,
          formatLabel: formatConfig.label,
          extension: formatConfig.extension,
          width: naturalWidth,
          height: naturalHeight,
        };

        setResult(converted);
        sound.success();

        completeTask(taskId, `Converted to ${formatConfig.label} (${(convRes.newSizeBytes / 1024).toFixed(1)} KB)`);
        setConvertProgress({
          progress: 100,
          subtitle: `Done! Converted to ${formatConfig.label}`,
          stepMessage: "Conversion Completed",
        });

        // Track action in history
        addHistoryItem({
          type: "image_conv",
          title: `Converted ${sourceFile?.name || 'Image'} to ${formatConfig.label}`,
          description: `${((sourceFile?.size || convRes.newSizeBytes) / 1024).toFixed(1)} KB → ${(convRes.newSizeBytes / 1024).toFixed(1)} KB (${naturalWidth}x${naturalHeight})`,
        });
      } catch (error: any) {
        console.error("Image conversion error:", error);
        sound.error();
        setProcessError("Failed to convert image. Please try another file.");
        failTask(taskId, error.message || "Failed to convert image.");
      } finally {
        setIsProcessing(false);
        setTimeout(() => setConvertProgress(null), 2500);
      }
    },
    [addHistoryItem, startTask, updateTask, completeTask, failTask]
  );

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      sound.error();
      setProcessError("Please select a valid image file.");
      return;
    }

    sound.generate();
    setFile(selectedFile);
    setResult(null);
    setProcessError(null);

    const previewUrl = URL.createObjectURL(selectedFile);
    setPreview(previewUrl);
    convertImageUsingCanvas(previewUrl, selectedFile, selectedFormat, quality);
  };

  const handleFormatSelectChange = (newFmt: SupportedTargetFormat) => {
    setSelectedFormat(newFmt);
    if (preview && file) {
      convertImageUsingCanvas(preview, file, newFmt, quality);
    }
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (preview && file) {
      convertImageUsingCanvas(preview, file, selectedFormat, newQ);
    }
  };

  const triggerConvert = () => {
    sound.generate();
    if (preview && file) {
      convertImageUsingCanvas(preview, file, selectedFormat, quality);
    }
  };

  const resetAll = () => {
    sound.clear();
    if (preview && preview.startsWith('blob:')) {
      try { URL.revokeObjectURL(preview); } catch {}
    }
    if (result?.dataUrl && result.dataUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(result.dataUrl); } catch {}
    }
    setFile(null);
    setPreview(null);
    setResult(null);
    setDimensions(null);
    setProcessError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const currentOpt = FORMAT_OPTIONS.find((f) => f.value === selectedFormat) || FORMAT_OPTIONS[2];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          <span>Image Format Converter</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Image Format Converter
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Convert PNG, JPG, WebP, AVIF, and BMP images quickly with zero server uploads.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          /* Upload State */
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 transition-all cursor-pointer min-h-[300px] bg-card/60 backdrop-blur-xs ${
              isDragging
                ? "border-emerald-500 bg-emerald-500/5 scale-[1.01]"
                : "border-border hover:border-emerald-500/50 hover:bg-card"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = "";
              fileInputRef.current?.click();
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml, image/bmp, image/avif"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
                e.target.value = "";
              }}
            />
            <div
              className={`p-4 rounded-2xl transition-transform ${
                isDragging
                  ? "bg-emerald-500 text-white scale-110"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <Upload className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Drop your image here
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                or click to browse from your device
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {["JPEG", "PNG", "WebP", "AVIF", "BMP"].map((ext) => (
                <span
                  key={ext}
                  className="text-[11px] font-medium font-mono bg-muted px-2.5 py-1 rounded-md text-muted-foreground border border-border/50"
                >
                  {ext}
                </span>
              ))}
            </div>

            {processError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium max-w-md">
                {processError}
              </div>
            )}
          </motion.div>
        ) : (
          /* Editor & Converter Workspace */
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start"
          >
            {/* Preview & Comparison Section */}
            <div className="bg-card border rounded-2xl overflow-hidden shadow-xs flex flex-col">
              {/* Header */}
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-sm truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatBytes(file.size)}</span>
                      {dimensions && (
                        <>
                          <span>•</span>
                          <span>{dimensions.width} × {dimensions.height} px</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetAll}
                  className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Canvas Preview Area */}
              <div className="p-6 flex flex-col items-center justify-center min-h-[340px] bg-black/5 dark:bg-black/20 relative overflow-hidden checkerboard-bg">
                {convertProgress && (
                  <div className="w-full max-w-md my-4">
                    <TaskProgressCard
                      progress={convertProgress.progress}
                      title={file.name}
                      subtitle={convertProgress.subtitle}
                      stepMessage={convertProgress.stepMessage}
                      status={convertProgress.progress === 100 ? "completed" : "running"}
                      accentColor="teal"
                    />
                  </div>
                )}

                {isProcessing && !result && !convertProgress ? (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                    <span className="text-sm font-medium">Converting image...</span>
                  </div>
                ) : processError ? (
                  <div className="text-center p-6 text-destructive space-y-2">
                    <p className="font-medium text-sm">{processError}</p>
                    <button
                      onClick={resetAll}
                      className="text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      Upload another file
                    </button>
                  </div>
                ) : (
                  <img
                    src={result ? result.dataUrl : preview!}
                    alt="Converted Preview"
                    className="max-w-full max-h-[420px] object-contain rounded-xl shadow-md border"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Dynamic Size & Download Bar */}
              {result && (
                <div className="p-4 sm:p-5 border-t bg-muted/20 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-card border">
                      <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Original Size
                      </span>
                      <span className="text-base font-extrabold text-foreground font-mono mt-0.5 block">
                        {formatBytes(result.originalSize)}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-card border">
                      <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Converted ({result.formatLabel})
                      </span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                        {formatBytes(result.newSize)}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-card border flex items-center justify-between sm:flex-col sm:items-start">
                      <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Output Status
                      </span>
                      {result.newSize < result.originalSize ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>-{Math.round((1 - result.newSize / result.originalSize) * 100)}% Saved</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-medium text-xs mt-0.5">
                          Ready to Download
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: Download + Copy */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <a
                      href={result.blobUrl || result.dataUrl}
                      onClick={() => sound.download()}
                      download={formatPrachurjoDownloadName(file.name, "converted", result.extension)}
                      className="flex-1 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm sm:text-base text-center cursor-pointer"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download {result.formatLabel} Image</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyDataUrl}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl border border-border bg-card hover:bg-muted font-bold text-sm flex items-center justify-center gap-2 transition-all shrink-0"
                    >
                      {copiedDataUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedDataUrl ? "Copied Data URL!" : "Copy Data URL"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Controls Section */}
            <div className="bg-card border rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-6">
              <div className="flex items-center justify-between border-b pb-3.5">
                <div className="flex items-center gap-2 text-base font-bold">
                  <Settings2 className="w-5 h-5 text-emerald-500" />
                  <span>Conversion Settings</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md text-[11px] font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>prachurjo</span>
                </div>
              </div>

              <div className="space-y-5">
                {/* Watermark / Website Stamp Option */}
                <div className="p-3.5 rounded-xl border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                      <Type className="w-4 h-4 text-emerald-500" />
                      <span>Brand Watermark (prachurjo)</span>
                    </label>
                    <input
                      type="checkbox"
                      checked={enableWatermark}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setEnableWatermark(val);
                        if (preview && file) {
                          convertImageUsingCanvas(preview, file, selectedFormat, quality);
                        }
                      }}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                    />
                  </div>

                  {enableWatermark && (
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                          Watermark Text:
                        </label>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWatermarkText(val);
                            if (preview && file) {
                              convertImageUsingCanvas(preview, file, selectedFormat, quality);
                            }
                          }}
                          placeholder="e.g. prachurjo"
                          className="w-full bg-background border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                            Position:
                          </label>
                          <select
                            value={watermarkPos}
                            onChange={(e) => {
                              const pos = e.target.value as any;
                              setWatermarkPos(pos);
                              if (preview && file) {
                                convertImageUsingCanvas(preview, file, selectedFormat, quality);
                              }
                            }}
                            className="w-full bg-background border rounded-lg px-2 py-1.5 text-xs font-semibold"
                          >
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="center">Center</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                            Style:
                          </label>
                          <select
                            value={watermarkStyle}
                            onChange={(e) => {
                              const st = e.target.value as any;
                              setWatermarkStyle(st);
                              if (preview && file) {
                                convertImageUsingCanvas(preview, file, selectedFormat, quality);
                              }
                            }}
                            className="w-full bg-background border rounded-lg px-2 py-1.5 text-xs font-semibold"
                          >
                            <option value="badge">Badge Pill</option>
                            <option value="shadow">Shadow Text</option>
                            <option value="clean">Clean Text</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Format Dropdown Selector (JPEG, PNG, WebP, AVIF, BMP) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Target Format:</span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {currentOpt.tag}
                    </span>
                  </label>

                  <div className="relative">
                    <select
                      value={selectedFormat}
                      onChange={(e) => handleFormatSelectChange(e.target.value as SupportedTargetFormat)}
                      className="w-full appearance-none bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer pr-10"
                    >
                      {FORMAT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} (.{opt.extension}) - {opt.tag}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Grid Format Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground">Quick Select:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {FORMAT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleFormatSelectChange(opt.value)}
                        className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all truncate ${
                          selectedFormat === opt.value
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                            : "bg-muted/50 text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Slider (for lossy formats: JPEG, WebP, AVIF) */}
                {currentOpt.hasQuality ? (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <label className="text-foreground">Quality:</label>
                      <span className="font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-bold">
                        {quality}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={quality}
                      onChange={(e) => handleQualityChange(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-2 bg-muted rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Small Size (10%)</span>
                      <span>Balanced (85%)</span>
                      <span>High Quality (100%)</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-muted/40 border text-xs text-muted-foreground space-y-1">
                    <span className="font-semibold text-foreground block">
                      📌 {currentOpt.label} Lossless Mode
                    </span>
                    <p className="text-[11px]">
                      {currentOpt.label} preserves original pixel quality losslessly.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-auto pt-4 space-y-2.5">
                <button
                  onClick={triggerConvert}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Re-convert Image</span>
                </button>

                {result && (
                  <button
                    onClick={resetAll}
                    type="button"
                    className="w-full bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium transition-colors text-xs"
                  >
                    Choose Another Image
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEO & Format Guide */}
      <SeoContentImage />

      {/* Custom CSS for checkerboard pattern */}
      <style>{`
        .checkerboard-bg {
          background-image: 
            linear-gradient(45deg, rgba(128,128,128,0.08) 25%, transparent 25%), 
            linear-gradient(-45deg, rgba(128,128,128,0.08) 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, rgba(128,128,128,0.08) 75%), 
            linear-gradient(-45deg, transparent 75%, rgba(128,128,128,0.08) 75%);
          background-size: 16px 16px;
          background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
        }
      `}</style>
    </div>
  );
}

export default ImageConverter;
