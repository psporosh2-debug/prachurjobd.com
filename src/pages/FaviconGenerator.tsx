import React, { useState, useRef, useEffect, useCallback } from "react";
import { Download, Palette, Upload, RefreshCw, Image as ImageIcon, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useHistory } from "@/hooks/useHistory";
import { sound } from "@/lib/sound";
import { useToast } from "@/hooks/use-toast";
import { VersionBadge } from "@/components/VersionBadge";
import { formatPrachurjoDownloadName } from "@/lib/imageProcessor";

const SIZES = [16, 32, 48, 64, 128, 180, 192, 512];

const FONTS = [
  { label: "Sans", value: "700 {size}px Arial, sans-serif" },
  { label: "Serif", value: "700 {size}px Georgia, serif" },
  { label: "Mono", value: "700 {size}px 'Courier New', monospace" },
  { label: "Display", value: "900 {size}px Impact, sans-serif" },
];

const RADIUS_OPTIONS = [
  { label: "Square", value: 0 },
  { label: "Rounded", value: 20 },
  { label: "Circle", value: 50 },
];

const PRESET_PALETTES = [
  { bg: "#6366f1", fg: "#ffffff" },
  { bg: "#f43f5e", fg: "#ffffff" },
  { bg: "#10b981", fg: "#ffffff" },
  { bg: "#f59e0b", fg: "#000000" },
  { bg: "#3b82f6", fg: "#ffffff" },
  { bg: "#8b5cf6", fg: "#ffffff" },
  { bg: "#0f172a", fg: "#38bdf8" },
  { bg: "#ffffff", fg: "#0f172a" },
];

function drawFaviconToCanvas(
  canvas: HTMLCanvasElement,
  size: number,
  text: string,
  bgColor: string,
  fgColor: string,
  radiusPct: number,
  fontTemplate: string
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = size;
  canvas.height = size;
  ctx.clearRect(0, 0, size, size);

  // Background with radius
  const r = (radiusPct / 100) * (size / 2);
  ctx.beginPath();
  if (r > 0) {
    ctx.roundRect(0, 0, size, size, r);
  } else {
    ctx.rect(0, 0, size, size);
  }
  ctx.fillStyle = bgColor;
  ctx.fill();

  // Text
  const displayText = (text || "N").slice(0, 2).toUpperCase();
  let fontSize = size * 0.52;
  if (displayText.length === 2) fontSize = size * 0.42;
  const font = fontTemplate.replace("{size}", String(Math.round(fontSize)));
  ctx.font = font;
  ctx.fillStyle = fgColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(displayText, size / 2, size / 2 + size * 0.02);
}

