# 📁 Project Folder & File Structure Guide

This document outlines the complete file, folder, and system workflow architecture for the Prachurjo Web Utilities platform.

---

## 🔄 System Architecture & Workflow Diagram

```mermaid
graph TD
    A[User Browser] -->|Requests Route| B(src/main.tsx)
    B --> C(src/App.tsx - Wouter Router)
    C --> D[src/components/layout/AppLayout.tsx]
    
    D --> E[Navigation Sidebar & Categorized Menu]
    D --> F[Page Router Container]
    D --> G[Footer & Sound Settings]
    D -->|Tracks Route Visits| REC[src/hooks/useRecentTools.ts - LocalStorage Sync]

    F -->|/| H[pages/Home.tsx - Creator Studio Hub]
    H --> RUT[src/components/RecentlyUsedTools.tsx - Horizontal Quick List]
    RUT --> REC
    
    %% F -->|/facebook-downloader| FBD[pages/FacebookDownloader.tsx - Full HD 1080p Video & MP3 Downloader] (Hidden)
    F -->|/tiktok-downloader| TKD[pages/TikTokDownloader.tsx - No Watermark HD & MP3 Downloader]
    F -->|/pinterest-downloader| PIN[pages/PinterestDownloader.tsx - Pinterest Video & MP3 Downloader]
    F -->|/smart-bot| SB[pages/SmartBot.tsx - All-in-One Smart AI Assistant]
    F -->|/sound-effects| SFX[pages/SoundEffectsLibrary.tsx - 60+ Royalty-Free SFX Studio Hub]
    F -->|/api-keys| KEYS[pages/ApiKeysDashboard.tsx - Developer API Keys & Live Sandbox]
    F -->|/image-compressor| IC[pages/ImageCompressor.tsx - 10MB Quality Compressor]
    F -->|/image-cropper| ICR[pages/ImageCropper.tsx - Image Cropper & Aspect Ratio Tools]
    F -->|/image-converter| ICONV[pages/ImageConverter.tsx - 5 Formats WebP/PNG/JPG/AVIF/BMP]
    F -->|/menu| MENU[pages/MenuDirectory.tsx - Categorized Tools Directory]
    F -->|/title-generator| TG[pages/TitleGenerator.tsx]
    F -->|/description-generator| DG[pages/DescriptionGenerator.tsx]
    F -->|/channel-analyzer| CH[pages/ChannelAnalyzer.tsx]
    F -->|/video-analyzer| VA[pages/VideoAnalyzer.tsx]
    F -->|/thumbnail-downloader| TD[pages/YouTubeDownloader.tsx]
    F -->|/text-tools| J[pages/TextTools.tsx]
    F -->|/favicon-generator| K[pages/FaviconGenerator.tsx]
    F -->|/prompts| P[pages/PromptsHome.tsx]
    F -->|/prompts/:id| PD[pages/PromptDetail.tsx]
    F -->|/history| HIST[pages/History.tsx]
    F -->|/about-us| ABT[pages/AboutUs.tsx]
    F -->|/contact-us| CNT[pages/ContactUs.tsx]
    F -->|/privacy-policy| PP[pages/PrivacyPolicy.tsx]
    F -->|404 Route| L[pages/not-found.tsx]

    KEYS -->|REST v1 Endpoints| SRV[server.ts - Express Public API v1 Engine]
    SRV --> EP1[/api/v1/prompts - AI Prompts Catalog]
    SRV --> EP2[/api/v1/youtube/extract - 4K/HD YouTube Metadata & Thumbnails]
    SRV --> EP3[/api/v1/sfx - 60+ Royalty-Free Audio FX]
    SRV --> EP4[/api/v1/text/convert - Case/Slug/Reading Time API]
    SRV --> EP5[/api/v1/ai/generate-title - Gemini AI Title Generator]
    SRV --> EP6[/api/v1/keys - API Key Generation & Management]

    ICR -->|Canvas Transforms & Export| CROPUTIL[src/lib/cropImage.ts - getCroppedImg with Rotate & Flip]
    SB -->|Auto-detects YouTube URLs| YT[src/api/youtubeApi.ts]
    SB -->|In-Chat Image Processing| CANVAS[Browser Canvas - WebP/PNG/JPG/Compress]
    SB -->|Gemini AI & Knowledge Base Query| YTDB[src/lib/youtubeDb.ts - Tiered Supabase & Local DB Storage]
    CH & VA & TG & DG --> YT
    CH & VA & TG & DG --> YTDB
    YT -->|1. Check DB Cache & Quota Saver| YTDB
    YT -->|2. Live API Call & Token Save| KEY[src/api/apiKeys.ts - YouTube Permanent API Key]
    YTDB -->|Persistent Storage & Bot Memory| SUPA[Supabase Cloud Database Tables yt_channels, yt_videos, yt_generated_titles, yt_generated_descriptions]

    CH --> M1[Channel Banner, Handle, ID, Stats, Account Age, Keywords, Database Cache]
    CH --> M2[AI Channel Optimizer - SEO Name, Description, Tags]
    VA --> V1[Video Thumbnail + 1080p HD Download, Metrics, SEO Keywords, Database Cache]
    VA --> V2[AI Video Optimizer - High CTR Titles, SEO Description, Hashtags]
```

