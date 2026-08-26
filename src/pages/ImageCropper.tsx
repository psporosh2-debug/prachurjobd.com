import React, { useState, useRef, useCallback, useEffect } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { 
  Upload, 
  Crop, 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Sparkles, 
  RefreshCw, 
  X, 
  Check, 
  Copy, 
  FlipHorizontal, 
  FlipVertical, 
  Layers, 
  Image as ImageIcon,
  CheckCircle2,
  Sliders,
  Ratio
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import getCroppedImg, { FlipState } from "@/lib/cropImage";
import { formatPrachurjoDownloadName } from "@/lib/imageProcessor";
import { useHistory } from "@/hooks/useHistory";
import { sound } from "@/lib/sound";
import { useToast } from "@/hooks/use-toast";

interface AspectRatioOption {
  label: string;
  sublabel: string;
  value: number | undefined; // undefined = free
  iconName?: string;
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: "Free", sublabel: "Custom", value: undefined },
  { label: "1:1", sublabel: "Square / DP", value: 1 / 1 },
  { label: "4:3", sublabel: "Standard", value: 4 / 3 },
  { label: "16:9", sublabel: "Widescreen / Banner", value: 16 / 9 },
  { label: "9:16", sublabel: "Reels / Stories", value: 9 / 16 },
  { label: "3:2", sublabel: "Classic Photo", value: 3 / 2 },
];

