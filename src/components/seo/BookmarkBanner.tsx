import { Bookmark, X } from "lucide-react";
import { useState } from "react";

export function BookmarkBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("prachurjo-bookmark-dismissed") === "true";
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("prachurjo-bookmark-dismissed", "true");
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <div
      role="banner"
      className="flex items-center justify-between gap-3 px-4 py-2.5 bg-primary/8 border border-primary/20 rounded-lg text-sm text-muted-foreground"
    >
      <div className="flex items-center gap-2">
        <Bookmark className="w-4 h-4 text-primary shrink-0" />
        <span>
          <strong className="text-foreground">Come back daily</strong> — press{" "}
          <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded">
            Ctrl
          </kbd>
          {" + "}
          <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded">
            D
          </kbd>{" "}
          to bookmark Prachurjo Tools for instant access.
        </span>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Dismiss bookmark notice"
        data-testid="button-dismiss-bookmark"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
