import React from "react";
import { Link } from "wouter";
import { 
  Image, 
  Youtube, 
  Bot, 
  Type, 
  Minimize2, 
  FolderSync, 
  Palette, 
  BarChart3, 
  Video, 
  Sparkles, 
  FileText, 
  ImageIcon, 
  History, 
  User,
  ArrowRight,
  Layers,
  LayoutGrid,
  Crop,
  Music,
  Key,
  Pin,
  Film
} from "lucide-react";
import { motion } from "motion/react";
import { sound } from "@/lib/sound";

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  items: {
    href: string;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
    external?: boolean;
  }[];
}

const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: "image-tools",
    name: "Image Tools",
    description: "Compression, format conversion, and favicon generation",
    icon: Image,
    color: "text-emerald-500",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    items: [
      {
        href: "/image-compressor",
        title: "Image Compressor",
        desc: "Reduce file sizes while maintaining quality (Max 10MB).",
        icon: Minimize2,
        badge: "MAX 10MB ⚡",
        badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      },
      {
        href: "/image-cropper",
        title: "Image Cropper (ইমেজ ক্রপ)",
        desc: "Crop images with free-form or 1:1, 4:3, 16:9 ratios, zoom & rotate.",
        icon: Crop,
        badge: "FREE & FIXED",
        badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      },
      {
        href: "/image-converter",
        title: "Image Format Converter",
        desc: "Convert between JPEG, PNG, WebP, AVIF, and BMP in high quality.",
        icon: FolderSync,
        badge: "5 FORMATS",
        badgeColor: "bg-teal-500/15 text-teal-600 dark:text-teal-400"
      },
      {
        href: "/favicon-generator",
        title: "Favicon Generator",
        desc: "Create complete multi-resolution favicon and app icon packages.",
        icon: Palette,
        badge: "16x16-512x512",
        badgeColor: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
      }
    ]
  },
  {
    id: "youtube-tools",
    name: "YouTube Tools",
    description: "Channel audit, video SEO, thumbnails, and viral titles",
    icon: Youtube,
    color: "text-rose-500",
    badgeBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    items: [
      {
        href: "/channel-analyzer",
        title: "Channel Analyzer",
        desc: "Full channel audit, subscriber growth charts, and AI channel optimizer.",
        icon: BarChart3,
        badge: "AI OPTIMIZER 🚀",
        badgeColor: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
      },
      {
        href: "/video-analyzer",
        title: "Video Analyzer",
        desc: "Video metrics, keyword evaluation, and AI video booster report.",
        icon: Video,
        badge: "AI BOOST 🎬",
        badgeColor: "bg-rose-500/15 text-rose-600 dark:text-rose-400"
      },
      {
        href: "/tiktok-downloader",
        title: "TikTok Video Downloader",
        desc: "Download TikTok videos without watermark in HD, extract MP3 audio and covers.",
        icon: Video,
        badge: "NO WATERMARK ⚡",
        badgeColor: "bg-pink-500/15 text-pink-600 dark:text-pink-400"
      },
      {
        href: "/thumbnail-downloader",
        title: "Thumbnail Downloader",
        desc: "Download HD, 4K, and standard YouTube thumbnails instantly.",
        icon: Youtube,
        badge: "MAX HD",
        badgeColor: "bg-red-500/15 text-red-600 dark:text-red-400"
      },
      {
        href: "/title-generator",
        title: "Title Generator",
        desc: "Generate high-CTR and viral YouTube title concepts with AI.",
        icon: Sparkles,
        badge: "VIRAL CTR",
        badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      },
      {
        href: "/description-generator",
        title: "Description Generator",
        desc: "Generate timestamped, SEO-optimized YouTube video descriptions.",
        icon: FileText,
        badge: "SEO READY",
        badgeColor: "bg-orange-500/15 text-orange-600 dark:text-orange-400"
      }
    ]
  },
  {
    id: "ai-hub",
    name: "AI & Reels",
    description: "In-browser smart AI assistant, clean 9:16 reels, and 1-click prompt copying",
    icon: Film,
    color: "text-purple-500",
    badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    items: [
      {
        href: "/reels",
        title: "Reels & Prompts Feed",
        desc: "Watch clean 9:16 TikTok videos/photos with 1-click prompt copying.",
        icon: Film,
        badge: "HOT 🔥",
        badgeColor: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
      },
      {
        href: "/smart-bot",
        title: "Smart AI Bot",
        desc: "Execute tasks via natural language commands (100% in-browser).",
        icon: Bot,
        badge: "LIVE BOT ⚡",
        badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400"
      }
    ]
  },
  {
    id: "text-utilities",
    name: "Text & Utilities",
    description: "Text transformations, action logs, and user profile",
    icon: Type,
    color: "text-blue-500",
    badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    items: [
      {
        href: "/text-tools",
        title: "Text Tools",
        desc: "Case conversion, character counter, cleanups, and export utilities.",
        icon: Type,
        badge: "FAST",
        badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400"
      },
      {
        href: "/sound-effects",
        title: "SFX Audio Studio (SFX 50+)",
        desc: "Explore and download 60+ royalty-free studio audio effects and risers.",
        icon: Music,
        badge: "60+ SFX",
        badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      },
      {
        href: "/api-keys",
        title: "Developer API & Keys Hub",
        desc: "Generate private API keys, inspect rate limits, and access live REST APIs.",
        icon: Key,
        badge: "REST v1",
        badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400"
      },
      {
        href: "/history",
        title: "Action History",
        desc: "Track and review your recent downloads and conversions.",
        icon: History,
        badge: "SAVED",
        badgeColor: "bg-slate-500/15 text-slate-600 dark:text-slate-400"
      },
      {
        href: "/tools/index-tool/index.html",
        title: "Prachurjo Index Tool",
        desc: "Open the standalone Prachurjo developer, creator, portfolio and tools hub.",
        icon: LayoutGrid,
        badge: "NEW",
        badgeColor: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
      },
      {
        href: "/profile",
        title: "User Profile",
        desc: "Manage account profile details, email, and preferences.",
        icon: User,
        badge: "ACCOUNT",
        badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      }
    ]
  }
];

