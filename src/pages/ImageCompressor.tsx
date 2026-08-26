import React, { useState, useRef, useCallback } from "react";
import { 
  Upload, 
  FileImage, 
  Download, 
  RefreshCw, 
  X, 
  Sliders, 
  Sparkles,
  CheckCircle2,
  Zap,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useHistory } from "@/hooks/useHistory";
import { sound } from "@/lib/sound";
import { useToast } from "@/hooks/use-toast";
import { useTaskProgress } from "@/context/TaskProgressContext";
import { TaskProgressCard } from "@/components/TaskProgressCard";
import { SeoContentImage } from "@/components/seo/SeoContentImage";
import { convertImage, formatPrachurjoDownloadName, ImageWatermarkOptions } from "@/lib/imageProcessor";
import { VersionBadge } from "@/components/VersionBadge";
import { Type, Shield } from "lucide-react";

interface CompressedImageResult {
  originalSize: number;
  compressedSize: number;
  dataUrl: string;
  width: number;
  height: number;
  mimeType: string;
  extension: string;
}

export function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [origDimensions, setOrigDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Controls
  const [quality, setQuality] = useState<number>(80);
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [outputFormat, setOutputFormat] = useState<"auto" | "image/jpeg" | "image/webp" | "image/png">("auto");
  
  // Watermark Settings
  const [enableWatermark, setEnableWatermark] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>("prachurjo");
  const [watermarkPos, setWatermarkPos] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'>("bottom-right");
  const [watermarkStyle, setWatermarkStyle] = useState<'badge' | 'shadow' | 'clean'>("badge");
  
  // States
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState<{
    progress: number;
    subtitle: string;
    stepMessage: string;
  } | null>(null);
  const [result, setResult] = useState<CompressedImageResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
      title: "Compressed Image Data Copied!",
      description: "Data URL has been copied to your clipboard.",
    });
    setTimeout(() => setCopiedDataUrl(false), 2000);
  };

  const compressImage = useCallback(
    async (
      sourceDataUrl: string,
      sourceFile: File,
      targetQuality: number,
      targetScale: number,
      targetFormat: "auto" | "image/jpeg" | "image/webp" | "image/png",
      watermarkOpts?: {
        enabled: boolean;
        text: string;
        position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
        style: 'badge' | 'shadow' | 'clean';
      }
    ) => {
      setIsCompressing(true);
      setErrorMsg(null);

      const wmConfig = watermarkOpts !== undefined ? watermarkOpts : {
        enabled: enableWatermark,
        text: watermarkText,
        position: watermarkPos,
        style: watermarkStyle
      };

      const taskTitle = `Compressing ${sourceFile.name}`;
      const taskId = startTask({
        title: taskTitle,
        subtitle: `Optimizing image at ${targetQuality}% quality...`,
        category: "compression",
        initialProgress: 20,
      });

      setCompressProgress({
        progress: 20,
        subtitle: "Initializing canvas buffer...",
        stepMessage: "Step 1/3: Reading image pixels",
      });

      try {
        let fmtKey: "jpeg" | "webp" | "png" = "jpeg";
        if (targetFormat !== "auto") {
          fmtKey = targetFormat === "image/webp" ? "webp" : targetFormat === "image/png" ? "png" : "jpeg";
        } else if (sourceFile.type === "image/png") {
          fmtKey = "webp";
        } else if (sourceFile.type === "image/webp") {
          fmtKey = "webp";
        } else {
          fmtKey = "jpeg";
        }

        const qualityRatio = Math.min(Math.max(targetQuality / 100, 0.05), 1.0);

        updateTask(taskId, {
          progress: 55,
          subtitle: `Encoding pixels to ${fmtKey.toUpperCase()} buffer...`,
          stepMessage: "Step 2/3: Applying quality & scale matrix",
        });
        setCompressProgress({
          progress: 55,
          subtitle: `Encoding pixels to ${fmtKey.toUpperCase()} buffer...`,
          stepMessage: "Step 2/3: Applying compression matrix",
        });

        const convRes = await convertImage({
          source: sourceFile || sourceDataUrl,
          targetFormat: fmtKey,
          quality: qualityRatio,
          scalePercent: targetScale,
          watermark: wmConfig.enabled ? {
            enabled: true,
            text: wmConfig.text || "prachurjo",
            position: wmConfig.position,
            style: wmConfig.style,
            opacity: 0.85
          } : undefined,
          fallbackOriginalSize: sourceFile?.size
        });

        setOrigDimensions({ width: convRes.width, height: convRes.height });

        updateTask(taskId, {
          progress: 92,
          subtitle: `Analyzing savings: ${(sourceFile.size / 1024).toFixed(1)} KB → ${(convRes.newSizeBytes / 1024).toFixed(1)} KB...`,
          stepMessage: "Step 3/3: Finalizing metadata & savings",
        });
        setCompressProgress({
          progress: 92,
          subtitle: `Analyzing savings: ${(sourceFile.size / 1024).toFixed(1)} KB → ${(convRes.newSizeBytes / 1024).toFixed(1)} KB...`,
          stepMessage: "Step 3/3: Finalizing metadata",
        });

        const extension = fmtKey === "webp" ? "webp" : fmtKey === "png" ? "png" : "jpg";
        const mimeType = fmtKey === "webp" ? "image/webp" : fmtKey === "png" ? "image/png" : "image/jpeg";

        const resObj: CompressedImageResult = {
          originalSize: sourceFile.size,
          compressedSize: convRes.newSizeBytes,
          dataUrl: convRes.dataUrl,
          width: convRes.width,
          height: convRes.height,
          mimeType,
          extension,
        };

        setResult(resObj);
        sound.success();

        const savedPct = Math.round(((sourceFile.size - convRes.newSizeBytes) / sourceFile.size) * 100);
        completeTask(taskId, `Saved ${savedPct > 0 ? `${savedPct}%` : 'optimized'} (${(convRes.newSizeBytes / 1024).toFixed(1)} KB)`);

        setCompressProgress({
          progress: 100,
          subtitle: `Finished! Reduced by ${savedPct > 0 ? `${savedPct}%` : '0%'}`,
          stepMessage: "Compression Complete",
        });

        // Add history log
        addHistoryItem({
          type: "image_compress",
          title: `Compressed ${sourceFile.name}`,
          description: `Original: ${(sourceFile.size / 1024).toFixed(1)} KB → Output: ${(convRes.newSizeBytes / 1024).toFixed(1)} KB (${savedPct}% saved)`,
        });
      } catch (err: any) {
        sound.error();
        console.error("Compression error:", err);
        setErrorMsg(err.message || "Failed to compress image.");
        failTask(taskId, err.message || "Failed to compress image.");
      } finally {
        setIsCompressing(false);
        setTimeout(() => setCompressProgress(null), 2500);
      }
    },
    [addHistoryItem, startTask, updateTask, completeTask, failTask]
  );

  const handleFileSelect = (selectedFile: File) => {
    // 10MB limit check
    if (selectedFile.size > 10 * 1024 * 1024) {
      sound.error();
      setErrorMsg("File is too large! Maximum allowed size is 10MB.");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      sound.error();
      setErrorMsg("Please select a valid image file.");
      return;
    }

    sound.generate();
    setErrorMsg(null);
    setResult(null);
    setFile(selectedFile);

    const previewUrl = URL.createObjectURL(selectedFile);
    setPreview(previewUrl);
    compressImage(previewUrl, selectedFile, quality, scalePercent, outputFormat);
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (preview && file) {
      compressImage(preview, file, newQuality, scalePercent, outputFormat);
    }
  };

  const handleScaleChange = (newScale: number) => {
    setScalePercent(newScale);
    if (preview && file) {
      compressImage(preview, file, quality, newScale, outputFormat);
    }
  };

  const handleFormatChange = (newFmt: "auto" | "image/jpeg" | "image/webp" | "image/png") => {
    setOutputFormat(newFmt);
    if (preview && file) {
      compressImage(preview, file, quality, scalePercent, newFmt);
    }
  };

  const triggerManualCompress = () => {
    sound.generate();
    if (preview && file) {
      compressImage(preview, file, quality, scalePercent, outputFormat);
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
    setOrigDimensions(null);
    setErrorMsg(null);
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

  const calculateSavings = (orig: number, curr: number) => {
    if (orig <= 0) return 0;
    const diff = orig - curr;
    return Math.round((diff / orig) * 100);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto relative">
      {/* Header Section */}
      <div className="space-y-2 text-center sm:text-left relative">
        <div className="absolute top-0 right-0">
          <VersionBadge />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5" />
          <span>Image Compressor</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Image Compressor & Optimizer
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Reduce image file sizes instantly while preserving visual quality (Max 10MB).
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!file ? (
          /* Upload State */
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 transition-all cursor-pointer min-h-[320px] bg-card/60 backdrop-blur-xs ${
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
                handleFileSelect(e.dataTransfer.files[0]);
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
              accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
                e.target.value = "";
              }}
            />

            <div className={`p-4 rounded-2xl transition-transform ${
              isDragging ? "bg-emerald-500 text-white scale-110" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}>
              <Upload className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Upload Image (Max 10MB)
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Drag and drop your image here, or click to browse files
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {["JPG", "PNG", "WEBP", "GIF", "MAX 10MB"].map((badge) => (
                <span
                  key={badge}
                  className="text-[11px] font-medium font-mono bg-muted px-2.5 py-1 rounded-md text-muted-foreground border border-border/50"
                >
                  {badge}
                </span>
              ))}
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium max-w-md">
                {errorMsg}
              </div>
            )}
          </motion.div>
        ) : (
          /* Compressor & Editor State */
          <motion.div
            key="compressor-workspace"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start"
          >
            {/* Left Preview & Dynamic Comparison Card */}
            <div className="bg-card border rounded-2xl overflow-hidden shadow-xs flex flex-col">
              {/* Card Header */}
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-sm truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Original Size: {formatBytes(file.size)}</span>
                      {origDimensions && (
                        <>
                          <span>•</span>
                          <span>{origDimensions.width} × {origDimensions.height} px</span>
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
              <div className="p-6 flex flex-col items-center justify-center min-h-[340px] bg-black/5 dark:bg-black/20 relative overflow-hidden checkerboard-pattern">
                {compressProgress && (
                  <div className="w-full max-w-md my-4">
                    <TaskProgressCard
                      progress={compressProgress.progress}
                      title={file.name}
                      subtitle={compressProgress.subtitle}
                      stepMessage={compressProgress.stepMessage}
                      status={compressProgress.progress === 100 ? "completed" : "running"}
                      accentColor="emerald"
                    />
                  </div>
                )}

                {isCompressing && !result && !compressProgress ? (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                    <span className="text-sm font-medium">Compressing and processing image...</span>
                  </div>
                ) : errorMsg ? (
                  <div className="text-center p-6 text-destructive space-y-2">
                    <p className="font-medium text-sm">{errorMsg}</p>
                    <button
                      onClick={resetAll}
                      className="text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      Upload another image
                    </button>
                  </div>
                ) : (
                  <img
                    src={result ? result.dataUrl : preview!}
                    alt="Compressed result preview"
                    className="max-w-full max-h-[420px] object-contain rounded-xl shadow-md border"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Dynamic Before & After Metrics Bar */}
              {result && (
                <div className="p-4 sm:p-5 border-t bg-muted/20 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Before Size */}
                    <div className="p-3 rounded-xl bg-card border">
                      <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Original Size
                      </span>
                      <span className="text-base font-extrabold text-foreground font-mono mt-0.5 block">
                        {formatBytes(result.originalSize)}
                      </span>
                    </div>

                    {/* After Size */}
                    <div className="p-3 rounded-xl bg-card border">
                      <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Compressed Size
                      </span>
                      <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                        {formatBytes(result.compressedSize)}
                      </span>
                    </div>

                    {/* Savings Percentage */}
                    <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-card border flex items-center justify-between sm:flex-col sm:items-start">
                      <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider block">
                        Total Saved
                      </span>
                      {result.compressedSize < result.originalSize ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold text-base font-mono">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>-{calculateSavings(result.originalSize, result.compressedSize)}%</span>
                        </div>
                      ) : (
                        <span className="text-amber-500 font-semibold text-xs mt-0.5 block">
                          Close to original
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons: Download + Copy */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <a
                      href={result.dataUrl}
                      onClick={() => sound.download()}
                      download={formatPrachurjoDownloadName(file.name, "compressed", result.extension)}
                      className="flex-1 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm sm:text-base text-center"
                    >
                      <Download className="w-5 h-5" />
                      <span>Download Compressed Image</span>
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

            {/* Right Compression Controls Panel */}
            <div className="bg-card border rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-6">
              <div className="flex items-center justify-between border-b pb-3.5">
                <div className="flex items-center gap-2 text-base font-bold">
                  <Sliders className="w-5 h-5 text-emerald-500" />
                  <span>Compression Settings</span>
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
                          compressImage(preview, file, quality, scalePercent, outputFormat, {
                            enabled: val,
                            text: watermarkText,
                            position: watermarkPos,
                            style: watermarkStyle
                          });
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
                              compressImage(preview, file, quality, scalePercent, outputFormat, {
                                enabled: true,
                                text: val,
                                position: watermarkPos,
                                style: watermarkStyle
                              });
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
                                compressImage(preview, file, quality, scalePercent, outputFormat, {
                                  enabled: true,
                                  text: watermarkText,
                                  position: pos,
                                  style: watermarkStyle
                                });
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
                                compressImage(preview, file, quality, scalePercent, outputFormat, {
                                  enabled: true,
                                  text: watermarkText,
                                  position: watermarkPos,
                                  style: st
                                });
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

                {/* Quality Slider (10 - 100) */}
                <div className="space-y-2">
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
                    <span>10% (Smallest)</span>
                    <span>50%</span>
                    <span>100% (Best Quality)</span>
                  </div>
                </div>

                {/* Resize / Scale Slider (10% - 100%) */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <label className="text-foreground">Resize Scale:</label>
                    <span className="font-mono bg-muted text-foreground px-2 py-0.5 rounded-md font-bold">
                      {scalePercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={scalePercent}
                    onChange={(e) => handleScaleChange(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-muted rounded-lg"
                  />
                  {origDimensions && (
                    <p className="text-[11px] text-muted-foreground">
                      Output Resolution:{" "}
                      <strong className="text-foreground font-mono">
                        {Math.round((origDimensions.width * scalePercent) / 100)} ×{" "}
                        {Math.round((origDimensions.height * scalePercent) / 100)} px
                      </strong>
                    </p>
                  )}
                </div>

                {/* Output Format Picker */}
                <div className="space-y-2 pt-2 border-t">
                  <label className="text-xs font-semibold text-foreground block">
                    Output Format:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "auto", label: "Auto (JPG)" },
                      { id: "image/webp", label: "WebP (Ultra)" },
                      { id: "image/jpeg", label: "JPG" },
                      { id: "image/png", label: "PNG" },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => handleFormatChange(fmt.id as any)}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                          outputFormat === fmt.id
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                            : "bg-muted/60 text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto pt-4 space-y-2.5">
                <button
                  onClick={triggerManualCompress}
                  disabled={isCompressing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {isCompressing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>Re-compress Image</span>
                </button>

                <button
                  onClick={resetAll}
                  type="button"
                  className="w-full bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium transition-colors text-xs"
                >
                  Choose Another Image
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEO & Guide Section */}
      <SeoContentImage />

      {/* Checkerboard CSS */}
      <style>{`
        .checkerboard-pattern {
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

export default ImageCompressor;