export function ImageCropper() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);

  // Cropper State
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [aspect, setAspect] = useState<number | undefined>(undefined); // default Free
  const [flip, setFlip] = useState<FlipState>({ horizontal: false, vertical: false });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Output format & Quality
  const [outputFormat, setOutputFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
  const [quality, setQuality] = useState<number>(90);

  // Result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [croppedResult, setCroppedResult] = useState<{
    fileUrl: string;
    blob: Blob;
    width: number;
    height: number;
    size: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addHistoryItem } = useHistory();
  const { toast } = useToast();

  // Handle image load to extract dimensions
  const onMediaLoaded = (mediaSize: { width: number; height: number; naturalWidth: number; naturalHeight: number }) => {
    setOriginalDimensions({
      width: mediaSize.naturalWidth || mediaSize.width,
      height: mediaSize.naturalHeight || mediaSize.height,
    });
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      sound.error();
      toast({
        title: "Invalid file",
        description: "Please select an image file (PNG, JPG, WebP, etc.)",
        variant: "destructive",
      });
      return;
    }

    sound.generate();
    setFile(selectedFile);
    setCroppedResult(null);
    setZoom(1);
    setRotation(0);
    setFlip({ horizontal: false, vertical: false });

    // Auto set format matching source
    if (selectedFile.type === "image/jpeg") setOutputFormat("image/jpeg");
    else if (selectedFile.type === "image/webp") setOutputFormat("image/webp");
    else setOutputFormat("image/png");

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  // Clipboard paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const pastedFile = e.clipboardData.files[0];
        if (pastedFile.type.startsWith("image/")) {
          handleFile(pastedFile);
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleCropImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      sound.generate();

      const qualityRatio = Math.max(0.1, Math.min(1.0, quality / 100));
      const cropped = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation,
        flip,
        outputFormat,
        qualityRatio
      );

      setCroppedResult(cropped);
      sound.success();

      // Log history
      if (file) {
        const aspectLabel = ASPECT_RATIOS.find((r) => r.value === aspect)?.label || "Custom";
        addHistoryItem({
          type: "image_crop",
          title: `Cropped ${file.name}`,
          description: `${cropped.width}×${cropped.height} px (${aspectLabel}) • ${(cropped.size / 1024).toFixed(1)} KB`,
        });
      }

      toast({
        title: "Crop Successful!",
        description: `Image cropped to ${cropped.width}×${cropped.height} px`,
      });
    } catch (e: any) {
      console.error(e);
      sound.error();
      toast({
        title: "Crop failed",
        description: e.message || "Failed to crop image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCropped = async () => {
    if (!croppedResult) return;
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ [croppedResult.blob.type]: croppedResult.blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        sound.copy();
        toast({
          title: "Copied to clipboard!",
          description: "You can now paste the cropped image anywhere.",
        });
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error("Clipboard API not supported");
      }
    } catch {
      toast({
        title: "Copy not supported",
        description: "Please use the download button to save your cropped image.",
      });
    }
  };

  const resetAll = () => {
    sound.clear();
    setFile(null);
    setImageSrc(null);
    setCroppedResult(null);
    setOriginalDimensions(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAspect(undefined);
    setFlip({ horizontal: false, vertical: false });
  };

  const rotateLeft = () => {
    sound.click();
    setRotation((prev) => (prev - 90 < -180 ? prev - 90 + 360 : prev - 90));
  };

  const rotateRight = () => {
    sound.click();
    setRotation((prev) => (prev + 90 > 180 ? prev + 90 - 360 : prev + 90));
  };

  const toggleFlipH = () => {
    sound.click();
    setFlip((prev) => ({ ...prev, horizontal: !prev.horizontal }));
  };

  const toggleFlipV = () => {
    sound.click();
    setFlip((prev) => ({ ...prev, vertical: !prev.vertical }));
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getExtension = () => {
    if (outputFormat === "image/jpeg") return "jpg";
    if (outputFormat === "image/webp") return "webp";
    return "png";
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Crop className="w-3.5 h-3.5" />
          <span>Image Crop & Resize</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          ইমেজ ক্রপ / Image Cropper
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          পছন্দমতো অংশ কেটে নিন (স্কয়ার বা ফ্রি-ফর্ম)। Crop, zoom, rotate, and export high-res images in seconds.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!imageSrc ? (
          /* Upload State */
          <motion.div
            key="upload"
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
              accept="image/png, image/jpeg, image/webp, image/gif, image/bmp, image/avif"
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
                Drop your image here or click to browse
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Supports PNG, JPG, WebP, AVIF, BMP • Paste screenshots directly (Ctrl+V)
              </p>
            </div>

            {/* Quick aspect badges */}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {["Free Crop", "1:1 Square", "4:3 Standard", "16:9 Widescreen", "9:16 Story", "Rotate & Flip"].map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium bg-muted px-2.5 py-1 rounded-md text-muted-foreground border border-border/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Cropper Workspace */
          <motion.div
            key="cropper"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
              {/* Interactive Cropper Area */}
              <div className="bg-card border rounded-2xl overflow-hidden shadow-xs flex flex-col">
                {/* Header Toolbar */}
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Crop className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-sm truncate">{file?.name || "Image Crop Workspace"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {file && <span>{formatBytes(file.size)}</span>}
                        {originalDimensions && (
                          <>
                            <span>•</span>
                            <span>{originalDimensions.width} × {originalDimensions.height} px</span>
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

                {/* React Easy Crop Canvas */}
                <div className="relative w-full h-[420px] sm:h-[480px] bg-black/90 overflow-hidden select-none">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={aspect}
                    transform={[
                      `translate(${crop.x}px, ${crop.y}px)`,
                      `rotate(${rotation}deg)`,
                      `scale(${flip.horizontal ? -1 : 1}, ${flip.vertical ? -1 : 1})`,
                      `scale(${zoom})`,
                    ].join(" ")}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onMediaLoaded={onMediaLoaded}
                    showGrid={true}
                    classes={{
                      containerClassName: "cropper-container",
                      cropAreaClassName: "border-2 border-emerald-400 shadow-2xl",
                    }}
                  />

                  {/* Interactive Floating Quick Actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 z-10">
                    <button
                      onClick={rotateLeft}
                      className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                      title="Rotate 90° Left"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={rotateRight}
                      className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                      title="Rotate 90° Right"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <div className="w-[1px] h-4 bg-white/20 mx-0.5" />
                    <button
                      onClick={toggleFlipH}
                      className={`p-1.5 rounded-lg transition-colors ${
                        flip.horizontal ? "bg-emerald-500 text-white" : "hover:bg-white/20 text-white"
                      }`}
                      title="Flip Horizontal"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>
                    <button
                      onClick={toggleFlipV}
                      className={`p-1.5 rounded-lg transition-colors ${
                        flip.vertical ? "bg-emerald-500 text-white" : "hover:bg-white/20 text-white"
                      }`}
                      title="Flip Vertical"
                    >
                      <FlipVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Live Cropped Dimensions Overlay */}
                  {croppedAreaPixels && (
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-xs font-mono font-medium z-10 flex items-center gap-2">
                      <Ratio className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{Math.round(croppedAreaPixels.width)} × {Math.round(croppedAreaPixels.height)} px</span>
                    </div>
                  )}
                </div>

                {/* Bottom Quick Bar */}
                <div className="p-3 bg-muted/20 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Drag handles or move image to adjust crop window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCrop({ x: 0, y: 0 });
                        setZoom(1);
                        setRotation(0);
                        setFlip({ horizontal: false, vertical: false });
                        sound.click();
                      }}
                      className="hover:text-foreground underline underline-offset-2"
                    >
                      Reset Transformations
                    </button>
                  </div>
                </div>
              </div>

              {/* Controls Section */}
              <div className="bg-card border rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-6">
                <div className="flex items-center justify-between border-b pb-3.5">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <Sliders className="w-5 h-5 text-emerald-500" />
                    <span>Crop Settings</span>
                  </div>
                  <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-semibold">
                    {ASPECT_RATIOS.find((r) => r.value === aspect)?.label || "Custom"}
                  </span>
                </div>

                {/* Aspect Ratio Selector (Free, 1:1, 4:3, 16:9, etc.) */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIOS.map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          sound.click();
                          setAspect(opt.value);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          aspect === opt.value
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-xs font-bold"
                            : "bg-muted/40 hover:bg-muted text-foreground border-border"
                        }`}
                      >
                        <span className="text-xs leading-tight">{opt.label}</span>
                        <span className={`text-[10px] truncate ${aspect === opt.value ? "text-emerald-100" : "text-muted-foreground"}`}>
                          {opt.sublabel}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom Control */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <label className="text-foreground flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Zoom:</span>
                    </label>
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground font-bold">
                      {zoom.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
                      className="p-1.5 rounded-lg border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-2 bg-muted rounded-lg"
                    />
                    <button
                      onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                      className="p-1.5 rounded-lg border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Rotation Control */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <label className="text-foreground flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Rotation:</span>
                    </label>
                    <span className="font-mono bg-muted px-2 py-0.5 rounded text-foreground font-bold">
                      {rotation}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-muted rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>-180°</span>
                    <span>0°</span>
                    <span>+180°</span>
                  </div>
                </div>

                {/* Format & Quality Settings */}
                <div className="space-y-3 pt-2 border-t">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                    Export Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "PNG", val: "image/png" as const },
                      { label: "JPG", val: "image/jpeg" as const },
                      { label: "WebP", val: "image/webp" as const },
                    ].map((fmt) => (
                      <button
                        key={fmt.val}
                        type="button"
                        onClick={() => {
                          sound.click();
                          setOutputFormat(fmt.val);
                        }}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          outputFormat === fmt.val
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-muted/40 text-muted-foreground hover:text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>

                  {outputFormat !== "image/png" && (
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Quality:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{quality}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-muted rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Main Action Button (ক্রপ করুন / Crop Image) */}
                <div className="pt-3 space-y-2 mt-auto">
                  <button
                    onClick={handleCropImage}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Crop className="w-5 h-5" />
                    )}
                    <span>ক্রপ করুন / Crop Image</span>
                  </button>

                  <button
                    onClick={resetAll}
                    type="button"
                    className="w-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground py-2.5 rounded-xl font-medium transition-colors text-xs"
                  >
                    Choose Another Image
                  </button>
                </div>
              </div>
            </div>

            {/* Cropped Output Result Section */}
            {croppedResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border rounded-2xl p-6 shadow-md space-y-6"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground">Cropped Image Result</h3>
                      <p className="text-xs text-muted-foreground">High resolution cropped output ready to export</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCropped}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-muted/40 hover:bg-muted text-xs font-medium text-foreground transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied!" : "Copy Image"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 items-center">
                  {/* Image Preview Box */}
                  <div className="bg-black/5 dark:bg-black/20 p-4 rounded-xl border flex items-center justify-center min-h-[260px] max-h-[400px] overflow-hidden checkerboard-bg">
                    <img
                      src={croppedResult.fileUrl}
                      alt="Cropped Output"
                      className="max-w-full max-h-[360px] object-contain rounded-lg shadow-md border"
                    />
                  </div>

                  {/* Summary & Download Column */}
                  <div className="space-y-4 flex flex-col justify-between h-full">
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-muted/30 border space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Output Resolution
                        </span>
                        <span className="text-base font-extrabold text-foreground font-mono block">
                          {croppedResult.width} × {croppedResult.height} px
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/30 border space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                          File Size & Format
                        </span>
                        <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block">
                          {formatBytes(croppedResult.size)} ({getExtension().toUpperCase()})
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <a
                        href={croppedResult.fileUrl}
                        download={formatPrachurjoDownloadName(file?.name || "image", "cropped", getExtension())}
                        onClick={() => sound.download()}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm text-center cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Cropped Image</span>
                      </a>

                      <button
                        onClick={handleCopyCropped}
                        type="button"
                        className="w-full sm:hidden border bg-muted/40 hover:bg-muted text-foreground py-2.5 rounded-xl font-medium transition-colors text-xs flex items-center justify-center gap-2"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "Copied to Clipboard" : "Copy Image"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature & FAQ Guide */}
      <div className="border rounded-2xl p-6 sm:p-8 bg-card/40 space-y-6">
        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span>Why Use Prachurjo In-Browser Image Cropper?</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Zero cloud uploads. Fast, private, client-side precision cropping with pixel-perfect resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border bg-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              1:1
            </div>
            <h4 className="font-semibold text-sm text-foreground">Social DP & Avatars</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Crop profile pictures to 1:1 squares for YouTube, Instagram, Facebook, and Twitter.
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
              16:9
            </div>
            <h4 className="font-semibold text-sm text-foreground">Thumbnails & Banners</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Cut widescreen covers, YouTube 1080p thumbnails, blog headers, and presentation slides.
            </p>
          </div>

          <div className="p-4 rounded-xl border bg-card space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
              9:16
            </div>
            <h4 className="font-semibold text-sm text-foreground">Reels & Shorts</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Easily frame vertical portraits for TikTok, YouTube Shorts, and Instagram Stories.
            </p>
          </div>
        </div>
      </div>

      {/* Checkerboard Pattern for Alpha Channel */}
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

export default ImageCropper;