export default function MenuDirectory() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="space-y-3 text-center sm:text-left border-b border-border/60 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Layers className="w-3.5 h-3.5" />
          <span>Categorized Menu Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
          All Tools & Categories
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
          Quickly discover and launch image editing, YouTube growth, AI automation, and text utilities by category.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="space-y-8">
        {MENU_CATEGORIES.map((cat, idx) => {
          const CatIcon = cat.icon;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="bg-card border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
            >
              {/* Category Title Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-muted/80 text-foreground shrink-0 border">
                    <CatIcon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                      <span>{cat.name}</span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <span className={`self-start sm:self-auto text-[11px] font-bold px-2.5 py-1 rounded-lg border ${cat.badgeBg}`}>
                  {cat.items.length} Tools
                </span>
              </div>

              {/* Items Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {cat.items.map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    item.href.endsWith('.html') ? (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={() => sound.click()}
                        className="group flex flex-col justify-between p-4 rounded-xl border bg-muted/20 hover:bg-card hover:border-primary/40 transition-all shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="p-2 rounded-lg bg-background border text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                              <ItemIcon className="w-4 h-4" />
                            </div>
                            {item.badge && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                              <span>{item.title}</span>
                              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </a>
                    ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => sound.click()}
                      className="group flex flex-col justify-between p-4 rounded-xl border bg-muted/20 hover:bg-card hover:border-primary/40 transition-all shadow-2xs hover:shadow-xs hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="p-2 rounded-lg bg-background border text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          {item.badge && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                            <span>{item.title}</span>
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </Link>
                    )
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Back to Home Hub */}
      <div className="text-center pt-4">
        <Link
          href="/"
          onClick={() => sound.click()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer"
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Return to Home Hub</span>
        </Link>
      </div>
    </div>
  );
}