### 🔁 Data & Execution Flow Summary
1. **Entry Point**: `src/main.tsx` initializes the application and renders `src/App.tsx`.
2. **Layout Shell**: `AppLayout.tsx` provides categorized navigation (Image Tools, YouTube Tools, AI & Prompts, Text & Utilities), collapsible sidebar groups, theme toggle, audio controllers, and auto-records tool page visits into `useRecentTools`.
3. **Recently Used Carousel**: `RecentlyUsedTools.tsx` renders on the homepage as a responsive horizontal list of clickable cards with relative time badges, tool icons, and one-click quick open transitions.
4. **Smart AI Assistant**: `src/pages/SmartBot.tsx` operates with pure client-side intelligence and zero API key requirement for local image operations (compression, format conversion, and tag extraction).
5. **Image Cropper**: `src/pages/ImageCropper.tsx` uses `react-easy-crop` and `src/lib/cropImage.ts` to perform in-browser free-form, 1:1, 4:3, 16:9, 9:16 cropping with zoom, 360° rotation, horizontal/vertical flipping, and instant format export.
6. **YouTube API Integration**: `src/api/youtubeApi.ts` fetches real-time channel statistics and video metadata.
7. **AI Optimizer & Token Saver**: `src/components/AiOptimizerCard.tsx` uses token caching, prompt compression, and server-side optimization to save API tokens.

---

## 📂 Root Directory Structure

