import { useState, useMemo, useRef } from "react";
import { SeoContentText } from "@/components/seo/SeoContentText";
import { Copy, Trash2, Undo, CheckCircle2, Download, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useHistory } from "@/hooks/useHistory";
import { sound } from "@/lib/sound";
import { VersionBadge } from "@/components/VersionBadge";

type HistoryState = { text: string };

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TextTools() {
  const [text, setText] = useState("");
  const [history, setHistory] = useState<HistoryState[]>([{ text: "" }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Stats
  const stats = useMemo(() => {
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim()
      ? (text.match(/[.!?]+(?=\s|$)/g) || []).length || (text.length > 0 ? 1 : 0)
      : 0;
    const paragraphs = text.trim()
      ? text.split(/\n+/).filter((p) => p.trim().length > 0).length
      : 0;
    const lines = text.split("\n").length;
    return { chars, charsNoSpaces, words, sentences, paragraphs, lines };
  }, [text]);

  const updateText = (newText: string, playSound = false) => {
    if (newText === text) return;
    if (playSound) sound.click();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ text: newText });
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setText(newText);
  };

  const undo = () => {
    if (historyIndex > 0) {
      sound.click();
      setHistoryIndex(historyIndex - 1);
      setText(history[historyIndex - 1].text);
    }
  };

  const clear = () => {
    sound.clear();
    updateText("");
  };

  const { addHistoryItem } = useHistory();
  
  const copy = async () => {
    if (!text) return;
    try {
      sound.copy();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      addHistoryItem({
        type: 'text_tool',
        title: 'Copied Text',
        description: `${text.substring(0, 30)}...`
      });
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  // ─── Download ────────────────────────────────────────────────────────────
  const downloadAs = (format: "txt" | "pdf" | "csv" | "png" | "md" | "html") => {
    if (!text) return;
    sound.download();
    setDownloadOpen(false);
    
    addHistoryItem({
      type: 'text_tool',
      title: `Downloaded Text as ${format.toUpperCase()}`,
      description: `${text.substring(0, 30)}...`
    });

    if (format === "txt") {
      saveBlob(new Blob([text], { type: "text/plain" }), "prachurjo-text.txt");
    } else if (format === "md") {
      saveBlob(new Blob([text], { type: "text/markdown" }), "prachurjo-text.md");
    } else if (format === "csv") {
      const csv = text
        .split("\n")
        .map((line) => `"${line.replace(/"/g, '""')}"`)
        .join("\n");
      saveBlob(new Blob([csv], { type: "text/csv" }), "prachurjo-text.csv");
    } else if (format === "html") {
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Text Export — Prachurjo</title><style>body{font-family:sans-serif;max-width:800px;margin:2rem auto;line-height:1.7;color:#1a1a2e;white-space:pre-wrap;font-size:15px}</style></head><body>${escaped}</body></html>`;
      saveBlob(new Blob([html], { type: "text/html" }), "prachurjo-text.html");
    } else if (format === "pdf") {
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(
          `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Print</title><style>body{font-family:sans-serif;font-size:12pt;line-height:1.7;margin:2cm;white-space:pre-wrap}@media print{body{margin:1cm}}</style></head><body>${escaped}</body></html>`
        );
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 300);
      }
    } else if (format === "png") {
      const lines = text.split("\n");
      const lineHeight = 22;
      const padding = 32;
      const fontSize = 14;
      const canvasWidth = 920;
      const canvasHeight = Math.max(200, lines.length * lineHeight + padding * 2);

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Header bar
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, canvasWidth, 40);
      ctx.fillStyle = "#ef4444";
      ctx.beginPath(); ctx.arc(16, 20, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath(); ctx.arc(32, 20, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#10b981";
      ctx.beginPath(); ctx.arc(48, 20, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#64748b";
      ctx.font = "13px 'Courier New', monospace";
      ctx.textBaseline = "middle";
      ctx.fillText("prachurjo-text.txt", 70, 20);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = `${fontSize}px "Courier New", monospace`;
      ctx.textBaseline = "top";

      lines.forEach((line, i) => {
        ctx.fillText(line, padding, 48 + i * lineHeight);
      });

      canvas.toBlob((blob) => { if (blob) saveBlob(blob, "prachurjo-text.png"); }, "image/png");
    }
  };

  // ─── Transforms ──────────────────────────────────────────────────────────
  const transforms = {
    uppercase:    () => updateText(text.toUpperCase()),
    lowercase:    () => updateText(text.toLowerCase()),
    togglecase:   () => updateText(text.split("").map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join("")),
    titlecase:    () => updateText(text.toLowerCase().replace(/(?:^|\s|-|\/)\w/g, (m) => m.toUpperCase())),
    sentencecase: () => updateText(text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (m) => m.toUpperCase())),
    camelcase:    () => updateText(
      text.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
        if (+match === 0) return "";
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
      }).replace(/\s+/g, "")
    ),
    snakecase:    () => updateText(
      (text.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g) || [])
        .map((x) => x.toLowerCase()).join("_") || text
    ),
    kebabcase:    () => updateText(
      (text.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g) || [])
        .map((x) => x.toLowerCase()).join("-") || text
    ),
    removespaces: () => updateText(text.replace(/\s+/g, " ").trim()),
    reverse:      () => updateText(text.split("").reverse().join("")),
  };

  // ─── Structure transforms ─────────────────────────────────────────────────
  const structure = {
    addBullets:       () => updateText(text.split("\n").map((l) => l.trim() ? `• ${l}` : l).join("\n")),
    addNumbers:       () => {
      let n = 0;
      updateText(text.split("\n").map((l) => l.trim() ? `${++n}. ${l}` : l).join("\n"));
    },
    addLineNumbers:   () => {
      const lines = text.split("\n");
      const pad = lines.length.toString().length;
      updateText(lines.map((l, i) => `${String(i + 1).padStart(pad, "0")}  ${l}`).join("\n"));
    },
    sortAZ:           () => updateText(text.split("\n").sort((a, b) => a.localeCompare(b)).join("\n")),
    sortZA:           () => updateText(text.split("\n").sort((a, b) => b.localeCompare(a)).join("\n")),
    removeDuplicates: () => updateText([...new Set(text.split("\n"))].join("\n")),
    removeBlankLines: () => updateText(text.split("\n").filter((l) => l.trim().length > 0).join("\n")),
    trimLines:        () => updateText(text.split("\n").map((l) => l.trim()).join("\n")),
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Text Case Converter & Utility</h1>
          <p className="text-muted-foreground">
            Format text, fix case, structure lines, and download in 6 formats — all instantly in your browser.
          </p>
        </div>
        <VersionBadge />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm flex flex-col">
        {/* ── Toolbar Row 1: Case transforms ── */}
        <div className="border-b bg-muted/20 px-3 pt-3 pb-2 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mr-1 self-center shrink-0">Case</span>
          <TransformBtn label="UPPER" onClick={transforms.uppercase} disabled={!text} title="UPPERCASE all text" />
          <TransformBtn label="lower" onClick={transforms.lowercase} disabled={!text} title="lowercase all text" />
          <TransformBtn label="aLtErNaTe" onClick={transforms.togglecase} disabled={!text} title="aLtErNaTiNg case" />
          <TransformBtn label="Title Case" onClick={transforms.titlecase} disabled={!text} />
          <TransformBtn label="Sentence case" onClick={transforms.sentencecase} disabled={!text} />
          <div className="w-px h-5 bg-border mx-0.5 self-center" />
          <TransformBtn label="camelCase" onClick={transforms.camelcase} disabled={!text} />
          <TransformBtn label="snake_case" onClick={transforms.snakecase} disabled={!text} />
          <TransformBtn label="kebab-case" onClick={transforms.kebabcase} disabled={!text} />
          <div className="w-px h-5 bg-border mx-0.5 self-center" />
          <TransformBtn label="Clean Spaces" onClick={transforms.removespaces} disabled={!text} />
          <TransformBtn label="Reverse" onClick={transforms.reverse} disabled={!text} />
        </div>

        {/* ── Toolbar Row 2: Structure transforms ── */}
        <div className="border-b bg-muted/10 px-3 pt-2 pb-2 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mr-1 self-center shrink-0">Structure</span>
          <TransformBtn label="• Bullets" onClick={structure.addBullets} disabled={!text} />
          <TransformBtn label="1. Numbers" onClick={structure.addNumbers} disabled={!text} />
          <TransformBtn label="# Line Nums" onClick={structure.addLineNumbers} disabled={!text} />
          <div className="w-px h-5 bg-border mx-0.5 self-center" />
          <TransformBtn label="Sort A→Z" onClick={structure.sortAZ} disabled={!text} />
          <TransformBtn label="Sort Z→A" onClick={structure.sortZA} disabled={!text} />
          <div className="w-px h-5 bg-border mx-0.5 self-center" />
          <TransformBtn label="Deduplicate" onClick={structure.removeDuplicates} disabled={!text} />
          <TransformBtn label="Remove Blanks" onClick={structure.removeBlankLines} disabled={!text} />
          <TransformBtn label="Trim Lines" onClick={structure.trimLines} disabled={!text} />
        </div>

        {/* ── Textarea ── */}
        <div className="relative flex-1">
          <textarea
            value={text}
            onChange={(e) => updateText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="w-full min-h-[350px] p-6 bg-transparent resize-y outline-none font-mono text-sm leading-relaxed"
            spellCheck="false"
          />
        </div>

        {/* ── Stats & Actions Footer ── */}
        <div className="border-t bg-muted/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-mono">
            <StatPill label="Words" value={stats.words} />
            <StatPill label="Chars" value={stats.chars} />
            <StatPill label="No Space" value={stats.charsNoSpaces} />
            <StatPill label="Lines" value={stats.lines} className="hidden sm:flex" />
            <StatPill label="Sentences" value={stats.sentences} className="hidden md:flex" />
            <StatPill label="Paragraphs" value={stats.paragraphs} className="hidden lg:flex" />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Undo */}
            <button onClick={undo} disabled={historyIndex === 0}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex-1 sm:flex-none flex justify-center"
              title="Undo">
              <Undo className="w-5 h-5" />
            </button>

            {/* Clear */}
            <button onClick={clear} disabled={!text}
              className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex-1 sm:flex-none flex justify-center"
              title="Clear">
              <Trash2 className="w-5 h-5" />
            </button>

            {/* Download dropdown */}
            <div className="relative flex-1 sm:flex-none" ref={downloadRef}>
              <button
                onClick={() => setDownloadOpen((v) => !v)}
                disabled={!text}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium border bg-background hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors w-full text-sm"
              >
                <Download className="w-4 h-4" />
                Download
                <ChevronDown className={`w-3 h-3 transition-transform ${downloadOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {downloadOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute bottom-full mb-2 right-0 w-52 rounded-xl border bg-card shadow-xl overflow-hidden z-50"
                  >
                    <div className="p-2 border-b flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Save As</span>
                      <button onClick={() => setDownloadOpen(false)} className="p-1 hover:bg-muted rounded">
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    {[
                      { fmt: "txt" as const,  icon: "📄", label: "Plain Text",   ext: ".txt",  desc: "Simple text file" },
                      { fmt: "pdf" as const,  icon: "🖨️", label: "PDF",          ext: ".pdf",  desc: "Opens print dialog" },
                      { fmt: "csv" as const,  icon: "📊", label: "CSV",          ext: ".csv",  desc: "One line per row" },
                      { fmt: "png" as const,  icon: "🖼️", label: "Image",        ext: ".png",  desc: "Text as PNG" },
                      { fmt: "md" as const,   icon: "📝", label: "Markdown",     ext: ".md",   desc: "Markdown file" },
                      { fmt: "html" as const, icon: "🌐", label: "HTML",         ext: ".html", desc: "Web page" },
                    ].map(({ fmt, icon, label, ext, desc }) => (
                      <button key={fmt} onClick={() => downloadAs(fmt)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left">
                        <span className="text-base">{icon}</span>
                        <div>
                          <p className="text-sm font-medium leading-tight">{label} <span className="text-muted-foreground font-normal">{ext}</span></p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Copy */}
            <button onClick={copy} disabled={!text}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md font-medium transition-colors ${
                copied
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              }`}>
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.div key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Copied!
                  </motion.div>
                ) : (
                  <motion.div key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Copy
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      {/* SEO */}
      <SeoContentText />
    </div>
  );
}

function TransformBtn({ label, onClick, disabled, title }: { label: string; onClick: () => void; disabled: boolean; title?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="px-3 py-1.5 text-xs font-medium rounded bg-background border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:opacity-50 disabled:pointer-events-none transition-colors whitespace-nowrap">
      {label}
    </button>
  );
}

function StatPill({ label, value, className = "" }: { label: string; value: number; className?: string }) {
  return (
    <span className={`flex items-center gap-1 ${className}`}>
      {label}: <strong className="text-foreground">{value}</strong>
    </span>
  );
}