async function buildIcoBlob(canvases: HTMLCanvasElement[]): Promise<Blob> {
  // Convert canvases to PNG ArrayBuffers
  const pngArrays: Uint8Array[] = await Promise.all(
    canvases.map(
      (canvas) =>
        new Promise<Uint8Array>((resolve) => {
          canvas.toBlob((blob) => {
            blob!.arrayBuffer().then((ab) => resolve(new Uint8Array(ab)));
          }, "image/png");
        })
    )
  );

  const numImages = pngArrays.length;
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset = headerSize + entrySize * numImages;
  const totalSize = pngArrays.reduce((acc, arr) => acc + arr.length, dataOffset);

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // ICONDIR header
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, numImages, true);

  let offset = dataOffset;
  pngArrays.forEach((png, i) => {
    const sz = canvases[i].width;
    const base = headerSize + i * entrySize;
    view.setUint8(base, sz >= 256 ? 0 : sz);
    view.setUint8(base + 1, sz >= 256 ? 0 : sz);
    view.setUint8(base + 2, 0);
    view.setUint8(base + 3, 0);
    view.setUint16(base + 4, 1, true);
    view.setUint16(base + 6, 32, true);
    view.setUint32(base + 8, png.length, true);
    view.setUint32(base + 12, offset, true);
    uint8.set(png, offset);
    offset += png.length;
  });

  return new Blob([buffer], { type: "image/x-icon" });
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function FaviconGenerator() {
  const [tab, setTab] = useState<"text" | "image">("text");
  const { addHistoryItem } = useHistory();
  const { toast } = useToast();
  const [copiedHtmlSnippet, setCopiedHtmlSnippet] = useState(false);

  const handleCopyHtmlSnippet = () => {
    const htmlCode = `<link rel="icon" type="image/x-icon" href="/favicon.ico">\n<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png">`;
    sound.copy();
    navigator.clipboard.writeText(htmlCode);
    setCopiedHtmlSnippet(true);
    toast({
      title: "Favicon HTML Snippet Copied!",
      description: "Paste it directly into the <head> of your website.",
    });
    setTimeout(() => setCopiedHtmlSnippet(false), 2000);
  };

  // Text favicon state
  const [faviconText, setFaviconText] = useState("N");
  const [bgColor, setBgColor] = useState("#6366f1");
  const [fgColor, setFgColor] = useState("#ffffff");
  const [radiusPct, setRadiusPct] = useState(20);
  const [fontIndex, setFontIndex] = useState(0);

  // Upload state
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [uploadName, setUploadName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview canvases
  const previewCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const redrawAll = useCallback(() => {
    SIZES.forEach((size, idx) => {
      const canvas = previewCanvasRefs.current[idx];
      if (!canvas) return;
      if (tab === "text") {
        drawFaviconToCanvas(canvas, size, faviconText, bgColor, fgColor, radiusPct, FONTS[fontIndex].value);
      } else if (uploadedImage) {
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, size, size);
        // Crop center square
        const s = Math.min(uploadedImage.naturalWidth, uploadedImage.naturalHeight);
        const sx = (uploadedImage.naturalWidth - s) / 2;
        const sy = (uploadedImage.naturalHeight - s) / 2;
        ctx.drawImage(uploadedImage, sx, sy, s, s, 0, 0, size, size);
      }
    });
  }, [tab, faviconText, bgColor, fgColor, radiusPct, fontIndex, uploadedImage]);

  useEffect(() => { redrawAll(); }, [redrawAll]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadName(file.name);
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setUploadedImage(img);
    };
    img.src = objectUrl;
    e.target.value = "";
  };

  const downloadPng = (size: number) => {
    sound.download();
    const idx = SIZES.indexOf(size);
    const canvas = previewCanvasRefs.current[idx];
    if (!canvas) return;
    canvas.toBlob((blob) => { if (blob) saveBlob(blob, formatPrachurjoDownloadName(`favicon-${size}x${size}`, "png")); }, "image/png");
  };

  const downloadIco = async () => {
    sound.download();
    const icoSizes = [16, 32, 48];
    const canvases: HTMLCanvasElement[] = [];
    icoSizes.forEach((sz) => {
      const c = document.createElement("canvas");
      if (tab === "text") {
        drawFaviconToCanvas(c, sz, faviconText, bgColor, fgColor, radiusPct, FONTS[fontIndex].value);
      } else if (uploadedImage) {
        c.width = sz; c.height = sz;
        const ctx = c.getContext("2d")!;
        const s = Math.min(uploadedImage.naturalWidth, uploadedImage.naturalHeight);
        const sx = (uploadedImage.naturalWidth - s) / 2;
        const sy = (uploadedImage.naturalHeight - s) / 2;
        ctx.drawImage(uploadedImage, sx, sy, s, s, 0, 0, sz, sz);
      }
      canvases.push(c);
    });
    const blob = await buildIcoBlob(canvases);
    saveBlob(blob, formatPrachurjoDownloadName("favicon", "ico"));
  };

  const downloadAll = async () => {
    sound.download();
    // Download each PNG size + ico
    for (const size of SIZES) await new Promise<void>((res) => {
      const idx = SIZES.indexOf(size);
      const canvas = previewCanvasRefs.current[idx];
      if (!canvas) { res(); return; }
      canvas.toBlob((blob) => {
        if (blob) saveBlob(blob, formatPrachurjoDownloadName(`favicon-${size}x${size}`, "png"));
        setTimeout(res, 80);
      }, "image/png");
    });
    await downloadIco();
    
    addHistoryItem({
      type: 'favicon',
      title: tab === "text" ? `Favicon (Text: ${faviconText})` : `Favicon (Image)`,
      description: 'Downloaded all favicon formats and sizes'
    });
  };

  const isReady = tab === "text" ? faviconText.trim().length > 0 : uploadedImage !== null;

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Favicon Generator</h1>
          <p className="text-muted-foreground">
            Create pixel-perfect favicons from text or images. Download as PNG (all sizes) + .ico — ready to drop into any website.
          </p>
        </div>
        <VersionBadge />
      </div>

      {/* Tab switcher */}
      <div className="inline-flex rounded-lg border bg-muted/30 p-1 gap-1">
        {(["text", "image"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "text" ? "✏️ Text Favicon" : "🖼️ Upload Image"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Left: Controls ─── */}
        <div className="bg-card border rounded-xl p-6 space-y-6">
          <AnimatePresence mode="wait">
            {tab === "text" ? (
              <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                {/* Text input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Favicon Text (1–2 characters)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={faviconText}
                    onChange={(e) => setFaviconText(e.target.value)}
                    placeholder="N"
                    className="w-full px-4 py-3 rounded-lg bg-background border text-2xl font-bold tracking-widest text-center outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                  <p className="text-xs text-muted-foreground">Best results with 1–2 letters. Will be auto-uppercased.</p>
                </div>

                {/* Color pickers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Background</label>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                      <span className="font-mono text-sm text-muted-foreground">{bgColor.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Text Color</label>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                      <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                      <span className="font-mono text-sm text-muted-foreground">{fgColor.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Palette presets */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Palettes</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_PALETTES.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => { setBgColor(p.bg); setFgColor(p.fg); }}
                        className="w-9 h-9 rounded-lg border-2 transition-transform hover:scale-110 active:scale-95"
                        style={{ background: p.bg, borderColor: bgColor === p.bg ? p.fg : "transparent" }}
                        title={`${p.bg} / ${p.fg}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Font */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Font Style</label>
                  <div className="grid grid-cols-4 gap-2">
                    {FONTS.map((f, i) => (
                      <button key={i} onClick={() => setFontIndex(i)}
                        className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                          fontIndex === i ? "border-primary bg-primary/10 text-primary" : "bg-background hover:border-primary/40"
                        }`}
                        style={{ fontFamily: f.value.split(" ").slice(2).join(" ").replace("{size}px", "") }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Shape</label>
                  <div className="grid grid-cols-3 gap-2">
                    {RADIUS_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => setRadiusPct(opt.value)}
                        className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                          radiusPct === opt.value ? "border-primary bg-primary/10 text-primary" : "bg-background hover:border-primary/40"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div
                  className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith("image/")) {
                      const dt = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleFileUpload(dt);
                    }
                  }}
                >
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Drop an image here or click to upload</p>
                    <p className="text-sm text-muted-foreground mt-1">PNG, JPG, SVG, WebP — square images work best</p>
                  </div>
                  {uploadName && (
                    <p className="text-sm text-primary font-medium truncate max-w-full">✓ {uploadName}</p>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

                {uploadedImage && (
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border">
                    <img
                      src={uploadedImage.src}
                      alt="Uploaded"
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                    <div>
                      <p className="font-medium text-sm">{uploadName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadedImage.naturalWidth} × {uploadedImage.naturalHeight}px
                        {uploadedImage.naturalWidth !== uploadedImage.naturalHeight && " — will be center-cropped to square"}
                      </p>
                      <button onClick={() => { setUploadedImage(null); setUploadName(""); }}
                        className="text-xs text-destructive hover:underline mt-2 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Replace image
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Right: Preview + Download ─── */}
        <div className="space-y-6">
          {/* Preview grid */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Live Preview</h2>
            <div className="grid grid-cols-4 gap-4">
              {SIZES.map((size, idx) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <div className="flex items-center justify-center rounded-lg bg-muted/30 border w-full aspect-square p-2">
                    <canvas
                      ref={(el) => { previewCanvasRefs.current[idx] = el; }}
                      width={size}
                      height={size}
                      style={{
                        width: Math.min(size, 48),
                        height: Math.min(size, 48),
                        imageRendering: size <= 32 ? "pixelated" : "auto",
                      }}
                      className="rounded"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{size}px</span>
                </div>
              ))}
            </div>

            {/* Dark/light background toggle preview */}
            <div className="flex gap-3 mt-2">
              {["#ffffff", "#1a1a2e", "#f0f0f0"].map((bg, i) => {
                const labels = ["Light", "Dark", "Gray"];
                const idx0 = SIZES.indexOf(32);
                return (
                  <div key={bg} className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-lg border flex items-center justify-center" style={{ background: bg }}>
                      <canvas
                        ref={(el) => { if (el && previewCanvasRefs.current[idx0]) {
                          el.width = 32; el.height = 32;
                          const ctx = el.getContext("2d");
                          const src = previewCanvasRefs.current[idx0];
                          if (ctx && src) ctx.drawImage(src, 0, 0, 32, 32);
                        }}}
                        width={32} height={32}
                        style={{ width: 28, height: 28 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{labels[i]}</span>
                  </div>
                );
              })}
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-lg border flex items-center justify-center bg-muted/20">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Browser Tab</span>
              </div>
            </div>
          </div>

          {/* Download section */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Download</h2>

            {/* ICO + All */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadIco}
                disabled={!isReady}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <Download className="w-5 h-5 text-primary" />
                <div className="text-center">
                  <p className="font-semibold text-sm">favicon.ico</p>
                  <p className="text-xs text-muted-foreground">16 + 32 + 48px</p>
                </div>
              </button>
              <button
                onClick={downloadAll}
                disabled={!isReady}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/60 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <Download className="w-5 h-5 text-emerald-500" />
                <div className="text-center">
                  <p className="font-semibold text-sm text-emerald-500">Download All</p>
                  <p className="text-xs text-muted-foreground">All 8 sizes + .ico</p>
                </div>
              </button>
            </div>

            {/* Individual sizes */}
            <div className="grid grid-cols-4 gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => downloadPng(size)}
                  disabled={!isReady}
                  className="py-2 px-2 rounded-lg border bg-background text-xs font-mono hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50 disabled:pointer-events-none transition-colors flex flex-col items-center gap-0.5"
                >
                  <Download className="w-3 h-3 text-muted-foreground" />
                  {size}px
                </button>
              ))}
            </div>

            <div className="pt-2 border-t flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground flex-1">
                💡 Put <code className="bg-muted px-1 rounded">favicon.ico</code> in your site root. Add{" "}
                <code className="bg-muted px-1 rounded">{"<link rel=\"apple-touch-icon\" href=\"/favicon-180x180.png\">"}</code> for iOS.
              </p>

              <button
                type="button"
                onClick={handleCopyHtmlSnippet}
                className="px-3 py-2 rounded-lg border bg-background hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedHtmlSnippet ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHtmlSnippet ? "Copied HTML!" : "Copy HTML Snippet"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEO / How-to */}
      <article className="prose prose-invert max-w-none space-y-6 text-sm text-muted-foreground border rounded-xl p-6 bg-card/50">
        <h2 className="text-base font-semibold text-foreground">How to Use the Prachurjo Favicon Generator</h2>
        <ol className="space-y-2 list-decimal list-inside">
          <li>Choose <strong className="text-foreground">Text Favicon</strong> to generate from 1–2 letters, or <strong className="text-foreground">Upload Image</strong> to use your own logo/icon.</li>
          <li>Pick background and text colors using the color pickers or quick palette presets.</li>
          <li>Select font style (Sans, Serif, Mono, Display) and shape (Square, Rounded, Circle).</li>
          <li>Preview your favicon at all sizes — from 16×16 (browser tab) to 512×512 (PWA splash).</li>
          <li>Download <code>favicon.ico</code> for the browser tab, or individual PNGs for specific use cases.</li>
        </ol>

        <h2 className="text-base font-semibold text-foreground">Which Favicon Sizes Do You Need?</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 pr-4 text-foreground font-semibold">Size</th>
                <th className="py-2 pr-4 text-foreground font-semibold">Usage</th>
                <th className="py-2 text-foreground font-semibold">Filename</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["16×16", "Browser tab (default)", "favicon.ico or favicon-16.png"],
                ["32×32", "Browser tab (retina), taskbar", "favicon-32x32.png"],
                ["48×48", "Windows site icons", "favicon-48x48.png"],
                ["180×180", "Apple touch icon (iOS)", "apple-touch-icon.png"],
                ["192×192", "Android home screen", "favicon-192x192.png"],
                ["512×512", "PWA splash screen", "favicon-512x512.png"],
              ].map(([size, usage, file]) => (
                <tr key={size} className="border-b border-border/50">
                  <td className="py-2 pr-4 font-mono">{size}</td>
                  <td className="py-2 pr-4">{usage}</td>
                  <td className="py-2 font-mono text-primary">{file}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