```text
/
├── AGENTS.md                 # Agent instructions and automatic documentation rules
├── FOLDER_STRUCTURE.md       # Comprehensive folder structure and workflow guide
├── vercel.json               # Vercel deployment SPA rewrite configuration
├── index.html                # Main HTML entry point with Google AdSense and meta tags
├── server.ts                 # Express Backend Server with Gemini AI endpoints
├── api/                      # Vercel Serverless Function directory
│   └── index.ts              # Express Serverless Handler for Vercel (/api/*)
├── public/                   # Static assets and media files
│   ├── sw.js                 # Service Worker for push notification handling
│   ├── sitemap.xml           # Search Engine Sitemap Index
│   ├── robots.txt            # Search Engine Crawler rules
│   ├── _redirects            # Netlify/Static Host SPA rewrite rules
│   └── sounds/               # Audio sound effects library (.wav files)
│       └── SFX50+/           # New SFX 50+ Audio pack (53 high quality WAV sound effects)
├── metadata.json             # App metadata and title configuration
├── package.json              # Project dependencies and script definitions
├── vite.config.ts            # Vite build and development configuration
├── src/                      # Source code root
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Main Router and page layout routes
│   ├── index.css             # Global CSS and Tailwind directives
│   │
│   ├── data/                 # Static datasets and JSON knowledge stores
│   │   └── chatdata.json     # Pre-loaded SmartBot Banglish/Bangla conversational dataset with categories (greetings, capabilities, conversational, youtube, downloaders, images, memory, bye) and randomized response variations
│   │
│   ├── api/                  # API clients and key configurations
│   │   ├── apiKeys.ts        # YouTube and Gemini API key constants
│   │   ├── aiService.ts      # Gemini AI client handler
│   │   ├── facebookApi.ts    # Facebook Video & Reels extraction, stream proxy URLs, quality options (1080p/720p/480p/360p), and MP3 audio downloader helper
│   │   ├── tiktokApi.ts      # TikTok Video & Audio extraction, format conversion (MP4/WebM/MP3/M4A/WAV), quality options (1080p/720p/480p/360p), and blob download API helper
│   │   ├── pinterestApi.ts   # Pinterest Video extraction and file blob download API helper
│   │   ├── instagramApi.ts   # Instagram Video/Photo/Carousel extraction and download proxy helper
│   │   └── youtubeApi.ts     # YouTube Data API v3 helper functions
│   │
│   ├── pages/                # Application page views
│   │   ├── Home.tsx              # Main Creator Studio Hub with categorized tool search & Recently Used section
│   │   ├── FacebookDownloader.tsx # Facebook Video & Reels Downloader (Hidden/Disabled)
│   │   ├── TikTokDownloader.tsx  # TikTok Video Downloader with Quality (1080p/720p/480p/360p) & Format (MP4/WebM/MP3/M4A/WAV) dropdown controls, watermark removal, audio preview, and cover extractor
│   │   ├── PinterestDownloader.tsx # Pinterest Video & MP3 Audio Downloader page
│   │   ├── InstagramDownloader.tsx # Instagram Video, Reel, Photo, and Carousel Downloader with MP3 on-the-fly extraction
│   │   ├── SmartBot.tsx          # Full-screen Smart AI Bot & Automation chat
│   │   ├── ReelsFeed.tsx         # Full-Screen TikTok UI Reels & Prompts Feed: Top Overlay Bar (Back Icon, Video Edit/Prompt/Explore Tabs, Search/Upload), Auto-Aspect 9:16/16:9 Player, Photo Background Music, 1-Click PTCopy Prompt, Live Counters, Creator Avatar, Follow Badge & Spinning Vinyl Disc
│   │   ├── ReelsUpload.tsx       # Dedicated Upload Page: 1-Click clean TikTok video/photo extraction, metadata publishing to Supabase reels_posts, and advanced Gemini 3.7 AI prompt engineering helper panel (Enhance, Translate, Concept Ideas)
│   │   ├── PromptDetailsPage.tsx # Dedicated Full-Screen Prompt Details View (/prompt/:id): High-res media preview, 1-click PTCopy prompt, Open & Generate in Smart AI Bot button, Midjourney/FLUX parameter badges, and creator profile
│   │   ├── SoundEffectsLibrary.tsx # SFX Audio Studio Hub with 60+ previewable and downloadable WAV sound effects
│   │   ├── ApiKeysDashboard.tsx  # Developer API Keys Hub, Code Generators (cURL, Python, JS, PHP), and Live Sandbox
│   │   ├── ImageCompressor.tsx   # Image Compressor (10MB max, Quality slider 10-100)
│   │   ├── ImageCropper.tsx      # Image Cropper (Free, 1:1, 4:3, 16:9, Zoom, Rotate, Flip)
│   │   ├── ImageConverter.tsx    # Format Converter (JPEG, PNG, WebP, AVIF, BMP)
│   │   ├── MenuDirectory.tsx     # Categorized Tools Directory (/menu, /tools)
│   │   ├── ChannelAnalyzer.tsx   # YouTube Channel Analyzer & AI Audit
│   │   ├── VideoAnalyzer.tsx     # YouTube Video & SEO Tag Inspector
│   │   ├── YouTubeDownloader.tsx # YouTube HD Thumbnail Downloader
│   │   ├── TitleGenerator.tsx    # AI YouTube Title Generator (High CTR, Viral Hooks) with 1-Click Copy
│   │   ├── DescriptionGenerator.tsx # AI Video Description Generator with 1-Click Copy Description
│   │   ├── TextTools.tsx         # Text manipulation tool with 1-Click Copy Transformed Text
│   │   ├── FaviconGenerator.tsx  # Multi-resolution Favicon Generator (.ico) with 1-Click Copy HTML Snippet
│   │   ├── Auth.tsx              # Supabase Authentication View
│   │   ├── Profile.tsx           # User Profile View
│   │   ├── History.tsx           # Action and Download History Tracker
│   │   ├── AboutUs.tsx           # About Us information page
│   │   ├── ContactUs.tsx         # Contact Us feedback form
│   │   ├── PrivacyPolicy.tsx     # Privacy policy and GDPR compliance
│   │   └── not-found.tsx         # 404 error page
│   │
│   ├── config/               # Application & Tool configuration
│   │   └── version.ts        # Single source of truth for App & Tools Version Code (v1.16), incremented on every update
│   │
│   ├── components/           # Reusable UI components
│   │   ├── VersionBadge.tsx         # Universal tool version indicator badge (e.g. v1.16) with live status pulse
│   │   ├── reels/            # Reels & Prompts Feed Components
│   │   │   ├── ReelCustomPlayer.tsx # Custom TikTok video/photo player with auto-aspect ratio, music playback, and double-tap heart animations
│   │   │   ├── ReelSideActions.tsx  # Right side TikTok action column (1-Click PTCopy, Like counter, Prompt details, Share & Download, Spinning music vinyl)
│   │   │   ├── ReelShareSheetModal.tsx # TikTok-Style Share & Media Download Bottom Sheet Drawer (MP4 Video, MP3 Song, Cover Image, Social Shares)
│   │   │   ├── ReelInfoModal.tsx    # Full prompt details modal with 1-click copy & Smart Bot launch
│   │   │   └── UploadReelModal.tsx  # Create/Upload Reel modal with custom video, audio, prompt formula, and preview
│   │   ├── tour/             # Universal Interactive Website Tour system
│   │   │   ├── WebsiteTourModal.tsx # Multi-step interactive spotlight modal with step indicators, Framer Motion animations & feature previews
│   │   │   └── WebsiteTourTrigger.tsx # Global event listener & auto-launch trigger hook for first-time visitors and header tour triggers
│   │   ├── GlobalTopProgressBar.tsx # Global slim top-of-screen progress bar indicator for running tasks
│   │   ├── GlobalTaskHUD.tsx        # Floating interactive task HUD panel showing active/completed downloads and processing jobs
│   │   ├── TaskProgressCard.tsx     # Reusable animated progress card with byte metrics, speeds, and step descriptions
│   │   ├── SmartBotTour.tsx      # Interactive popover & tooltip onboarding tour for Smart Bot & proactive features
│   │   ├── RecentlyUsedTools.tsx # Horizontal clickable list of recently interacted tools with scroll & clear
│   │   ├── SoundEffectsController.tsx # Global audio toggle and volume modal
│   │   ├── NotificationBanner.tsx # Push notification permission banner
│   │   ├── AiOptimizerCard.tsx # Gemini AI optimization card
│   │   ├── WorkflowScanner.tsx # YouTube inspection progress animation
│   │   ├── auth/             # Authentication & Gating Modals
│   │   │   └── AuthRequiredModal.tsx # Dynamic account creation & login modal for gated actions (Upload Reel, Copy Prompt, Follow Creator)
│   │   ├── reels/            # Custom TikTok Reels & Prompts Feed components
│   │   │   ├── ReelCustomPlayer.tsx # TikTok full-screen player with seamless auto-play on scroll, audio policy fallback, 1-tap unmute badge, auto-aspect adjustment (9:16 vertical cover, 16:9 landscape centering with letterbox & ambient blur, photo slideshow background audio playback, animated playhead scrubber)
│   │   │   ├── ReelSideActions.tsx  # TikTok right-side action column with Creator Avatar & Follow badge, 1-Click Copy Prompt (PTCopy with Auth gate), live counts, like button, prompt info modal, share & spinning vinyl record with floating notes
│   │   │   ├── ReelInfoModal.tsx    # Full prompt text viewer, Auth-gated copy button, copy count sync and instructions modal
│   │   │   └── UploadReelModal.tsx  # Creator modal with duplicate URL prevention, TikTok clean extraction, category selection, and 1-click prompt publishing
│   │   ├── bot/              # SmartBot dedicated chat components
│   │   │   ├── InChatCropper.tsx # Interactive in-chat cropper with aspect ratio presets, zoom, rotate, flip & export
│   │   │   ├── TikTokBotCard.tsx # TikTok video/audio downloader result card for SmartBot with 1080p No-Watermark, MP3 preview & download controls
│   │   │   ├── FacebookBotCard.tsx # Facebook video/audio downloader result card for SmartBot with HD 1080p, MP3 preview & download controls
│   │   │   ├── PinterestBotCard.tsx # Pinterest video/audio/thumbnail downloader result card for SmartBot
│   │   │   ├── InstagramBotCard.tsx # Instagram video/reel/photo/carousel downloader result card for SmartBot
│   │   │   └── TypewriterText.tsx # Smooth typewriter-style response streaming animation component with cursor & skip feature
│   │   ├── layout/
│   │   │   └── AppLayout.tsx # Navigation layout shell with categorized menus
│   │   ├── seo/
│   │   │   ├── BookmarkBanner.tsx # Bookmark helper banner
│   │   │   ├── FaqSection.tsx     # Reusable FAQ accordion
│   │   │   ├── SeoContentImage.tsx # Image tools SEO content
│   │   │   ├── SeoContentText.tsx  # Text tools SEO content
│   │   │   └── SeoContentYouTube.tsx # YouTube tools SEO content
│   │   ├── ui/               # Base UI primitives (buttons, inputs, cards)
│   │   └── theme-provider.tsx # Dark/Light theme provider
│   │
│   ├── context/              # React Context Providers
│   │   └── TaskProgressContext.tsx # Global background task state, streaming download progress tracking, and task cancellation
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuthUser.ts    # Real-time Supabase authentication state hook
│   │   ├── useFollowSystem.ts# Creator follow/unfollow system hook with Supabase & LocalStorage sync
│   │   ├── useRecentTools.ts # Tracks interacted tools, timestamps, and localStorage persistence
│   │   ├── useHistory.ts     # Action and download history tracker
│   │   └── useToast.ts       # Toast notification hook
│   │
│   └── lib/                  # Helper utilities
│       ├── reelsDeduplication.ts # URL normalization, media ID extraction, duplicate detection and feed deduplication engine
│       ├── youtubeDb.ts      # YouTube persistent cache & knowledge base engine (Supabase & Local storage)
│       ├── smartBotMemory.ts # SmartBot persistent Local Memory engine for storing & retrieving user links, YouTube/TikTok/Facebook URLs, uploaded images, and chatdata.json queries
│       ├── imageProcessor.ts # Universal in-browser image decoding, format conversion & compression engine
│       ├── cropImage.ts      # Canvas image cropping, rotation, flip & export engine
│       ├── botLogic.ts       # SmartBot NLP engine and rule matching
│       ├── botCommandMatcher.ts # SmartBot command exporter
│       ├── webLlmService.ts   # WebGPU WebLLM engine helper for client-side SmolLM2-135M model execution
│       ├── sound.ts          # Web Audio & sound effect manager
│       ├── supabase.ts       # Supabase client configuration
│       ├── notifications.ts  # Push notification triggers
│       └── utils.ts          # Tailwind cn utility function
```

