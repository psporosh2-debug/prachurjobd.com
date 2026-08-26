import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutGrid, 
  Youtube, 
  Image, 
  Type, 
  Moon, 
  Sun, 
  Github, 
  Palette, 
  BarChart3, 
  Video, 
  Sparkles, 
  FileText, 
  Menu, 
  X, 
  History, 
  Image as ImageIcon, 
  User,
  Bot,
  ChevronDown,
  Layers,
  Wand2,
  Minimize2,
  FolderSync,
  Crop,
  Music,
  Key,
  Pin,
  Instagram,
  Film
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { motion, AnimatePresence } from "motion/react";
import { BookmarkBanner } from "@/components/seo/BookmarkBanner";
import { sound } from "@/lib/sound";
import { SoundToggleBtn, SoundSettingsModal } from "@/components/SoundEffectsController";
import { useRecentTools } from "@/hooks/useRecentTools";

interface NavCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[];
}

const CATEGORIZED_NAV: NavCategory[] = [
  {
    id: "image-tools",
    name: "Image Tools",
    icon: Image,
    color: "text-emerald-500",
    items: [
      { 
        href: "/image-compressor", 
        label: "Image Compressor", 
        icon: Minimize2, 
        badge: "10MB", 
        badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
      },
      { 
        href: "/image-cropper", 
        label: "Image Cropper", 
        icon: Crop, 
        badge: "Free & Fixed", 
        badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
      },
      { 
        href: "/image-converter", 
        label: "Image Format Converter", 
        icon: FolderSync, 
        badge: "5 Formats", 
        badgeColor: "bg-teal-500/15 text-teal-600 dark:text-teal-400" 
      },
      { 
        href: "/favicon-generator", 
        label: "Favicon Generator", 
        icon: Palette 
      },
    ]
  },
  {
    id: "youtube-tools",
    name: "YouTube Tools",
    icon: Youtube,
    color: "text-rose-500",
    items: [
      { 
        href: "/channel-analyzer", 
        label: "Channel Analyzer", 
        icon: BarChart3, 
        badge: "AI", 
        badgeColor: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" 
      },
      { 
        href: "/video-analyzer", 
        label: "Video Analyzer", 
        icon: Video, 
        badge: "AI", 
        badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400" 
      },
      { 
        href: "/tiktok-downloader", 
        label: "TikTok Downloader", 
        icon: Video, 
        badge: "NO WM ⚡", 
        badgeColor: "bg-pink-500/15 text-pink-600 dark:text-pink-400" 
      },
      { 
        href: "/thumbnail-downloader", 
        label: "Thumbnail Downloader", 
        icon: Youtube, 
        badge: "HD", 
        badgeColor: "bg-red-500/15 text-red-600 dark:text-red-400" 
      },
      { 
        href: "/title-generator", 
        label: "Title Generator", 
        icon: Sparkles 
      },
      { 
        href: "/description-generator", 
        label: "Description Generator", 
        icon: FileText 
      },
    ]
  },
  {
    id: "ai-creative",
    name: "AI & Reels",
    icon: Wand2,
    color: "text-purple-500",
    items: [
      { 
        href: "/reels", 
        label: "Reels & Prompts", 
        icon: Film, 
        badge: "HOT 🔥", 
        badgeColor: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" 
      },
      { 
        href: "/smart-bot", 
        label: "Smart AI Bot", 
        icon: Bot, 
        badge: "Live ⚡", 
        badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400" 
      },
    ]
  },
  {
    id: "text-utility",
    name: "Text & Utilities",
    icon: Type,
    color: "text-blue-500",
    items: [
      { 
        href: "/text-tools", 
        label: "Text Tools", 
        icon: Type 
      },
      { 
        href: "/sound-effects", 
        label: "SFX Audio Library", 
        icon: Music,
        badge: "60+ SFX",
        badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      },
      { 
        href: "/api-keys", 
        label: "Developer API Keys", 
        icon: Key,
        badge: "REST v1",
        badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400"
      },
      { 
        href: "/history", 
        label: "Action History", 
        icon: History 
      },
      { 
        href: "/profile", 
        label: "User Profile", 
        icon: User 
      },
    ]
  }
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const { recordToolUsage } = useRecentTools();

  useEffect(() => {
    if (location && location !== "/" && location !== "/menu" && location !== "/tools") {
      recordToolUsage(location);
    }
  }, [location, recordToolUsage]);

  const toggleCategory = (catId: string) => {
    sound.click();
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const isCurrentActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const isFullScreenPage = 
    location === "/smart-bot" || 
    location === "/ai-bot" || 
    location === "/chatbot" || 
    location === "/reels" || 
    location === "/reels-feed" || 
    location.startsWith("/reels");

  return (
    <div className={`min-h-screen text-foreground flex flex-col md:flex-row overflow-hidden ${isFullScreenPage ? "bg-black" : "bg-background"}`}>
      {/* Mobile Top Header (Hidden on immersive full-screen pages like Reels & Chatbot) */}
      {!isFullScreenPage && (
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.click();
                setMobileMenuOpen(true);
              }}
              className="p-2 -ml-2 rounded-xl hover:bg-muted/80 active:scale-95 transition-all text-foreground flex items-center gap-1.5 font-medium text-xs border border-border/60 shadow-2xs"
              aria-label="Open categorized menu"
            >
              <Menu className="w-5 h-5 text-primary" />
              <span className="font-bold">Menu</span>
            </button>

            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/prachurjo-profile.jpg"
                alt="Prachurjo Logo"
                width="28"
                height="28"
                className="w-7 h-7 rounded-lg shadow-xs"
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-lg tracking-tight">Prachurjo</span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 1-Click Bot Mode Button */}
            <Link
              href="/smart-bot"
              onClick={() => sound.click()}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                location === "/smart-bot"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95"
              }`}
              title="Smart AI Bot Mode (1-Click)"
            >
              <Bot className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-bold text-xs">AI Bot</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </Link>

            <SoundToggleBtn />
            <button
              onClick={() => {
                sound.theme();
                setTheme(theme === "light" ? "dark" : "light");
              }}
              className="p-2 rounded-xl hover:bg-muted transition-colors border border-border/50 shadow-2xs"
              title="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </header>
      )}


      {/* Mobile Categorized Sidebar Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-xs z-30 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[84%] max-w-sm bg-card border-r z-40 md:hidden flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-4 flex items-center justify-between border-b bg-muted/20">
                <Link 
                  href="/" 
                  onClick={() => {
                    sound.click();
                    setMobileMenuOpen(false);
                  }} 
                  className="flex items-center gap-3"
                >
                  <img
                    src="/prachurjo-profile.jpg"
                    alt="Prachurjo Logo"
                    width="32"
                    height="32"
                    className="w-8 h-8 rounded-xl shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="font-bold text-lg tracking-tight block leading-tight">Prachurjo Tools</span>
                    <span className="text-[10px] text-muted-foreground font-medium">Categorized Directory</span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    sound.click();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categorized Nav Content */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Home Hub Link */}
                <Link
                  href="/"
                  onClick={() => {
                    sound.click();
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
                    location === "/"
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "bg-muted/40 text-foreground hover:bg-muted font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-sm">Home Hub</span>
                  </div>
                  <span className="text-[11px] font-mono opacity-80">All Tools</span>
                </Link>

                {/* Categorized Groups */}
                {CATEGORIZED_NAV.map((category) => {
                  const CatIcon = category.icon;
                  const isCollapsed = collapsedCategories[category.id];

                  return (
                    <div key={category.id} className="space-y-1 bg-muted/20 rounded-2xl p-2 border border-border/40">
                      {/* Category Header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <CatIcon className={`w-3.5 h-3.5 ${category.color}`} />
                          <span>{category.name}</span>
                        </div>
                        <ChevronDown 
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isCollapsed ? "-rotate-90 text-muted-foreground" : "rotate-0 text-foreground"
                          }`} 
                        />
                      </button>

                      {/* Category Items */}
                      {!isCollapsed && (
                        <div className="space-y-0.5 pt-0.5">
                          {category.items.map((item) => {
                            const ItemIcon = item.icon;
                            const active = isCurrentActive(item.href);

                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                  sound.click();
                                  setMobileMenuOpen(false);
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-medium ${
                                  active
                                    ? "bg-primary/15 text-primary font-bold shadow-2xs border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <ItemIcon className="w-4 h-4 shrink-0 opacity-80" />
                                  <span className="truncate">{item.label}</span>
                                </div>

                                {item.badge && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ml-1.5 ${item.badgeColor || 'bg-muted text-muted-foreground'}`}>
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Drawer Footer */}
              <div className="p-3.5 border-t bg-muted/20 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-1">
                  <span>Theme & Sound</span>
                  <div className="flex items-center gap-1.5">
                    <SoundToggleBtn />
                    <button
                      onClick={() => {
                        sound.theme();
                        setTheme(theme === "light" ? "dark" : "light");
                      }}
                      className="p-1.5 rounded-lg bg-muted text-foreground"
                    >
                      {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-9 rounded-xl bg-muted/80 hover:bg-muted text-foreground transition-colors font-medium text-xs border border-border/50"
                >
                  <Github className="w-3.5 h-3.5" />
                  Star on GitHub
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Categorized Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card/60 z-10 shrink-0 h-screen">
        <div className="p-4 flex flex-col gap-4 h-full overflow-hidden">
          {/* Logo */}
          <Link href="/" onClick={() => sound.click()} className="flex items-center gap-3 group px-2 pt-1 shrink-0">
            <img
              src="/prachurjo-profile.jpg"
              alt="Prachurjo Logo"
              width="36"
              height="36"
              className="w-8 h-8 rounded-xl shadow-xs transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight leading-none">Prachurjo</span>
              <span className="text-[10px] text-muted-foreground font-semibold tracking-wide uppercase mt-1">
                Categorized Hub
              </span>
            </div>
          </Link>

          {/* Categorized Nav Scroll Area */}
          <nav className="flex-1 overflow-y-auto space-y-3.5 pr-1 -mr-1 custom-scrollbar">
            {/* Quick Home */}
            <Link
              href="/"
              onClick={() => sound.click()}
              className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
                location === "/"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-muted/40 text-foreground hover:bg-muted/80"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4" />
                <span>Home Hub</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">All Tools</span>
            </Link>

            {/* Categorized Sections */}
            {CATEGORIZED_NAV.map((category) => {
              const CatIcon = category.icon;
              const isCollapsed = collapsedCategories[category.id];

              return (
                <div key={category.id} className="space-y-1 bg-muted/20 rounded-xl p-2 border border-border/40">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider rounded-md transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <CatIcon className={`w-3.5 h-3.5 ${category.color}`} />
                      <span>{category.name}</span>
                    </div>
                    <ChevronDown 
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isCollapsed ? "-rotate-90 text-muted-foreground" : "rotate-0 text-foreground"
                      }`} 
                    />
                  </button>

                  {/* Sub-items */}
                  {!isCollapsed && (
                    <div className="space-y-0.5 pt-0.5">
                      {category.items.map((item) => {
                        const ItemIcon = item.icon;
                        const active = isCurrentActive(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => sound.click()}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-xs ${
                              active
                                ? "bg-primary/15 text-primary font-bold shadow-2xs border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-card"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <ItemIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                              <span className="truncate">{item.label}</span>
                            </div>

                            {item.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ml-1 ${item.badgeColor || 'bg-muted text-muted-foreground'}`}>
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom controls */}
          <div className="pt-2 border-t flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <SoundToggleBtn />
              <button
                onClick={() => {
                  sound.theme();
                  setTheme(theme === "light" ? "dark" : "light");
                }}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 border border-border/50"
                title="Toggle theme"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors font-medium text-xs border border-border/50"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Desktop Top Header */}
        <header className="hidden md:flex items-center justify-between px-6 py-2.5 border-b bg-card/60 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-2 text-xs">
            <Link 
              href="/" 
              onClick={() => sound.click()}
              className="flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-primary" />
              <span>Prachurjo Studio</span>
            </Link>
            <span className="text-border">/</span>
            <span className="font-semibold text-foreground capitalize">
              {location === "/" ? "Home Hub" : location.replace(/^\//, "").replace(/-/g, " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 1-Click Bot Mode Button */}
            <Link
              href="/smart-bot"
              onClick={() => sound.click()}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs group ${
                location === "/smart-bot"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-sm active:scale-95"
              }`}
              title="Launch Smart AI Bot Mode (1-Click)"
            >
              <div className="p-1 rounded-lg bg-emerald-500/15 group-hover:scale-110 transition-transform">
                <Bot className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="font-bold tracking-tight">AI Bot Mode</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </Link>

            <div className="h-4 w-px bg-border/60" />

            <SoundToggleBtn />
            <button
              onClick={() => {
                sound.theme();
                setTheme(theme === "light" ? "dark" : "light");
              }}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/50 shadow-2xs"
              title="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
          </div>
        </header>

        {/* If SmartBot or Reels page, render full screen clean UI without ads or footer */}
        {isFullScreenPage ? (
          <div className="flex-1 h-full w-full overflow-hidden p-0 m-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={location}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full w-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto w-full">
            <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8 min-h-full">
              <BookmarkBanner />

              {/* Top Ad */}
              <div className="w-full h-[90px] border-2 border-dashed border-muted rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground text-sm uppercase tracking-widest shrink-0">
                Advertisement
              </div>

              {/* Page */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bottom Ad */}
              <div className="w-full h-[90px] border-2 border-dashed border-muted rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground text-sm uppercase tracking-widest shrink-0 mt-8">
                Advertisement
              </div>

              {/* Google SEO Booster Content Section */}
              <section className="w-full px-4 py-10 text-muted-foreground border-t border-border mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">Why Use Prachurjo Free Online Web Tools?</h2>
                    <p className="mb-4 leading-relaxed text-sm md:text-base">
                      In today's fast-paced digital world, efficiency is everything. <strong className="text-primary font-semibold">Prachurjo Tools</strong> provides essential, high-speed single-purpose web utility tools designed for creators, web developers, and students. All tasks are processed 100% inside your browser, ensuring absolute data privacy and rapid performance without complex server delays.
                    </p>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Maximize SEO Speed with Modern Image Optimization</h3>
                    <p className="leading-relaxed text-sm md:text-base">
                      Converting traditional images into modern <strong className="text-emerald-500 font-semibold">Next-Gen WebP and AVIF formats</strong> dramatically shrinks file sizes without losing visual quality. This enhances your own website speed, a critical factor for ranking high on Google search results.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">Frequently Asked Questions (FAQ)</h2>
                    <div className="space-y-4">
                      <div className="bg-card/80 p-4 rounded-xl border border-border">
                        <h4 className="font-semibold text-foreground mb-1">How secure is my data on Prachurjo?</h4>
                        <p className="text-sm text-muted-foreground">Your files never leave your computer. All file conversions, text formatting, and thumbnail processes occur locally inside your web browser.</p>
                      </div>
                      <div className="bg-card/80 p-4 rounded-xl border border-border">
                        <h4 className="font-semibold text-foreground mb-1">Can I use downloaded thumbnails commercially?</h4>
                        <p className="text-sm text-muted-foreground">Yes, you can fetch HD previews. However, make sure you own the rights or have permission from the original YouTube content creator before using them commercially.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <footer className="shrink-0 py-6 border-t flex flex-col items-center gap-4">
                <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-xs md:text-sm font-medium text-muted-foreground">
                  <Link href="/about-us" onClick={() => sound.tab()} className="hover:text-primary transition-colors">
                    About Us
                  </Link>
                  <span className="text-border">•</span>
                  <Link href="/contact-us" onClick={() => sound.tab()} className="hover:text-primary transition-colors">
                    Contact Us
                  </Link>
                  <span className="text-border">•</span>
                  <Link href="/privacy-policy" onClick={() => sound.tab()} className="hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                  <span className="text-border">•</span>
                  <SoundSettingsModal />
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "#Prachurjo",
                    "#FreeWebTools",
                    "#YouTubeThumbnail",
                    "#ImageCompressor",
                    "#WebPConverter",
                    "#TextConverter",
                    "#FaviconGenerator",
                    "#OnlineTools",
                    "#NoSignup",
                  ].map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  &copy; {new Date().getFullYear()} Prachurjo. All rights reserved. All tools run locally in your browser.
                </p>
              </footer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AppLayout;