---

## 💡 File & Component Purpose Guide

| File / Directory | Purpose & Functionality |
| :--- | :--- |
| **`src/pages/FacebookDownloader.tsx`** | Facebook Video & Reels Downloader (Hidden/Disabled) |
| **`src/pages/PinterestDownloader.tsx`** | Pinterest Video Downloader (Temporarily Disabled / Under Maintenance) |
| **`src/pages/InstagramDownloader.tsx`** | Instagram Video Downloader (Temporarily Disabled / Under Maintenance) |
| **`src/api/facebookApi.ts`** | Facebook media extraction engine with direct HTML parser, JSON-LD meta inspector, fallback public API client, and stream progress blob downloader. |
| **`src/config/version.ts`** | Central single-source-of-truth version configuration (`v1.29`). Incremented automatically on every tool modification, feature addition, or bugfix. |
| **`src/components/VersionBadge.tsx`** | Universal tool version badge (e.g. `v1.23`) with emerald status pulse indicator, monospace typography, and subtle border styling. |
| **`src/components/tour/WebsiteTourModal.tsx`** | Interactive responsive Website Tour system guiding users through Prachurjo tools, AI Bot, TikTok Reels & Prompts (PTCopy), Media Downloaders, Image Compressor & 60+ SFX. |
| **`src/components/tour/WebsiteTourTrigger.tsx`** | Global trigger manager auto-starting Website Tour for first-time visitors (`localStorage`), with visible UI tour icons removed from header. |
| **`src/lib/reelsDeduplication.ts`** | URL normalization, media ID extractor, and anti-duplicate prevention engine querying Supabase `reels_posts` database table directly. |
| **`src/pages/ReelsFeed.tsx`** | TikTok-style Reels & Prompts Feed connected directly and exclusively to the Supabase `reels_posts` database table with real-time postgres changes subscription, zero local/seed fallbacks, 1-Click Prompt Copy, and unauthenticated public upload capabilities. |
| **`src/pages/ReelsUpload.tsx`** | Dedicated, mobile-friendly upload page with multi-provider clean TikTok media extraction, and Gemini 3.7-flash AI assistant panel supporting copyable visual prompt enhancement, Bengali-English cross-translation, and creative hook/concept generation. |
| **`src/components/reels/ImageAudioMediaContainer.tsx`** | Specialized media container wrapper detecting image-based posts (single photo or slideshows) with audio URLs, featuring IntersectionObserver viewport auto-play detection, audio waveform indicators, slide carousel navigation, double-tap to like, timeline progress bar, and browser unmuted autoplay fallback. |
| **`src/components/reels/ReelCustomPlayer.tsx`** | Custom 9:16 video/photo player with instant auto-play on scroll, specialized ImageAudioMediaContainer delegation for image posts, unmuted/muted browser policy fallback, floating 1-tap sound unmuting, auto-hiding controls, animated play/pause indicator, seek timeline, double-tap to like, volume, speed, and loop toggles. |
| **`src/components/reels/ReelSideActions.tsx`** | Floating side action bar with 1-Click Prompt Copy (PTCopy) button with animated checkmark, live copy counter, like button, creator follow toggle, and full prompt modal trigger. |
| **`src/components/reels/UploadReelModal.tsx`** | Direct-to-database Upload & Publish modal with duplicate URL prevention, clean TikTok extraction, category selection, prompt text, and unauthenticated creation support. |
| **`src/pages/PromptDetailsPage.tsx`** | Dedicated full-page Prompt Details viewer fetching directly from the Supabase `reels_posts` table with 1-click prompt copying and smart bot launcher. |
| **`src/context/TaskProgressContext.tsx`** | Global background task management context with streaming download progress reader (`ReadableStreamDefaultReader`), byte/speed calculation, task cancellation (`AbortController`), and task state updates. |
| **`src/components/GlobalTopProgressBar.tsx`** | Global slim top-of-screen animated progress bar indicator for all active downloads, transcoding, and compression operations. |
| **`src/components/GlobalTaskHUD.tsx`** | Interactive floating bottom-right task monitor HUD providing live progress bars, speed metrics, cancel buttons, and auto-dismissing completed task notifications. |
| **`src/components/TaskProgressCard.tsx`** | Reusable in-page animated progress bar card displaying task title, step message, percentage, transferred bytes, and cancel trigger. |
| **`src/lib/youtubeDb.ts`** | Central database & persistent cache layer for YouTube Tools (`yt_channels`, `yt_videos`, `yt_generated_titles`, `yt_generated_descriptions`). Features tiered caching (Memory -> LocalStorage -> Supabase), token-saving cache lookups, and the SmartBot Brain Knowledge Aggregation Engine (`queryKnowledgeForBot`, `getDatabaseKnowledgeSummary`). |
| **`src/pages/ApiKeysDashboard.tsx`** | Complete Developer Portal with secret API key generation/revocation/regeneration, 1-click AI Copilot Prompt Generator (for ChatGPT, Claude, Cursor), live interactive request sandbox/tester with latency metrics, status code matrix, and multi-language code snippets (cURL, JS Fetch, Python, Node.js Axios, PHP, Flutter). |
| **`server.ts`** | Express backend server containing global CORS headers middleware (`Access-Control-Allow-Origin: *`), universal media proxy endpoint (`/api/proxy/media`), and multi-provider extraction engines for TikTok, Facebook, Pinterest (recursive shortlink resolver + direct HTML parser + multi-API fallback + Smart Fallback Engine), and Instagram (embed scraper + SnapSave + multi-API fallback + Smart Fallback Engine), ensuring 100% extraction reliability and CORS bypass on production deployments. |
| **`src/components/RecentlyUsedTools.tsx`** | Horizontal clickable list/carousel of recently visited tools with relative timestamps, category tags, horizontal scrolling, and quick removal. |
| **`src/components/SmartBotTour.tsx`** | Lightweight interactive onboarding tour & spotlight tooltip system guiding new homepage visitors through the Smart Bot launcher, proactive attachment workflow, and interactive cropper. |
| **`src/hooks/useRecentTools.ts`** | Custom React hook managing recently used tools, localStorage persistence, visit counts, and relative time formatting. |
| **`src/data/chatdata.json`** | Pre-loaded SmartBot conversational dataset in JSON format containing over **33,000+ unique keyword/phrase trigger variations** in Bangla, Banglish, and English paired with randomized reply variations and console slash commands to deliver instant offline conversational responses. |
| **`src/lib/smartBotMemory.ts`** | SmartBot persistent Memory Engine that automatically parses user chat messages, extracts YouTube/TikTok/Facebook links and image attachments, saves them into local persistent memory, answers user history queries (e.g. *"amar YouTube link gulo deo"*, *"amar all images gulo deo"*), and features dynamic round-robin response variation selection for `chatdata.json` to prevent repetitive answers. |
| **`src/lib/botLogic.ts`** | Central AI Bot brain & persistent memory orchestration layer with proactive media detection (`detectMediaTypeFromInput`, `getPoliteOptionsPrompt`), contextual follow-up parsing, channel memory, conversational context builder, and zero-API-key regex parsers. |
| **`src/lib/webLlmService.ts`** | Client-side WebGPU WebLLM engine service supporting `rony1234554321/SmolLM2-135M-Instruct-q4f16_1-MLC-bucket` and official MLC SmolLM2-135M on-device models with streaming tokens and loading progress tracking. |
| **`src/pages/SmartBot.tsx`** | Interactive Smart AI Bot & Automation chat with automatic TikTok & Facebook video link detection, AI model engine switcher (Gemini Cloud vs local WebGPU SmolLM2), proactive attachment options, contextual media follow-ups, 1-click Brain Memory management modal, persistent conversation history, live YouTube querying, interactive in-chat image cropper/converters, a dynamic, auto-summarized 'Context Card' highlighting discussed links, and a live, real-time **AI Chat Metrics & Analytics Dashboard** tracking exchange volumes, response latency, match accuracy, memory sizes, and feature breakdown counts. |
| **`src/components/bot/TikTokBotCard.tsx`** | Dedicated TikTok result card component for SmartBot with author info, play/like/share stats, 1080p No-Watermark MP4 download, MP3 audio player & download, and cover photo saver. |
| **`src/components/bot/FacebookBotCard.tsx`** | Dedicated Facebook result card component for SmartBot with public video/reel metadata, 1080p/720p HD MP4 download, MP3 audio player & download, and thumbnail saver. |
| **`src/components/bot/PinterestBotCard.tsx`** | Dedicated Pinterest result card component for SmartBot with Pin video MP4 download, audio extraction to MP3, and high-res cover thumbnail download. |
| **`src/components/bot/InstagramBotCard.tsx`** | Dedicated Instagram result card component for SmartBot supporting video/reel MP4 download, audio extraction to MP3, carousel multi-slide item selector, and cover photo download. |
| **`src/components/bot/InChatCropper.tsx`** | Rich in-chat interactive cropper component embedded directly in conversation flow with aspect presets (1:1, 16:9, 9:16, 4:3, 3:2, Free), real-time zoom (1x-3x), rotation (0°-360°), horizontal/vertical flip, and multi-format export. |
| **`src/pages/Home.tsx`** | Ultra-lightweight, minimal, and fast-loading Creator Studio homepage with instant search, compact category filter pills, direct 1-click tool launcher cards, and fast Recently Used integration. |
| **`src/pages/ImageCropper.tsx`** | Dedicated Image Cropper with `react-easy-crop`, aspect presets (Free, 1:1, 4:3, 16:9, 9:16, 3:2), zoom, rotation, flip, and sound feedback. |
| **`src/lib/cropImage.ts`** | Canvas extraction utility executing rotational and flip calculations to output high-resolution Blobs. |
| **`src/lib/imageProcessor.ts`** | Central image processing engine providing canvas load/convert, web-worker offload, `drawWatermarkOnCanvas` for brand watermarking (`prachurjo`), `formatPrachurjoDownloadName` for standardized branded file downloads, and memory safety optimizations. |
| **`src/pages/ImageCompressor.tsx`** | Dedicated image compressor with 10–100 quality slider, canvas scaling, live size metrics, optional `prachurjo` brand watermark customization, and branded file downloads. |
| **`src/pages/ImageConverter.tsx`** | Format converter supporting JPEG, PNG, WebP, AVIF, and BMP with canvas rendering, `prachurjo` brand watermark options, and branded file downloads. |
| **`src/pages/MenuDirectory.tsx`** | Complete categorized directory view for Image Tools, YouTube Tools, AI Hub, and Text Utilities. |
| **`src/components/layout/AppLayout.tsx`** | Responsive app shell containing categorized collapsible navigation menus, global controls, 1-click Top Header Bot button, and automatic route visit tracking. |
| **`src/pages/SoundEffectsLibrary.tsx`** | Dedicated SFX & Audio Studio Hub allowing users to preview, filter, search, copy file paths, and download 60+ royalty-free WAV sound effects (Core + SFX50+). |
| **`src/components/SoundEffectsController.tsx`** | Global interactive sound dialog featuring category tabs, instant preview, volume controls, and direct 1-click WAV sound downloads. |
| **`src/lib/sound.ts`** | Complete sound manager and SFX audio engine housing metadata for 61 studio sound effects across 6 distinct categories (Impact, Bass, Sci-Fi, Clicks, Bursts, Ambient) with Web Audio API synthesis fallback and local storage persistence. |

| **`metadata.json`** | Application metadata definition file configured with clean, empty frame permissions array (`requestFramePermissions: []`) to eliminate unwanted outer container permission dialogs and prevent auto-refreshing on preview load. |
| **`src/config/version.ts`** | Universal Application & Tools Version Control singleton exporting `APP_VERSION` (`v1.30`) and `APP_BUILD_DATE` to ensure all UI badges, tool footers, and dashboards stay strictly synchronized. |

---

## 📌 Automatic Documentation Protocol
> **Rule:** Whenever files or folders are modified or added, this `FOLDER_STRUCTURE.md` is updated to keep documentation synchronized.
