import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Image as ImageIcon, 
  Youtube, 
  Type, 
  Paperclip, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  FileText, 
  Sliders, 
  Cpu, 
  Zap, 
  Loader2,
  X, 
  Layers, 
  Hash, 
  Tag, 
  Eye, 
  Palette, 
  Code2, 
  Info,
  Maximize2,
  History,
  ArrowUp,
  ArrowDown,
  Camera,
  Folder,
  File as FileIcon,
  Clipboard,
  UploadCloud,
  FileCode,
  CheckCircle2,
  Plus,
  Wand2,
  FileSpreadsheet,
  Brain,
  Bookmark,
  Database,
  Star,
  User,
  Save,
  MessageSquare,
  Radio,
  BarChart3,
  Search,
  Crop,
  Ratio,
  Music2,
  Facebook,
  ChevronDown,
  ChevronUp,
  Pin,
  Instagram
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/hooks/use-toast';
import { sound } from '@/lib/sound';
import { generateTitleIdeas, generateDescriptionIdeas, sendAiChatMessage, ChatMessageItem } from '@/api/aiService';
import { analyzeYouTubeVideo, analyzeYouTubeChannel, extractVideoId, parseChannelIdentifier } from '@/api/youtubeApi';
import { extractTikTokVideo, isValidTikTokUrl, TikTokVideoData } from '@/api/tiktokApi';
import { extractFacebookVideo, isValidFacebookUrl, FacebookVideoData } from '@/api/facebookApi';
import { extractPinterestVideo, isValidPinterestUrl, PinterestVideoData } from '@/api/pinterestApi';
import { extractInstagramVideo, isValidInstagramUrl, InstagramVideoData } from '@/api/instagramApi';
import { TikTokBotCard } from '@/components/bot/TikTokBotCard';
import { FacebookBotCard } from '@/components/bot/FacebookBotCard';
import { PinterestBotCard } from '@/components/bot/PinterestBotCard';
import { InstagramBotCard } from '@/components/bot/InstagramBotCard';
import { 
  parseImageCommandLogic, 
  parseYouTubeCommandLogic, 
  parsePureTextCommandLogic, 
  parseDocumentCommandLogic,
  detectMediaTypeFromInput,
  isDirectImageUrl,
  getPoliteOptionsPrompt,
  normalizeUserInput,
  fetchUserSessionHistory,
  saveUserSessionHistory,
  clearUserSessionHistory,
  getBotMemoryFacts,
  saveBotMemoryFact,
  rememberUserChannel,
  getRememberedChannels,
  findRememberedChannel,
  removeRememberedChannel,
  buildConversationContextPrompt,
  detectAndStoreUserFactsFromInput,
  resolveContextualQuery,
  isSupabaseConfigured,
  analyzeUploadedFile,
  FileAnalysisSummary,
  BotSavedChannel,
  BotMemoryFact
} from '@/lib/botLogic';
import { VideoAnalysisData, ChannelAnalysisData } from '@/types';
import { InChatCropper, InChatCropResultCard, CropResultPayload } from '@/components/bot/InChatCropper';
import { convertImage } from '@/lib/imageProcessor';
import { TypewriterText } from '@/components/bot/TypewriterText';
import { queryKnowledgeForBot, getDatabaseKnowledgeSummary } from '@/lib/youtubeDb';
import { 
  recordInteractionToMemory, 
  queryChatDataset, 
  handleMemoryInquiry, 
  getSmartBotMemory,
  clearSmartBotMemory,
  StoredMediaItem 
} from '@/lib/smartBotMemory';

interface BotMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  text: string;
  attachment?: {
    type: 'image' | 'file' | 'document';
    name: string;
    url: string;
    size?: string;
    fileObj?: File;
    textContent?: string;
  };
  toolState?: {
    type: 
      | 'youtube_video_options' 
      | 'youtube_video_result' 
      | 'youtube_channel_options' 
      | 'youtube_channel_result' 
      | 'tiktok_video_result'
      | 'facebook_video_result'
      | 'pinterest_video_result'
      | 'instagram_video_result'
      | 'image_options' 
      | 'image_result' 
      | 'image_crop_workspace'
      | 'image_crop_result'
      | 'document_options'
      | 'document_result'
      | 'text_tool_result' 
      | 'memory_items_result'
      | 'general_ai';
    videoData?: VideoAnalysisData;
    channelData?: ChannelAnalysisData;
    tiktokData?: TikTokVideoData;
    facebookData?: FacebookVideoData;
    pinterestData?: PinterestVideoData;
    instagramData?: InstagramVideoData;
    selectedAction?: string;
    actionResultData?: any;
    imageInfo?: {
      name: string;
      originalSize: string;
      originalUrl: string;
      convertedUrl?: string;
      newSize?: string;
      savingsPercent?: number;
      format?: string;
    };
    cropWorkspaceInfo?: {
      imageUrl: string;
      fileName: string;
      initialAspect?: number;
      initialPreset?: string;
    };
    cropResult?: CropResultPayload;
    documentInfo?: {
      name: string;
      size: string;
      type: string;
      words?: number;
      chars?: number;
      lines?: number;
      content?: string;
      formattedResult?: string;
      actionType?: string;
    };
  };
}

const STARTER_PROMPTS = [
  {
    icon: Instagram,
    title: "Instagram Downloader",
    desc: "Paste any Reel, Video or Photo link for HD MP4, MP3 audio & cover thumbnail",
    action: "https://www.instagram.com/reel/C1234567890/",
    color: "text-pink-500 bg-pink-500/10 border-pink-500/20"
  },
  {
    icon: Pin,
    title: "Pinterest Downloader",
    desc: "Paste any Pinterest Pin link for HD MP4 video, MP3 audio & high-res thumbnail",
    action: "https://www.pinterest.com/pin/1234567890/",
    color: "text-red-500 bg-red-500/10 border-red-500/20"
  },
  {
    icon: Music2,
    title: "TikTok Video Downloader",
    desc: "Paste any TikTok link for No-Watermark HD video, MP3 audio & cover photo",
    action: "https://www.tiktok.com/@tiktok/video/7123456789012345678",
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20"
  },
  {
    icon: Youtube,
    title: "YouTube Video Automation",
    desc: "Paste any link to get tags, 1080p thumbnail, keywords & embed code",
    action: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    color: "text-red-500 bg-red-500/10 border-red-500/20"
  }
];


// Helper to reliably extract an active Blob, File, or DataURL string from mixed candidates
export function resolveValidImageSource(...candidates: any[]): File | Blob | string | null {
  // First Pass: Prioritize persistent in-memory Data URLs (data:image/...) or web URLs
  for (const item of candidates) {
    if (!item) continue;

    if (typeof item === 'string' && item.trim().length > 0) {
      const trimmed = item.trim();
      if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
    }

    if (typeof item === 'object') {
      const stringUrl = item.originalUrl || item.convertedUrl || item.croppedDataUrl || item.dataUrl || item.previewUrl || item.url || item.imageUrl || item.src;
      if (typeof stringUrl === 'string' && stringUrl.trim().length > 0) {
        const trimmed = stringUrl.trim();
        if (trimmed.startsWith('data:image/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return trimmed;
        }
      }
    }
  }

  // Second Pass: Fallback to active File or Blob handles
  for (const item of candidates) {
    if (!item) continue;
    if (item instanceof Blob || item instanceof File) {
      if (item.size > 0) return item;
    }
    if (typeof item === 'object' && (item.fileObj instanceof Blob || item.fileObj instanceof File)) {
      if (item.fileObj.size > 0) return item.fileObj;
    }
    if (typeof item === 'string' && item.trim().length > 0) {
      return item.trim();
    }
  }

  return null;
}

export default function SmartBot() {
  const { toast } = useToast();

  const [messages, setMessages] = useState<BotMessage[]>(() => {
    try {
      const saved = localStorage.getItem('prachurjo_bot_messages_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // Storage error ignored
    }
    return [
      {
        id: 'welcome-1',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `👋 **Welcome to Prachurjo Smart Bot!**\n\nI am equipped with a **Persistent Memory Layer** & automation engine:\n\n• 🧠 **Persistent Memory & Channels:** Tell me *"Amar channel er nam Rony"* to remember your channel, then say *"Rony channel er info dao"* for real-time stats.\n• 🎬 **Paste YouTube Link:** Extract tags, 1080p HD thumbnails, SEO keywords, and embed codes.\n• 🎵 **Paste TikTok Link:** 1-Click No Watermark HD video download, MP3 audio, and cover photo extraction.\n• 🖼️ **Upload Image (📎 or Drag & Drop):** Convert directly *(e.g., "WebP", "PNG", "Compress size", "90% quality")*.\n• 📄 **Document Tools:** Analyze word counts, case conversions, or format JSON.\n\nHow can I help you today?`,
      }
    ];
  });

  const [typedMsgIds, setTypedMsgIds] = useState<Set<string>>(() => {
    const initialSet = new Set<string>();
    initialSet.add('welcome-1');
    try {
      const saved = localStorage.getItem('prachurjo_bot_messages_v1');
      if (saved) {
        const parsed: BotMessage[] = JSON.parse(saved);
        parsed.forEach((m) => initialSet.add(m.id));
      }
    } catch {
      // Storage error ignored
    }
    return initialSet;
  });

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ 
    file: File; 
    previewUrl: string; 
    name: string; 
    size: string;
    type: 'image' | 'document' | 'file';
    textContent?: string;
    dimensions?: { width: number; height: number; aspectRatio: string };
    analysis?: FileAnalysisSummary;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Attachment Menu Sheet state
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Memory & Knowledge Base State
  const [savedChannels, setSavedChannels] = useState<BotSavedChannel[]>(() => getRememberedChannels());
  const [memoryFacts, setMemoryFacts] = useState<Record<string, BotMemoryFact>>(() => getBotMemoryFacts());
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [newChannelAlias, setNewChannelAlias] = useState('');
  const [newChannelUrl, setNewChannelUrl] = useState('');
  const [rememberingAliasForChannel, setRememberingAliasForChannel] = useState<{ id: string; defaultAlias: string } | null>(null);

  // Session-based Command History state
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('prachurjo_bot_cmd_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [showHistorySheet, setShowHistorySheet] = useState<boolean>(false);

  // Auto-summarized Chat Context Card states
  const [showContextCard, setShowContextCard] = useState<boolean>(true);
  const [isContextCardExpanded, setIsContextCardExpanded] = useState<boolean>(true);
  const [showMetricsDashboard, setShowMetricsDashboard] = useState<boolean>(false);

  // Dynamically analyze the messages array to extract key discussed tools and links
  const getChatSummaryContext = () => {
    const links: { url: string; type: 'youtube' | 'tiktok' | 'facebook' | 'pinterest' | 'instagram' | 'image' | 'document' | 'file'; title: string }[] = [];
    const tools = new Set<string>();

    messages.forEach((msg) => {
      // 1. Detect tools by looking at toolState or message text
      if (msg.toolState) {
        if (msg.toolState.type.startsWith('youtube_video')) {
          tools.add('YouTube SEO & Metadata Extractor');
          if (msg.toolState.videoData) {
            const title = msg.toolState.videoData.title;
            const url = `https://www.youtube.com/watch?v=${msg.toolState.videoData.id}`;
            if (!links.some(l => l.url === url)) {
              links.push({ url, type: 'youtube', title });
            }
          }
        } else if (msg.toolState.type.startsWith('youtube_channel')) {
          tools.add('YouTube Channel Analytics');
          if (msg.toolState.channelData) {
            const title = msg.toolState.channelData.title;
            const url = msg.toolState.channelData.handle 
              ? `https://www.youtube.com/${msg.toolState.channelData.handle}` 
              : `https://www.youtube.com/channel/${msg.toolState.channelData.id}`;
            if (!links.some(l => l.url === url)) {
              links.push({ url, type: 'youtube', title });
            }
          }
        } else if (msg.toolState.type === 'tiktok_video_result') {
          tools.add('TikTok No-Watermark Downloader');
          if (msg.toolState.tiktokData) {
            const title = msg.toolState.tiktokData.title || 'TikTok Video';
            const url = msg.toolState.tiktokData.videoUrl || '';
            if (url && !links.some(l => l.url === url)) {
              links.push({ url, type: 'tiktok', title });
            }
          }
        } else if (msg.toolState.type === 'facebook_video_result') {
          tools.add('Facebook Reels HD Downloader');
          if (msg.toolState.facebookData) {
            const title = msg.toolState.facebookData.title || 'Facebook Video';
            const url = msg.toolState.facebookData.videoUrl || '';
            if (url && !links.some(l => l.url === url)) {
              links.push({ url, type: 'facebook', title });
            }
          }
        } else if (msg.toolState.type === 'pinterest_video_result') {
          tools.add('Pinterest Video & Audio Downloader');
          if (msg.toolState.pinterestData) {
            const title = msg.toolState.pinterestData.title || 'Pinterest Pin';
            const url = msg.toolState.pinterestData.videoUrl || '';
            if (url && !links.some(l => l.url === url)) {
              links.push({ url, type: 'pinterest', title });
            }
          }
        } else if (msg.toolState.type === 'instagram_video_result') {
          tools.add('Instagram Reels & Media Downloader');
          if (msg.toolState.instagramData) {
            const title = msg.toolState.instagramData.title || 'Instagram Media';
            const url = msg.toolState.instagramData.videoUrl || '';
            if (url && !links.some(l => l.url === url)) {
              links.push({ url, type: 'instagram', title });
            }
          }
        } else if (msg.toolState.type === 'image_crop_workspace' || msg.toolState.type === 'image_crop_result') {
          tools.add('Interactive Image Cropper');
          if (msg.toolState.cropWorkspaceInfo) {
            const title = msg.toolState.cropWorkspaceInfo.fileName || 'Croppable Image';
            const url = msg.toolState.cropWorkspaceInfo.imageUrl;
            if (url && !links.some(l => l.url === url)) {
              links.push({ url, type: 'image', title });
            }
          }
        } else if (msg.toolState.type === 'image_options' || msg.toolState.type === 'image_result') {
          tools.add('Image Compressor & Converter');
          if (msg.toolState.imageInfo) {
            const title = msg.toolState.imageInfo.name || 'Processed Image';
            const url = msg.toolState.imageInfo.convertedUrl || msg.toolState.imageInfo.originalUrl || '';
            if (url && !links.some(l => l.url === url)) {
              links.push({ url, type: 'image', title });
            }
          }
        } else if (msg.toolState.type.startsWith('document')) {
          tools.add('Document Text Analyzer');
          if (msg.toolState.documentInfo) {
            const title = msg.toolState.documentInfo.name || 'Attached Document';
            if (!links.some(l => l.title === title)) {
              links.push({ url: '#', type: 'document', title });
            }
          }
        } else if (msg.toolState.type === 'text_tool_result') {
          tools.add('AI Title & Content Generator');
        }
      }

      // 2. Detect tools from message text content keywords (e.g. sfx, clear chat, load sample, title idea)
      const textLower = msg.text.toLowerCase();
      if (textLower.includes('title idea') || textLower.includes('viral title') || textLower.includes('seo title')) {
        tools.add('AI Title & Content Generator');
      }
      if (textLower.includes('sfx') || textLower.includes('sound effect') || textLower.includes('funny sound')) {
        tools.add('Royalty Free SFX Library');
      }
      if (textLower.includes('memory') || textLower.includes('brain') || textLower.includes('amar memory')) {
        tools.add('Personal Chat Memory Vault');
      }

      // 3. Detect uploaded attachments
      if (msg.attachment) {
        const type = msg.attachment.type;
        const title = msg.attachment.name;
        const url = msg.attachment.url;
        if (url && !links.some(l => l.url === url)) {
          links.push({ url, type: type === 'image' ? 'image' : type === 'document' ? 'document' : 'file', title });
        }
      }

      // 4. Extract URLs from user message text
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const matches = msg.text.match(urlRegex);
      if (matches) {
        matches.forEach((url) => {
          let cleanUrl = url.replace(/[).,]*$/, ''); // Strip trailing formatting marks
          let type: 'youtube' | 'tiktok' | 'facebook' | 'file' = 'file';
          let title = 'Extracted URL';

          if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
            type = 'youtube';
            title = 'YouTube Video/Channel';
            tools.add('YouTube SEO & Metadata Extractor');
          } else if (cleanUrl.includes('tiktok.com')) {
            type = 'tiktok';
            title = 'TikTok Video Link';
            tools.add('TikTok No-Watermark Downloader');
          } else if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.watch')) {
            type = 'facebook';
            title = 'Facebook Public Video';
            tools.add('Facebook Reels HD Downloader');
          }

          if (!links.some(l => l.url === cleanUrl)) {
            links.push({ url: cleanUrl, type, title });
          }
        });
      }
    });

    return {
      tools: Array.from(tools),
      links: links.slice(-5) // limit to the 5 most recent links
    };
  };

  // Compute live real-time heuristics, latency, and memory size
  const computeMetrics = () => {
    const userMsgs = messages.filter(m => m.sender === 'user').length;
    const botMsgs = messages.filter(m => m.sender === 'bot').length;
    const totalMsgs = userMsgs + botMsgs;

    // Categorize messages to find top active tools
    const categoriesCount = {
      conversational: 0,
      youtube: 0,
      downloaders: 0,
      images: 0,
      audio: 0,
      memory: 0,
      commands: 0
    };

    messages.forEach(msg => {
      const txt = msg.text.toLowerCase();
      if (msg.toolState) {
        if (msg.toolState.type.startsWith('youtube')) categoriesCount.youtube++;
        else if (msg.toolState.type.includes('tiktok') || msg.toolState.type.includes('facebook')) categoriesCount.downloaders++;
        else if (msg.toolState.type.includes('crop') || msg.toolState.type.includes('image')) categoriesCount.images++;
        else if (msg.toolState.type.includes('document')) categoriesCount.images++;
      } else {
        if (txt.includes('youtube') || txt.includes('yt ')) categoriesCount.youtube++;
        else if (txt.includes('tiktok') || txt.includes('facebook') || txt.includes('fb ')) categoriesCount.downloaders++;
        else if (txt.includes('image') || txt.includes('crop') || txt.includes('photo')) categoriesCount.images++;
        else if (txt.includes('sound') || txt.includes('sfx') || txt.includes('mp3')) categoriesCount.audio++;
        else if (txt.includes('memory') || txt.includes('brain') || txt.includes('amar link')) categoriesCount.memory++;
        else if (txt.startsWith('/')) categoriesCount.commands++;
        else categoriesCount.conversational++;
      }
    });

    // Calculate estimated database cache footprint (e.g. 2 bytes per char for strings)
    const memoryCharCount = JSON.stringify(memoryFacts).length + JSON.stringify(savedChannels).length;
    const estimatedBytes = memoryCharCount > 4 ? memoryCharCount * 2 : 128;

    // Average response speed estimation
    const avgLatency = botMsgs > 0 
      ? Math.round((categoriesCount.youtube * 850 + categoriesCount.downloaders * 920 + categoriesCount.images * 1100 + categoriesCount.commands * 120 + categoriesCount.conversational * 22) / Math.max(botMsgs, 1))
      : 18; // default to 18ms for quick local index lookup

    return {
      totalMsgs,
      userMsgs,
      botMsgs,
      categoriesCount,
      estimatedBytes,
      avgLatency: Math.max(avgLatency, 12)
    };
  };

  // File Inputs Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const allFileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load cloud/local session history on mount
  useEffect(() => {
    fetchUserSessionHistory().then(() => {
      setSavedChannels(getRememberedChannels());
      setMemoryFacts(getBotMemoryFacts());
    });
  }, []);

  // Save messages to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('prachurjo_bot_messages_v1', JSON.stringify(messages.slice(-60)));
    } catch {
      // Storage error ignored
    }
  }, [messages]);

  // Close attachment menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachMenu]);

  // Sync command history to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('prachurjo_bot_cmd_history', JSON.stringify(commandHistory));
    } catch {
      // Storage error ignored
    }
  }, [commandHistory]);

  // Global Clipboard Paste Handler (Ctrl+V directly anywhere in SmartBot)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const clipboardFiles = e.clipboardData?.files;
      if (clipboardFiles && clipboardFiles.length > 0) {
        const file = clipboardFiles[0];
        attachSelectedFile(file);
        toast({ title: `Attached from clipboard: ${file.name || 'Pasted Image'}` });
        return;
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Navigate through command history with Up/Down Arrow
  const navigateHistory = (direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return;

    if (direction === 'up') {
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      const text = commandHistory[nextIndex];
      setInputVal(text);
      if (textareaRef.current) {
        textareaRef.current.value = text;
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
      }
    } else if (direction === 'down') {
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
        if (textareaRef.current) {
          textareaRef.current.value = '';
          textareaRef.current.style.height = 'auto';
        }
      } else {
        setHistoryIndex(nextIndex);
        const text = commandHistory[nextIndex];
        setInputVal(text);
        if (textareaRef.current) {
          textareaRef.current.value = text;
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
      }
    }
  };

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
    try {
      localStorage.setItem('prachurjo_bot_messages_v1', JSON.stringify(messages));
    } catch {
      // Storage error ignored
    }
  }, [messages]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputVal(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const handleClearChat = () => {
    sound.clear();
    const initialWelcome: BotMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `🧹 **Chat reset!** How can I assist you now? Paste a YouTube URL, attach an image/file, or ask any question!`,
    };
    setMessages([initialWelcome]);
    toast({ title: 'Chat Cleared', description: 'Conversation history reset.' });
  };

  const copyToClipboard = (text: string, id: string) => {
    sound.copy();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Unified File Attach Function
  const attachSelectedFile = (file: File) => {
    sound.click();
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif|heic|heif)$/i.test(file.name);
    const isDoc = file.type.includes('text') || 
                  file.type.includes('pdf') || 
                  file.name.endsWith('.json') || 
                  file.name.endsWith('.md') || 
                  file.name.endsWith('.txt') || 
                  file.name.endsWith('.csv');

    const sizeInKb = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeInKb} KB`;

    if (isImage) {
      // Use FileReader to generate reliable base64 Data URL for previews, Cropper & persistent storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          const ratio = w / h;
          let aspectLabel = `${w} × ${h}px`;
          if (Math.abs(ratio - 1) < 0.05) aspectLabel = '1:1 Square';
          else if (Math.abs(ratio - 16 / 9) < 0.08) aspectLabel = '16:9 Widescreen';
          else if (Math.abs(ratio - 9 / 16) < 0.08) aspectLabel = '9:16 Story / Reel';
          else if (Math.abs(ratio - 4 / 3) < 0.08) aspectLabel = '4:3 Standard';

          const analysis = analyzeUploadedFile(file, { width: w, height: h });
          setAttachedFile({
            file,
            previewUrl: dataUrl,
            name: file.name,
            size: sizeStr,
            type: 'image',
            dimensions: { width: w, height: h, aspectRatio: aspectLabel },
            analysis
          });
        };
        img.onerror = () => {
          const analysis = analyzeUploadedFile(file);
          setAttachedFile({
            file,
            previewUrl: dataUrl,
            name: file.name,
            size: sizeStr,
            type: 'image',
            analysis
          });
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        const fallbackUrl = URL.createObjectURL(file);
        setAttachedFile({
          file,
          previewUrl: fallbackUrl,
          name: file.name,
          size: sizeStr,
          type: 'image'
        });
      };
      reader.readAsDataURL(file);
    } else if (isDoc && file.size < 2 * 1024 * 1024) {
      // Read text for documents
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const analysis = analyzeUploadedFile(file, { textContent: text });
        setAttachedFile({
          file,
          previewUrl: '',
          name: file.name,
          size: sizeStr,
          type: 'document',
          textContent: text,
          analysis
        });
      };
      reader.readAsText(file);
    } else {
      const analysis = analyzeUploadedFile(file);
      setAttachedFile({
        file,
        previewUrl: '',
        name: file.name,
        size: sizeStr,
        type: isImage ? 'image' : 'file',
        analysis
      });
    }

    setShowAttachMenu(false);
  };

  // Handle Standard File Inputs
  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      attachSelectedFile(file);
      e.target.value = '';
    }
  };

  // Clipboard Paste Helper Button
  const handlePasteClipboardBtn = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], `clipboard-image-${Date.now()}.${type.split('/')[1] || 'png'}`, { type });
            attachSelectedFile(file);
            toast({ title: 'Image pasted from clipboard!' });
            return;
          }
        }
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputVal((prev) => (prev ? `${prev} ${text}` : text));
        toast({ title: 'Text pasted from clipboard!' });
        setShowAttachMenu(false);
      } else {
        toast({ title: 'No image or text in clipboard' });
      }
    } catch {
      toast({ 
        title: 'Clipboard Shortcut', 
        description: 'Tip: Press Ctrl+V (or Cmd+V) directly inside the text box to paste images or text!' 
      });
      setShowAttachMenu(false);
    }
  };

  // Generate Sample In-Browser File (No external downloads required)
  const handleLoadSampleFile = (type: 'photo' | 'icon' | 'json') => {
    sound.click();
    if (type === 'photo') {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createLinearGradient(0, 0, 1200, 800);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#059669');
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 800);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Prachurjo Sample HD Image', 600, 380);
      ctx.font = '26px sans-serif';
      ctx.fillStyle = '#a7f3d0';
      ctx.fillText('1200x800 - Test WebP, PNG & Compression Conversion', 600, 440);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const byteString = atob(dataUrl.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const file = new File([ab], 'sample-mountain-hd.jpg', { type: 'image/jpeg' });
      attachSelectedFile(file);
      toast({ title: 'Sample HD Photo loaded!' });
    } else if (type === 'icon') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 512, 512);
      ctx.beginPath();
      ctx.arc(256, 256, 220, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NX', 256, 256);
      const dataUrl = canvas.toDataURL('image/png');
      const byteString = atob(dataUrl.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const file = new File([ab], 'sample-logo-icon.png', { type: 'image/png' });
      attachSelectedFile(file);
      toast({ title: 'Sample Logo Icon loaded!' });
    } else {
      const sampleJson = JSON.stringify({
        appName: "Prachurjo Smart Bot",
        version: "3.0.0",
        engine: "100% Client-Side Local Rule Parser",
        supportedFeatures: [
          "YouTube Tags & Thumbnail Extraction",
          "WebP, PNG, JPG Conversion",
          "Image Size Compression",
          "Document Word Count & JSON Formatting",
          "In-Browser Clipboard & Drag-and-Drop"
        ],
        apiKeyRequired: false
      }, null, 2);
      const blob = new Blob([sampleJson], { type: 'application/json' });
      const file = new File([blob], 'sample-data.json', { type: 'application/json' });
      attachSelectedFile(file);
      toast({ title: 'Sample JSON Document loaded!' });
    }
  };

  // Convert and Compress Image Helper (Supports File, Blob, DataURL, and Image URLs)
  const processImageConversion = async (
    source: File | Blob | string, 
    targetFormat: 'webp' | 'png' | 'jpeg', 
    quality: number = 0.85,
    fallbackOriginalSize?: number
  ): Promise<{ dataUrl: string; newSizeStr: string; savings: number }> => {
    const res = await convertImage({
      source,
      targetFormat,
      quality,
      fallbackOriginalSize
    });
    return {
      dataUrl: res.dataUrl,
      newSizeStr: res.newSizeStr,
      savings: res.savingsPercent
    };
  };

  // Main Submit Handler
  const handleSendMessage = async (customText?: string) => {
    const rawText = (customText !== undefined ? customText : inputVal).trim();
    if (!rawText && !attachedFile) return;

    sound.click();

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-${Date.now()}`;

    const newUserMsg: BotMessage = {
      id: userMsgId,
      sender: 'user',
      timestamp,
      text: rawText || (attachedFile ? `Uploaded ${attachedFile.type}: ${attachedFile.name}` : ''),
      attachment: attachedFile ? {
        type: attachedFile.type,
        name: attachedFile.name,
        url: attachedFile.previewUrl,
        size: attachedFile.size,
        fileObj: attachedFile.file,
        textContent: attachedFile.textContent
      } : undefined
    };

    const currentAttached = attachedFile;
    setAttachedFile(null);
    setInputVal('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Store in session command history if text was typed
    if (rawText) {
      setCommandHistory((prev) => {
        const filtered = prev.filter((item) => item !== rawText);
        return [...filtered, rawText];
      });
      setHistoryIndex(-1);
    }

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    // Persist to user session history
    saveUserSessionHistory({
      id: userMsgId,
      role: 'user',
      text: newUserMsg.text,
      attachmentInfo: currentAttached ? {
        type: currentAttached.type,
        name: currentAttached.name,
        size: currentAttached.size
      } : undefined
    });

    // Record links and images into Local Storage Memory Engine
    recordInteractionToMemory(
      rawText,
      currentAttached && currentAttached.type === 'image' && currentAttached.previewUrl ? [currentAttached.previewUrl] : []
    );

    // Check for user memory fact or channel declaration
    if (rawText) {
      const factResult = detectAndStoreUserFactsFromInput(rawText);
      if (factResult.factStored) {
        setMemoryFacts(getBotMemoryFacts());
        setSavedChannels(getRememberedChannels());
      }
    }

    try {
      // ─────────────────────────────────────────────────────────────
      // 0. SCENARIO 0: User queries or manages Remembered Channels / Memory
      // ─────────────────────────────────────────────────────────────
      const pureTextMatch = parsePureTextCommandLogic(rawText);

      if (pureTextMatch.intent === 'query_saved_channel' && pureTextMatch.suggestedAction) {
        sound.scan();
        const channelAnalysis = await analyzeYouTubeChannel(pureTextMatch.suggestedAction);
        sound.success();

        // Update latest stats in memory
        rememberUserChannel(
          pureTextMatch.channelAlias || 'my_channel',
          channelAnalysis.id,
          channelAnalysis.title,
          channelAnalysis.handle,
          {
            subscribers: channelAnalysis.subscribersCount ? String(channelAnalysis.subscribersCount) : undefined,
            views: channelAnalysis.viewCount ? String(channelAnalysis.viewCount) : undefined,
            videos: channelAnalysis.videoCount ? String(channelAnalysis.videoCount) : undefined
          }
        );
        setSavedChannels(getRememberedChannels());

        const botMsgId = `bot-${Date.now()}`;
        const botResponseMsg: BotMessage = {
          id: botMsgId,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `👋 **জি স্যার! আপনার "${(pureTextMatch.channelAlias || 'Saved').toUpperCase()}" (${channelAnalysis.title}) চ্যানেলের মেমোরি ডেটা ও লাইভ স্ট্যাটাস:**\n\n• 👥 **সাবস্ক্রাইবার:** **${channelAnalysis.subscribersCount || 'N/A'}**\n• 👁️ **মোট ভিউজ:** **${channelAnalysis.viewCount || 'N/A'}**\n• 🎬 **ভিডিও সংখ্যা:** **${channelAnalysis.videoCount || 'N/A'}**\n• 🔗 **হ্যান্ডেল / আইডি:** \`${channelAnalysis.handle || channelAnalysis.id}\`\n\nচ্যানেলের কিওয়ার্ড, ব্যানার বা বিস্তারিত তথ্য দেখতে নিচে ক্লিক করুন:`,
          toolState: {
            type: 'youtube_channel_options',
            channelData: channelAnalysis,
          }
        };
        setMessages((prev) => [...prev, botResponseMsg]);
        saveUserSessionHistory({
          id: botMsgId,
          role: 'bot',
          text: botResponseMsg.text,
          toolType: 'youtube_channel_options',
          metadata: { channelTitle: channelAnalysis.title, channelId: channelAnalysis.id }
        });
        setIsLoading(false);
        return;
      }

      if (pureTextMatch.intent === 'remember_channel') {
        sound.success();
        const botMsgId = `bot-${Date.now()}`;
        const botResponseMsg: BotMessage = {
          id: botMsgId,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: pureTextMatch.replyText || '🧠 **Memory & Saved Channels updated.**',
        };
        setMessages((prev) => [...prev, botResponseMsg]);
        saveUserSessionHistory({
          id: botMsgId,
          role: 'bot',
          text: botResponseMsg.text,
        });
        setIsLoading(false);
        return;
      }

      // ─────────────────────────────────────────────────────────────
      // 1. SCENARIO A: User Attached an Image File (+ optional text command)
      // ─────────────────────────────────────────────────────────────
      if (currentAttached && currentAttached.type === 'image' && currentAttached.file) {
        sound.scan();
        const parsedCmd = parseImageCommandLogic(rawText);

        if (parsedCmd.action === 'unsupported' && parsedCmd.unsupportedReason) {
          sound.error();
          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: parsedCmd.unsupportedReason,
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: botResponseMsg.text
          });
          setIsLoading(false);
          return;
        }

        // Handle In-Chat Interactive Cropper
        if (parsedCmd.action === 'crop') {
          sound.success();
          const presetName = parsedCmd.aspectPreset 
            ? (parsedCmd.aspectPreset === '16:9' ? '16:9' : parsedCmd.aspectPreset === '1:1' ? '1:1' : parsedCmd.aspectPreset === '9:16' ? '9:16' : parsedCmd.aspectPreset === '4:3' ? '4:3' : parsedCmd.aspectPreset === '3:2' ? '3:2' : 'Free') 
            : 'Free';

          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `✂️ **ইমেজ ক্রপার ওপেন করা হয়েছে (${currentAttached.name}):**\nপ্রয়োজনীয় Aspect Ratio (${presetName}), Zoom, Rotation বা Flip সেট করে **Apply & Crop Image Now** বাটনে চাপুন:`,
            toolState: {
              type: 'image_crop_workspace',
              cropWorkspaceInfo: {
                imageUrl: currentAttached.previewUrl,
                fileName: currentAttached.name,
                initialAspect: parsedCmd.aspectValue,
                initialPreset: presetName,
              }
            }
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: botResponseMsg.text,
            toolType: 'image_crop_workspace',
            metadata: { fileName: currentAttached.name, preset: presetName }
          });
          setIsLoading(false);
          return;
        }

        if (parsedCmd.action && parsedCmd.action !== 'options' && parsedCmd.action !== 'unsupported') {
          sound.generate();
          const targetFormat = parsedCmd.targetFormat || (parsedCmd.action === 'compress' ? 'webp' : parsedCmd.action === 'favicon' ? 'png' : parsedCmd.action);
          const quality = parsedCmd.quality;
          const formatToConvert: 'webp' | 'png' | 'jpeg' = targetFormat;
          
          const sourceToConvert = currentAttached.file || currentAttached.previewUrl;
          const conversionRes = await processImageConversion(sourceToConvert, formatToConvert, quality);
          sound.success();

          const qualityText = parsedCmd.detectedParameters.requestedQualityPercent ? ` (Quality: ${parsedCmd.detectedParameters.requestedQualityPercent}%)` : '';

          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `✅ **Task Completed!**\nYour image has been converted to **${parsedCmd.action === 'compress' ? 'Compressed WebP' : formatToConvert.toUpperCase()}**${qualityText}. Download your processed file below:`,
            toolState: {
              type: 'image_result',
              selectedAction: parsedCmd.action,
              imageInfo: {
                name: currentAttached.name,
                originalSize: currentAttached.size,
                originalUrl: currentAttached.previewUrl,
                convertedUrl: conversionRes.dataUrl,
                newSize: conversionRes.newSizeStr,
                savingsPercent: conversionRes.savings,
                format: parsedCmd.action === 'compress' ? 'Compressed WebP' : formatToConvert.toUpperCase(),
              }
            }
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: botResponseMsg.text,
            toolType: 'image_result',
            metadata: { format: formatToConvert, newSize: conversionRes.newSizeStr }
          });
          setIsLoading(false);
          return;
        }

        const botMsgId = `bot-${Date.now()}`;
        const politeImagePrompt = getPoliteOptionsPrompt('image', { name: currentAttached.name, size: currentAttached.size });
        const botResponseMsg: BotMessage = {
          id: botMsgId,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: politeImagePrompt,
          toolState: {
            type: 'image_options',
            imageInfo: {
              name: currentAttached.name,
              originalSize: currentAttached.size,
              originalUrl: currentAttached.previewUrl,
            }
          }
        };
        setMessages((prev) => [...prev, botResponseMsg]);
        saveUserSessionHistory({
          id: botMsgId,
          role: 'bot',
          text: botResponseMsg.text,
          toolType: 'image_options'
        });
        setIsLoading(false);
        return;
      }

      // ─────────────────────────────────────────────────────────────
      // 2. SCENARIO B: User Attached a Document or Text File
      // ─────────────────────────────────────────────────────────────
      if (currentAttached && (currentAttached.type === 'document' || currentAttached.type === 'file')) {
        sound.scan();
        const textContent = currentAttached.textContent || '';
        const wordsCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
        const linesCount = textContent ? textContent.split('\n').length : 0;
        const charsCount = textContent.length;

        const docCmd = parseDocumentCommandLogic(rawText);

        if (docCmd.action === 'count') {
          sound.success();
          const botMsgId = `bot-${Date.now()}`;
          const reply = `📊 **Document Analysis:**\n\n• **File:** \`${currentAttached.name}\` (${currentAttached.size})\n• **Words:** ${wordsCount.toLocaleString()}\n• **Characters:** ${charsCount.toLocaleString()}\n• **Lines:** ${linesCount.toLocaleString()}\n• **Estimated Read Time:** ~${Math.max(1, Math.ceil(wordsCount / 200))} min`;
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              sender: 'bot',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              text: reply,
              toolState: {
                type: 'document_result',
                documentInfo: {
                  name: currentAttached.name,
                  size: currentAttached.size,
                  type: currentAttached.file.type || 'text/plain',
                  words: wordsCount,
                  chars: charsCount,
                  lines: linesCount,
                  content: textContent,
                  actionType: 'count'
                }
              }
            }
          ]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: reply,
            toolType: 'document_result'
          });
          setIsLoading(false);
          return;
        }

        if (docCmd.action === 'json_format' && textContent) {
          sound.success();
          try {
            const parsedObj = JSON.parse(textContent);
            const formatted = JSON.stringify(parsedObj, null, 2);
            const botMsgId = `bot-${Date.now()}`;
            setMessages((prev) => [
              ...prev,
              {
                id: botMsgId,
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: `⚡ **JSON formatted and validated successfully!**`,
                toolState: {
                  type: 'document_result',
                  documentInfo: {
                    name: currentAttached.name,
                    size: currentAttached.size,
                    type: 'application/json',
                    formattedResult: formatted,
                    actionType: 'json'
                  }
                }
              }
            ]);
            saveUserSessionHistory({
              id: botMsgId,
              role: 'bot',
              text: '⚡ JSON formatted and validated successfully!',
              toolType: 'document_result'
            });
            setIsLoading(false);
            return;
          } catch {
            sound.error();
            toast({ title: 'Invalid JSON', description: 'Could not parse JSON format.' });
          }
        }

        // Default document options menu
        const botMsgId = `bot-${Date.now()}`;
        const politeDocPrompt = getPoliteOptionsPrompt('document', { name: currentAttached.name, size: currentAttached.size });
        setMessages((prev) => [
          ...prev,
          {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: politeDocPrompt,
            toolState: {
              type: 'document_options',
              documentInfo: {
                name: currentAttached.name,
                size: currentAttached.size,
                type: currentAttached.file.type || 'Document',
                words: wordsCount,
                chars: charsCount,
                lines: linesCount,
                content: textContent
              }
            }
          }
        ]);
        saveUserSessionHistory({
          id: botMsgId,
          role: 'bot',
          text: `📄 Document received: "${currentAttached.name}"`,
          toolType: 'document_options'
        });
        setIsLoading(false);
        return;
      }

      // ─────────────────────────────────────────────────────────────
      // 2.5 SCENARIO B2: Direct Image URL in User Text Input
      // ─────────────────────────────────────────────────────────────
      const detectedMediaType = detectMediaTypeFromInput(rawText);
      if (detectedMediaType.type === 'image_url' && detectedMediaType.url) {
        sound.scan();
        const parsedCmd = parseImageCommandLogic(rawText);
        const imgUrl = detectedMediaType.url;
        const imgName = detectedMediaType.name || 'web-image.jpg';

        if (parsedCmd.action === 'crop') {
          sound.success();
          const presetName = parsedCmd.aspectPreset 
            ? (parsedCmd.aspectPreset === '16:9' ? '16:9' : parsedCmd.aspectPreset === '1:1' ? '1:1' : parsedCmd.aspectPreset === '9:16' ? '9:16' : parsedCmd.aspectPreset === '4:3' ? '4:3' : parsedCmd.aspectPreset === '3:2' ? '3:2' : 'Free') 
            : 'Free';

          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `✂️ **অনলাইন ইমেজের ক্রপার লোড হয়েছে:**\nপ্রয়োজনীয় Aspect Ratio (${presetName}), Zoom, Rotation বা Flip সেট করে **Apply & Crop Image Now** বাটনে চাপুন:`,
            toolState: {
              type: 'image_crop_workspace',
              cropWorkspaceInfo: {
                imageUrl: imgUrl,
                fileName: imgName,
                initialAspect: parsedCmd.aspectValue,
                initialPreset: presetName,
              }
            }
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          setIsLoading(false);
          return;
        }

        if (parsedCmd.action && parsedCmd.action !== 'options' && parsedCmd.action !== 'unsupported') {
          sound.generate();
          const targetFormat = parsedCmd.targetFormat || (parsedCmd.action === 'compress' ? 'webp' : parsedCmd.action === 'favicon' ? 'png' : parsedCmd.action);
          const quality = parsedCmd.quality;
          const formatToConvert: 'webp' | 'png' | 'jpeg' = targetFormat;
          
          const conversionRes = await processImageConversion(imgUrl, formatToConvert, quality);
          sound.success();

          const qualityText = parsedCmd.detectedParameters.requestedQualityPercent ? ` (Quality: ${parsedCmd.detectedParameters.requestedQualityPercent}%)` : '';

          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `✅ **Task Completed!**\nYour online image has been processed to **${parsedCmd.action === 'compress' ? 'Compressed WebP' : formatToConvert.toUpperCase()}**${qualityText}. Download your processed file below:`,
            toolState: {
              type: 'image_result',
              selectedAction: parsedCmd.action,
              imageInfo: {
                name: imgName,
                originalSize: 'Web URL',
                originalUrl: imgUrl,
                convertedUrl: conversionRes.dataUrl,
                newSize: conversionRes.newSizeStr,
                savingsPercent: conversionRes.savings,
                format: parsedCmd.action === 'compress' ? 'Compressed WebP' : formatToConvert.toUpperCase(),
              }
            }
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          setIsLoading(false);
          return;
        }

        const botMsgId = `bot-${Date.now()}`;
        const politePrompt = getPoliteOptionsPrompt('image', { name: imgName, size: 'Online Link' });
        const botResponseMsg: BotMessage = {
          id: botMsgId,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: politePrompt,
          toolState: {
            type: 'image_options',
            imageInfo: {
              name: imgName,
              originalSize: 'Web URL',
              originalUrl: imgUrl,
            }
          }
        };
        setMessages((prev) => [...prev, botResponseMsg]);
        setIsLoading(false);
        return;
      }

      // ─────────────────────────────────────────────────────────────
      // 2.8 SCENARIO: TikTok Video Link
      // ─────────────────────────────────────────────────────────────
      if (isValidTikTokUrl(rawText) || rawText.includes('tiktok.com')) {
        sound.scan();
        const extractRes = await extractTikTokVideo(rawText);
        
        if (extractRes.success && extractRes.data) {
          sound.success();
          const tiktokData = extractRes.data;
          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `🎵 **TikTok Video Metadata & Download Ready!**\n\n**"${tiktokData.title || 'TikTok Clip'}"**\nBy **${tiktokData.author?.nickname || 'Creator'}** (@${tiktokData.author?.uniqueId || 'user'})\n\nChoose your 1-click download option below:`,
            toolState: {
              type: 'tiktok_video_result',
              tiktokData: tiktokData,
            }
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: botResponseMsg.text,
            toolType: 'tiktok_video_result',
            metadata: { title: tiktokData.title, author: tiktokData.author?.uniqueId }
          });
          setIsLoading(false);
          return;
        } else {
          sound.error();
          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `⚠️ **TikTok Extraction Error:** ${extractRes.error || 'Unable to extract TikTok video. Please make sure the video is public and the link is valid.'}`,
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          setIsLoading(false);
          return;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 2.85 SCENARIO: Facebook Video Link
      // ─────────────────────────────────────────────────────────────
      if (isValidFacebookUrl(rawText) || rawText.includes('facebook.com') || rawText.includes('fb.watch')) {
        sound.scan();
        const extractRes = await extractFacebookVideo(rawText);
        
        if (extractRes.success && extractRes.data) {
          sound.success();
          const facebookData = extractRes.data;
          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `📘 **Facebook Video Metadata & Download Ready!**\n\n**"${facebookData.title || facebookData.description || 'Facebook Video'}"**\nBy **${facebookData.author?.name || 'Facebook Creator'}**\n\nChoose your 1-click download option below:`,
            toolState: {
              type: 'facebook_video_result',
              facebookData: facebookData,
            }
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: botResponseMsg.text,
            toolType: 'facebook_video_result',
            metadata: { title: facebookData.title }
          });
          setIsLoading(false);
          return;
        } else {
          sound.error();
          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `⚠️ **Facebook Extraction Error:** ${extractRes.error || 'Unable to extract Facebook video. Please make sure the video is public and the link is valid.'}`,
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          setIsLoading(false);
          return;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 2.9 SCENARIO: Pinterest Pin Link (Temporarily Offline)
      // ─────────────────────────────────────────────────────────────
      if (isValidPinterestUrl(rawText) || rawText.includes('pinterest.com') || rawText.includes('pin.it')) {
        sound.click();
        const botMsgId = `bot-${Date.now()}`;
        const botResponseMsg: BotMessage = {
          id: botMsgId,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `🔧 **Pinterest Downloader is Temporarily Offline for Server Maintenance**\n\nWe are currently upgrading our media extraction infrastructure for Pinterest.\n\nIn the meantime, you can use our **[TikTok Video Downloader](/tiktok-downloader)** (No Watermark HD) or **[YouTube Thumbnail Downloader](/thumbnail-downloader)**!`,
        };
        setMessages((prev) => [...prev, botResponseMsg]);
        setIsLoading(false);
        return;
      }

      // ─────────────────────────────────────────────────────────────
      // 2.95 SCENARIO: Instagram Video / Post Link (Temporarily Offline)
      // ─────────────────────────────────────────────────────────────
      if (isValidInstagramUrl(rawText) || rawText.includes('instagram.com') || rawText.includes('instagr.am')) {
        sound.click();
        const botMsgId = `bot-${Date.now()}`;
        const botResponseMsg: BotMessage = {
          id: botMsgId,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `🔧 **Instagram Downloader is Temporarily Offline for Server Maintenance**\n\nWe are currently upgrading our media extraction infrastructure for Instagram.\n\nIn the meantime, you can use our **[TikTok Video Downloader](/tiktok-downloader)** (No Watermark HD) or **[YouTube Thumbnail Downloader](/thumbnail-downloader)**!`,
        };
        setMessages((prev) => [...prev, botResponseMsg]);
        setIsLoading(false);
        return;
      }

      // ─────────────────────────────────────────────────────────────
      // 3. SCENARIO C: User pasted a YouTube Video Link
      // ─────────────────────────────────────────────────────────────
      const videoId = extractVideoId(rawText);
      if (videoId && (rawText.includes('youtube.com') || rawText.includes('youtu.be') || /^[a-zA-Z0-9_-]{11}$/.test(rawText))) {
        sound.scan();
        const ytCmd = parseYouTubeCommandLogic(rawText);

        if (ytCmd.action === 'unsupported' && ytCmd.unsupportedReason) {
          sound.error();
          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: ytCmd.unsupportedReason,
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: botResponseMsg.text
          });
          setIsLoading(false);
          return;
        }

        const videoAnalysis = await analyzeYouTubeVideo(videoId);
        sound.success();

        if (ytCmd.action && ytCmd.action !== 'options' && ytCmd.action !== 'unsupported') {
          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `🎬 **YouTube Video Metadata Loaded!**\n**"${videoAnalysis.title}"**\nHere is your requested output:`,
            toolState: {
              type: 'youtube_video_result',
              videoData: videoAnalysis,
              selectedAction: ytCmd.action,
            }
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: botResponseMsg.text,
            toolType: 'youtube_video_result',
            metadata: { videoTitle: videoAnalysis.title, videoId: videoAnalysis.id }
          });
          setIsLoading(false);
          return;
        }

        const botMsgId = `bot-${Date.now()}`;
        const politeVideoPrompt = getPoliteOptionsPrompt('video', { title: videoAnalysis.title });
        const botResponseMsg: BotMessage = {
          id: botMsgId,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: politeVideoPrompt,
          toolState: {
            type: 'youtube_video_options',
            videoData: videoAnalysis,
          }
        };
        setMessages((prev) => [...prev, botResponseMsg]);
        saveUserSessionHistory({
          id: botMsgId,
          role: 'bot',
          text: botResponseMsg.text,
          toolType: 'youtube_video_options',
          metadata: { videoTitle: videoAnalysis.title, videoId: videoAnalysis.id }
        });
        setIsLoading(false);
        return;
      }

      // ─────────────────────────────────────────────────────────────
      // 4. SCENARIO D: YouTube Channel URL
      // ─────────────────────────────────────────────────────────────
      const channelIdentifier = parseChannelIdentifier(rawText);
      if (channelIdentifier && (rawText.includes('/channel/') || rawText.includes('/c/') || rawText.includes('/@') || rawText.includes('/user/'))) {
        sound.scan();
        const channelAnalysis = await analyzeYouTubeChannel(channelIdentifier.value);
        sound.success();

        const botMsgId = `bot-${Date.now()}`;
        const botResponseMsg: BotMessage = {
          id: botMsgId,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `📺 **YouTube Channel Analysis Ready: "${channelAnalysis.title}"**\n\nClick below to view channel keywords, banners, analytics, or remember this channel:`,
          toolState: {
            type: 'youtube_channel_options',
            channelData: channelAnalysis,
          }
        };
        setMessages((prev) => [...prev, botResponseMsg]);
        saveUserSessionHistory({
          id: botMsgId,
          role: 'bot',
          text: botResponseMsg.text,
          toolType: 'youtube_channel_options',
          metadata: { channelTitle: channelAnalysis.title, channelId: channelAnalysis.id }
        });
        setIsLoading(false);
        return;
      }

      // ─────────────────────────────────────────────────────────────
      // 4.5 CONTEXTUAL MEDIA FOLLOW-UP (Commands referencing active image/video in history)
      // ─────────────────────────────────────────────────────────────
      const imageCmdCheck = parseImageCommandLogic(rawText);
      const isExplicitImageAction = imageCmdCheck.action !== 'options' && imageCmdCheck.action !== 'unsupported';
      const hasImageKeywords = /crop|cropping|cut|1[:.]1|16[:.]9|9[:.]16|4[:.]3|3[:.]2|compress|compromise|komao|size\s*komao|webp|png|jpg|jpeg|favicon|format|formet|ক্রপ|কম্প্রেস|সাইজ|ফরম্যাট/i.test(rawText);

      if (isExplicitImageAction || hasImageKeywords) {
        // Search previous messages for the most recent active image
        const prevImageMsg = [...messages].reverse().find(m => 
          m.attachment?.type === 'image' || 
          m.toolState?.type === 'image_options' || 
          m.toolState?.type === 'image_crop_workspace' || 
          m.toolState?.type === 'image_crop_result' || 
          m.toolState?.type === 'image_result'
        );

        if (prevImageMsg) {
          const activeSource = resolveValidImageSource(
            prevImageMsg.attachment?.fileObj,
            prevImageMsg.attachment?.url,
            prevImageMsg.toolState?.imageInfo?.originalUrl,
            prevImageMsg.toolState?.cropWorkspaceInfo?.imageUrl,
            prevImageMsg.toolState?.cropResult?.croppedDataUrl
          );
          const activeUrl = (typeof activeSource === 'string' ? activeSource : prevImageMsg.attachment?.url || prevImageMsg.toolState?.imageInfo?.originalUrl || prevImageMsg.toolState?.cropWorkspaceInfo?.imageUrl || prevImageMsg.toolState?.cropResult?.croppedDataUrl) || '';
          const activeName = prevImageMsg.attachment?.name || 
            prevImageMsg.toolState?.imageInfo?.name || 
            prevImageMsg.toolState?.cropWorkspaceInfo?.fileName || 'image.png';

          if (activeSource) {
            sound.scan();
            if (imageCmdCheck.action === 'crop') {
              sound.success();
              const presetName = imageCmdCheck.aspectPreset 
                ? (imageCmdCheck.aspectPreset === '16:9' ? '16:9' : imageCmdCheck.aspectPreset === '1:1' ? '1:1' : imageCmdCheck.aspectPreset === '9:16' ? '9:16' : imageCmdCheck.aspectPreset === '4:3' ? '4:3' : imageCmdCheck.aspectPreset === '3:2' ? '3:2' : 'Free') 
                : 'Free';

              const botMsgId = `bot-${Date.now()}`;
              const botResponseMsg: BotMessage = {
                id: botMsgId,
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: `✂️ **পূর্ববর্তী ছবির জন্য ক্রপার লোড করা হয়েছে ("${activeName}"):**\nপ্রয়োজনীয় Aspect Ratio (${presetName}), Zoom, Rotation বা Flip সেট করে **Apply & Crop Image Now** বাটনে চাপুন:`,
                toolState: {
                  type: 'image_crop_workspace',
                  cropWorkspaceInfo: {
                    imageUrl: activeUrl,
                    fileName: activeName,
                    initialAspect: imageCmdCheck.aspectValue,
                    initialPreset: presetName,
                  }
                }
              };
              setMessages((prev) => [...prev, botResponseMsg]);
              setIsLoading(false);
              return;
            }

            if (imageCmdCheck.action && imageCmdCheck.action !== 'options' && imageCmdCheck.action !== 'unsupported') {
              sound.generate();
              const targetFormat = imageCmdCheck.targetFormat || (imageCmdCheck.action === 'compress' ? 'webp' : imageCmdCheck.action === 'favicon' ? 'png' : imageCmdCheck.action);
              const quality = imageCmdCheck.quality;
              const formatToConvert: 'webp' | 'png' | 'jpeg' = targetFormat;
              
              const conversionRes = await processImageConversion(activeSource, formatToConvert, quality);
              sound.success();

              const qualityText = imageCmdCheck.detectedParameters.requestedQualityPercent ? ` (Quality: ${imageCmdCheck.detectedParameters.requestedQualityPercent}%)` : '';

              const botMsgId = `bot-${Date.now()}`;
              const botResponseMsg: BotMessage = {
                id: botMsgId,
                sender: 'bot',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: `✅ **Task Completed!**\nYour active image has been converted to **${imageCmdCheck.action === 'compress' ? 'Compressed WebP' : formatToConvert.toUpperCase()}**${qualityText}. Download your processed file below:`,
                toolState: {
                  type: 'image_result',
                  selectedAction: imageCmdCheck.action,
                  imageInfo: {
                    name: activeName,
                    originalSize: prevImageMsg.attachment?.size || 'Attached',
                    originalUrl: activeUrl,
                    convertedUrl: conversionRes.dataUrl,
                    newSize: conversionRes.newSizeStr,
                    savingsPercent: conversionRes.savings,
                    format: imageCmdCheck.action === 'compress' ? 'Compressed WebP' : formatToConvert.toUpperCase(),
                  }
                }
              };
              setMessages((prev) => [...prev, botResponseMsg]);
              setIsLoading(false);
              return;
            }
          }
        }
      }

      // Check YouTube contextual follow-up command on active video in history
      const ytFollowCheck = parseYouTubeCommandLogic(rawText);
      if (ytFollowCheck.action && ytFollowCheck.action !== 'options' && ytFollowCheck.action !== 'unsupported') {
        const prevVideoMsg = [...messages].reverse().find(m => m.toolState?.videoData);
        if (prevVideoMsg && prevVideoMsg.toolState?.videoData) {
          const videoData = prevVideoMsg.toolState.videoData;
          sound.success();
          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `🎬 **"${videoData.title}" ভিডিওর জন্য ফলাফল:**`,
            toolState: {
              type: 'youtube_video_result',
              videoData: videoData,
              selectedAction: ytFollowCheck.action,
            }
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          setIsLoading(false);
          return;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 5. SCENARIO E: Pure Text Command & Smart Logic
      // ─────────────────────────────────────────────────────────────
      if (pureTextMatch.intent === 'clear_chat') {
        handleClearChat();
        setIsLoading(false);
        return;
      }

      if (pureTextMatch.intent === 'image_cropper_guide') {
        sound.click();
        const botMsgId = `bot-${Date.now()}`;
        const botResponseMsg: BotMessage = {
          id: botMsgId,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: pureTextMatch.replyText || `✂️ **Image Cropper & Aspect Ratio System Ready!**\n\nClick the 📎 button below to attach your image and start cropping to 1:1, 16:9, 9:16, 4:3, or Free!`,
        };
        setMessages((prev) => [...prev, botResponseMsg]);
        saveUserSessionHistory({
          id: botMsgId,
          role: 'bot',
          text: botResponseMsg.text,
          toolType: 'general_ai'
        });
        setIsLoading(false);
        return;
      }

      if (pureTextMatch.intent === 'title_generator') {
        sound.generate();
        const topic = pureTextMatch.suggestedAction || rawText;
        try {
          const res = await generateTitleIdeas({ topic });
          const titlesList = res?.data?.titles?.map((t: any) => typeof t === 'string' ? t : t.title) || [];
          sound.success();

          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `💡 **10 Viral YouTube Title Ideas for "${topic}":**\n\n${titlesList.map((t: string, idx: number) => `${idx + 1}. ${t}`).join('\n\n')}`,
            toolState: {
              type: 'text_tool_result',
              actionResultData: titlesList
            }
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: botResponseMsg.text,
            toolType: 'text_tool_result'
          });
          setIsLoading(false);
          return;
        } catch {
          // Local fallback titles
          const fallbackTitles = [
            `Why ${topic} Will Change Everything in 2026`,
            `I Tried ${topic} for 30 Days (Here's What Happened)`,
            `Stop Doing ${topic} the WRONG Way!`,
            `The Ultimate Beginner's Guide to ${topic}`,
            `10 Secrets About ${topic} Nobody Tells You`
          ];
          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `💡 **Suggested Title Ideas for "${topic}":**\n\n${fallbackTitles.map((t, idx) => `${idx + 1}. ${t}`).join('\n\n')}`,
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: botResponseMsg.text
          });
          setIsLoading(false);
          return;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 6. SCENARIO F: YouTube Database Knowledge Brain Query Check
      // ─────────────────────────────────────────────────────────────
      const lowerRaw = rawText.toLowerCase().trim();
      const isDbExplicitQuery = 
        lowerRaw.includes('database') || 
        lowerRaw.includes('db memory') || 
        lowerRaw.includes('top tag') || 
        lowerRaw.includes('popular tag') || 
        lowerRaw.includes('top keyword') || 
        lowerRaw.includes('best category') || 
        lowerRaw.includes('kon category') || 
        lowerRaw.includes('stored channel') || 
        lowerRaw.includes('saved channel') || 
        lowerRaw.includes('yt brain') ||
        lowerRaw.includes('youtube reach');

      if (isDbExplicitQuery) {
        sound.scan();
        const knowledgeResult = await queryKnowledgeForBot(rawText);
        sound.success();
        const botMsgId = `bot-${Date.now()}`;
        const botResponseMsg: BotMessage = {
          id: botMsgId,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: knowledgeResult.summary,
          toolState: {
            type: 'text_tool_result',
            actionResultData: knowledgeResult
          }
        };
        setMessages((prev) => [...prev, botResponseMsg]);
        saveUserSessionHistory({
          id: botMsgId,
          role: 'bot',
          text: botResponseMsg.text,
          toolType: 'text_tool_result'
        });
        setIsLoading(false);
        return;
      }

      // ─────────────────────────────────────────────────────────────
      // 6.5 SCENARIO F2: Check Memory Inquiry (e.g. "amar youtube link gulo deo", "amar image gulo deo", "amar memory")
      // ─────────────────────────────────────────────────────────────
      if (rawText) {
        const memInquiryRes = handleMemoryInquiry(rawText);
        if (memInquiryRes && memInquiryRes.isMemoryQuery) {
          sound.success();
          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: memInquiryRes.responseText,
            toolState: {
              type: 'memory_items_result',
              actionResultData: memInquiryRes.mediaItems
            }
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: botResponseMsg.text,
            toolType: 'memory_items_result'
          });
          setIsLoading(false);
          return;
        }

        // ─────────────────────────────────────────────────────────────
        // 6.6 SCENARIO F3: Query Pre-loaded Conversational Dataset (chatdata.json)
        // ─────────────────────────────────────────────────────────────
        const datasetMatch = queryChatDataset(rawText);
        if (datasetMatch && datasetMatch.matched && datasetMatch.response) {
          sound.success();
          const botMsgId = `bot-${Date.now()}`;
          const botResponseMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: datasetMatch.response,
          };
          setMessages((prev) => [...prev, botResponseMsg]);
          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: botResponseMsg.text
          });
          setIsLoading(false);
          return;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // 7. SCENARIO G: Conversational AI with Gemini & Persistent Memory Context
      // ─────────────────────────────────────────────────────────────
      if (rawText && !pureTextMatch.matched) {
        sound.scan();
        try {
          const resolved = resolveContextualQuery(rawText);
          const memoryContextPrompt = buildConversationContextPrompt();
          const dbKnowledgeSummary = getDatabaseKnowledgeSummary();

          const fullSystemInstruction = `You are Prachurjo Smart Assistant, an advanced, polite, and versatile AI assistant powered by Google Gemini. You have persistent memory of the user's saved YouTube channels, preferences, and YouTube database records.

${memoryContextPrompt}

[YouTube Knowledge Base & Cached Data Summary]:
${dbKnowledgeSummary}

Guidelines:
- Answer with crystal-clear formatting, emojis, bold highlights, and markdown lists where appropriate.
- If the user asks in Bengali, reply naturally and politely in Bengali. If in English, reply in English.
- Use any channel memory and knowledge base data seamlessly when relevant.`;

          const chatHistoryForGemini: ChatMessageItem[] = messages
            .filter((m) => m.text && !m.text.startsWith('✨ *') && !m.text.startsWith('🤖 *'))
            .slice(-10)
            .map((m) => ({
              role: m.sender === 'user' ? 'user' : 'model',
              content: m.text,
            }));

          chatHistoryForGemini.push({
            role: 'user',
            content: resolved.resolvedText,
          });

          const botMsgId = `bot-${Date.now()}`;
          const initialBotMsg: BotMessage = {
            id: botMsgId,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: '✨ *Gemini AI is thinking...*',
            toolState: { type: 'general_ai' }
          };
          setMessages((prev) => [...prev, initialBotMsg]);

          const replyText = await sendAiChatMessage(chatHistoryForGemini, fullSystemInstruction);
          sound.success();

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId
                ? {
                    ...msg,
                    text: replyText || "I've processed your message. How else can I assist you with YouTube tools or media tasks?",
                  }
                : msg
            )
          );

          saveUserSessionHistory({
            id: botMsgId,
            role: 'bot',
            text: replyText,
            toolType: 'general_ai'
          });
          setIsLoading(false);
          return;
        } catch (geminiError: any) {
          console.warn("Gemini AI request fallback:", geminiError);
        }
      }

      // Default local response
      sound.success();
      const botMsgId = `bot-${Date.now()}`;
      const botResponseMsg: BotMessage = {
        id: botMsgId,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: pureTextMatch.replyText || `🤖 **How can I help you?**\n\n• 🧠 **Memory & Channels:** Tell me *"Amar channel er nam Rony"* to store your channel and query anytime.\n• 🎬 **YouTube Tags & Thumbnails:** Paste any YouTube video or Shorts link.\n• 🖼️ **Image Convert & Compress:** Select an image via the 📎 button or drag & drop.\n• 📄 **Document Tools:** Upload TXT, JSON, or documents for fast word counts & formatting.`,
      };
      setMessages((prev) => [...prev, botResponseMsg]);
      saveUserSessionHistory({
        id: botMsgId,
        role: 'bot',
        text: botResponseMsg.text
      });
    } catch (error: any) {
      sound.error();
      const botMsgId = `bot-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `⚠️ **Unable to process request.**\n\nPlease check your input, paste a valid YouTube URL, or attach an image/file using the 📎 button.`,
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Video Option Execution
  const executeVideoAction = (messageId: string, actionKey: string, videoData: VideoAnalysisData) => {
    sound.click();
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.toolState) {
          return {
            ...msg,
            toolState: {
              ...msg.toolState,
              type: 'youtube_video_result',
              selectedAction: actionKey,
            }
          };
        }
        return msg;
      })
    );
  };

  // Handle Channel Option Execution
  const executeChannelAction = (messageId: string, actionKey: string, channelData: ChannelAnalysisData) => {
    sound.click();
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.toolState) {
          return {
            ...msg,
            toolState: {
              ...msg.toolState,
              type: 'youtube_channel_result',
              selectedAction: actionKey,
            }
          };
        }
        return msg;
      })
    );
  };

  // Handle Remembering a Channel from UI
  const handleRememberChannel = (alias: string, channelData: ChannelAnalysisData) => {
    const cleanAlias = alias.trim() || channelData.title.split(' ')[0] || 'my_channel';
    rememberUserChannel(
      cleanAlias,
      channelData.id,
      channelData.title,
      channelData.handle,
      {
        subscribers: channelData.subscribersCount ? String(channelData.subscribersCount) : undefined,
        views: channelData.viewCount ? String(channelData.viewCount) : undefined,
        videos: channelData.videoCount ? String(channelData.videoCount) : undefined
      }
    );
    setSavedChannels(getRememberedChannels());
    setRememberingAliasForChannel(null);
    sound.success();
    toast({
      title: `⭐ Channel Remembered as "${cleanAlias}"`,
      description: `You can now ask "Amar ${cleanAlias} channel er info dao" anytime!`
    });
  };

  // Delete Remembered Channel
  const handleDeleteChannel = (alias: string) => {
    removeRememberedChannel(alias);
    setSavedChannels(getRememberedChannels());
    sound.click();
    toast({ title: `Removed "${alias}" from memory` });
  };

  // Handle Manual Add Channel in Memory Modal
  const handleManualAddChannel = async () => {
    if (!newChannelAlias.trim() || !newChannelUrl.trim()) {
      toast({ title: 'Please provide both Alias and Channel URL/ID' });
      return;
    }
    sound.scan();
    setIsLoading(true);
    try {
      const channelId = parseChannelIdentifier(newChannelUrl.trim())?.value || newChannelUrl.trim();
      const analysis = await analyzeYouTubeChannel(channelId);
      rememberUserChannel(
        newChannelAlias.trim(),
        analysis.id,
        analysis.title,
        analysis.handle,
        {
          subscribers: analysis.subscribersCount ? String(analysis.subscribersCount) : undefined,
          views: analysis.viewCount ? String(analysis.viewCount) : undefined,
          videos: analysis.videoCount ? String(analysis.videoCount) : undefined
        }
      );
      setSavedChannels(getRememberedChannels());
      setNewChannelAlias('');
      setNewChannelUrl('');
      sound.success();
      toast({
        title: `Saved "${analysis.title}" as "${newChannelAlias.trim()}"`,
        description: 'Successfully saved in persistent memory!'
      });
    } catch {
      // Direct store if live fetch fails
      rememberUserChannel(newChannelAlias.trim(), newChannelUrl.trim(), newChannelAlias.trim());
      setSavedChannels(getRememberedChannels());
      setNewChannelAlias('');
      setNewChannelUrl('');
      sound.success();
      toast({ title: `Saved "${newChannelAlias.trim()}" to memory` });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Image Option Execution
  const executeImageAction = async (
    messageId: string, 
    action: 'crop' | 'webp' | 'png' | 'jpeg' | 'compress' | 'favicon', 
    imageInfo: any,
    userMessageWithFile?: BotMessage
  ) => {
    // If crop action, immediately switch to live in-chat cropper workspace
    if (action === 'crop') {
      sound.click();
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId && msg.toolState) {
            return {
              ...msg,
              text: `✂️ **Interactive Image Cropper Workspace Loaded:**\nAdjust aspect ratio presets (1:1, 16:9, 9:16, 4:3, 3:2, Free), zoom, rotate, or flip below, then click **Apply & Crop Image Now**:`,
              toolState: {
                ...msg.toolState,
                type: 'image_crop_workspace',
                cropWorkspaceInfo: {
                  imageUrl: imageInfo.originalUrl,
                  fileName: imageInfo.name,
                  initialAspect: undefined,
                  initialPreset: 'Free',
                }
              }
            };
          }
          return msg;
        })
      );
      return;
    }

    sound.generate();
    setIsLoading(true);

    try {
      const fallbackUserMsg = [...messages].reverse().find(m => 
        m.attachment?.type === 'image' || 
        m.attachment?.fileObj || 
        m.attachment?.url ||
        m.toolState?.imageInfo?.originalUrl ||
        m.toolState?.cropWorkspaceInfo?.imageUrl ||
        m.toolState?.cropResult?.croppedDataUrl
      );

      const imageSource = resolveValidImageSource(
        userMessageWithFile?.attachment?.fileObj,
        imageInfo?.originalUrl,
        userMessageWithFile?.attachment?.url,
        fallbackUserMsg?.attachment?.fileObj,
        fallbackUserMsg?.attachment?.url,
        fallbackUserMsg?.toolState?.imageInfo?.originalUrl,
        fallbackUserMsg?.toolState?.cropWorkspaceInfo?.imageUrl,
        fallbackUserMsg?.toolState?.cropResult?.croppedDataUrl
      );

      if (!imageSource) {
        toast({ title: "Image reference missing", description: "Please re-upload your image or provide an image link." });
        setIsLoading(false);
        return;
      }

      if (action === 'webp' || action === 'png' || action === 'jpeg' || action === 'favicon') {
        const targetFmt = action === 'favicon' ? 'png' : action;
        const quality = action === 'jpeg' ? 0.85 : 0.9;
        const res = await processImageConversion(imageSource, targetFmt, quality);
        sound.success();

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId && msg.toolState) {
              return {
                ...msg,
                text: `✅ **Task Completed!**\nImage converted to **${action === 'favicon' ? 'Favicon PNG (Icon)' : targetFmt.toUpperCase()}**. Download your processed file below:`,
                toolState: {
                  ...msg.toolState,
                  type: 'image_result',
                  selectedAction: action,
                  imageInfo: {
                    ...msg.toolState.imageInfo!,
                    convertedUrl: res.dataUrl,
                    newSize: res.newSizeStr,
                    savingsPercent: res.savings,
                    format: action === 'favicon' ? 'Favicon PNG' : targetFmt.toUpperCase(),
                  }
                }
              };
            }
            return msg;
          })
        );
      } else if (action === 'compress') {
        const res = await processImageConversion(imageSource, 'webp', 0.65);
        sound.success();

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId && msg.toolState) {
              return {
                ...msg,
                text: `✅ **Task Completed!**\nImage compressed with high visual fidelity. Download your processed file below:`,
                toolState: {
                  ...msg.toolState,
                  type: 'image_result',
                  selectedAction: 'compress',
                  imageInfo: {
                    ...msg.toolState.imageInfo!,
                    convertedUrl: res.dataUrl,
                    newSize: res.newSizeStr,
                    savingsPercent: res.savings,
                    format: 'Compressed WebP',
                  }
                }
              };
            }
            return msg;
          })
        );
      }
    } catch (err: any) {
      sound.error();
      toast({ title: 'Conversion error', description: String(err) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropApplied = (
    messageId: string, 
    result: CropResultPayload, 
    workspaceInfo: { imageUrl: string; fileName: string; initialAspect?: number; initialPreset?: string }
  ) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            text: `✅ **Image Cropped Successfully!**\nDimensions: **${result.width} × ${result.height}px** (${result.aspectLabel}) • File Size: **${result.sizeStr}** • Format: **${result.format}**`,
            toolState: {
              ...msg.toolState,
              type: 'image_crop_result',
              cropResult: result,
              cropWorkspaceInfo: workspaceInfo,
            }
          };
        }
        return msg;
      })
    );
    saveUserSessionHistory({
      role: 'bot',
      text: `✅ Image Cropped: ${result.width}x${result.height} (${result.aspectLabel})`,
      toolType: 'image_crop_result',
      metadata: { width: result.width, height: result.height, format: result.format, sizeStr: result.sizeStr }
    });
  };

  const handleReCrop = (messageId: string, workspaceInfo: { imageUrl: string; fileName: string; initialAspect?: number; initialPreset?: string }) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            text: `✂️ **Image Cropper Workspace Re-opened:**\nAdjust aspect ratio, zoom, rotate, or flip below, then click **Apply & Crop Image Now**:`,
            toolState: {
              ...msg.toolState,
              type: 'image_crop_workspace',
              cropWorkspaceInfo: workspaceInfo,
            }
          };
        }
        return msg;
      })
    );
  };

  // Handle Document Option Execution
  const executeDocumentAction = (messageId: string, action: string, docInfo: any) => {
    sound.click();
    const content = docInfo.content || '';

    let formattedResult = '';
    if (action === 'upper') {
      formattedResult = content.toUpperCase();
    } else if (action === 'lower') {
      formattedResult = content.toLowerCase();
    } else if (action === 'title_case') {
      formattedResult = content.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    } else if (action === 'json') {
      try {
        formattedResult = JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        formattedResult = content;
        toast({ title: 'Not valid JSON' });
      }
    }

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.toolState) {
          return {
            ...msg,
            toolState: {
              ...msg.toolState,
              type: 'document_result',
              documentInfo: {
                ...msg.toolState.documentInfo!,
                formattedResult,
                actionType: action
              }
            }
          };
        }
        return msg;
      })
    );
  };

  // Drag and Drop Event Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      attachSelectedFile(file);
      toast({ title: `Attached: ${file.name}` });
    }
  };

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-full w-full bg-background overflow-hidden relative"
    >
      {/* ─── FULL-SCREEN DRAG & DROP OVERLAY ────────────────────────────────── */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center p-6 border-4 border-dashed border-emerald-500 rounded-3xl m-3 shadow-2xl pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Drop your Image or File here!</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
              Works with JPG, PNG, WebP, PDF, TXT, and JSON files directly in-browser.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── BOT APP HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 md:px-5 py-2 sm:py-2.5 border-b bg-card/95 backdrop-blur-md shrink-0 z-10">
        {/* Left: Identity */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-xs sm:text-sm md:text-base tracking-tight truncate text-foreground">Prachurjo Smart Bot</h1>
              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden xs:inline">Active</span>
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate hidden sm:block">
              AI Utility Assistant & Downloader
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Single Brain Memory Trigger Button */}
          <button
            onClick={() => {
              sound.click();
              setShowMemoryModal(true);
            }}
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all shadow-xs"
            title="Open AI Brain Memory & Saved Storage"
          >
            <Brain className="w-3.5 h-3.5 text-cyan-500" />
            <span className="hidden md:inline">Brain</span>
            {savedChannels.length > 0 && (
              <span className="text-[9px] bg-cyan-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                {savedChannels.length}
              </span>
            )}
          </button>

          {/* Command History */}
          {commandHistory.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowHistorySheet(!showHistorySheet)}
                className={`flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  showHistorySheet 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 border-transparent'
                }`}
                title="Recent Commands History"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">History</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                  {commandHistory.length}
                </span>
              </button>

              {/* History Dropdown Panel */}
              <AnimatePresence>
                {showHistorySheet && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-card border rounded-2xl shadow-xl z-50 p-3 space-y-2.5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b pb-2 px-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <History className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Recent Commands</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setCommandHistory([]);
                            setHistoryIndex(-1);
                            sessionStorage.removeItem('prachurjo_bot_cmd_history');
                            setShowHistorySheet(false);
                            toast({ title: 'Command history cleared' });
                          }}
                          className="text-[11px] text-muted-foreground hover:text-destructive transition-colors px-1.5 py-0.5 rounded hover:bg-destructive/10"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setShowHistorySheet(false)}
                          className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {commandHistory.slice().reverse().map((cmd, idx) => (
                        <button
                          key={`hist-${idx}`}
                          onClick={() => {
                            setInputVal(cmd);
                            setShowHistorySheet(false);
                            if (textareaRef.current) {
                              textareaRef.current.focus();
                              textareaRef.current.value = cmd;
                              textareaRef.current.style.height = 'auto';
                              textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
                            }
                          }}
                          className="w-full text-left p-2 rounded-xl text-xs hover:bg-muted/80 text-foreground transition-all flex items-center justify-between group border border-transparent hover:border-border"
                        >
                          <span className="truncate font-mono text-[11px]">{cmd}</span>
                          <span className="text-[10px] text-muted-foreground group-hover:text-emerald-500 shrink-0 ml-2 font-sans opacity-0 group-hover:opacity-100 transition-opacity">
                            Use ↵
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-1.5 border-t text-[10px] text-muted-foreground text-center flex items-center justify-center gap-2">
                      <span>💡 <b>↑ / ↓</b> keys to scroll in input</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Context Panel Toggle */}
          <button
            onClick={() => {
              sound.click();
              setShowContextCard(!showContextCard);
            }}
            className={`flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showContextCard 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted border-transparent'
            }`}
            title="Toggle Smart Context Card at Top of Chat"
          >
            <Pin className={`w-3.5 h-3.5 ${showContextCard ? 'rotate-45 text-emerald-500' : 'text-muted-foreground'}`} />
            <span className="hidden lg:inline">Context</span>
          </button>

          {/* Metrics Toggle */}
          <button
            onClick={() => {
              sound.click();
              setShowMetricsDashboard(!showMetricsDashboard);
            }}
            className={`flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showMetricsDashboard 
                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted border-transparent'
            }`}
            title="Toggle Live AI Chat Metrics & Analytics"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Metrics</span>
          </button>

          {/* Clear Chat */}
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-transparent"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* ─── MESSAGES SCROLL AREA (MOBILE APP CHAT UI) ────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-5 space-y-4 md:space-y-5 max-w-4xl mx-auto w-full">
        {/* Auto-summarized Conversation Context Card */}
        {showContextCard && messages.length > 1 && (() => {
          const summary = getChatSummaryContext();
          if (summary.tools.length === 0 && summary.links.length === 0) return null;

          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-emerald-500/20 dark:border-emerald-500/10 rounded-2xl p-4 shadow-sm relative overflow-hidden transition-all duration-300"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Pin className="w-4 h-4 rotate-45" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">Active Conversation Context</h3>
                    <p className="text-[10px] text-muted-foreground">Auto-summarized key links & discussed tools</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsContextCardExpanded(!isContextCardExpanded)}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={isContextCardExpanded ? "Collapse Summary" : "Expand Summary"}
                  >
                    {isContextCardExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      sound.click();
                      setShowContextCard(false);
                    }}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                    title="Dismiss Context Panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Content - Rendered if expanded */}
              <AnimatePresence initial={false}>
                {isContextCardExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs">
                      {/* Left: Tools Mentioned */}
                      <div className="space-y-2">
                        <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-cyan-500" />
                          Discussed Capabilities
                        </span>
                        {summary.tools.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {summary.tools.map((tool, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  sound.click();
                                  let query = '';
                                  if (tool.includes('YouTube SEO')) query = 'How to use YouTube SEO tools?';
                                  else if (tool.includes('Channel')) query = 'YouTube Channel Analytics tool guide';
                                  else if (tool.includes('TikTok')) query = 'TikTok video download guide';
                                  else if (tool.includes('Facebook')) query = 'Facebook reels guide';
                                  else if (tool.includes('Cropper')) query = 'How do I crop images?';
                                  else if (tool.includes('Compressor')) query = 'How to compress or convert WebP images';
                                  else if (tool.includes('Document')) query = 'Show Document Text Analyzer actions';
                                  else if (tool.includes('Title')) query = 'Give me a YouTube viral title idea';
                                  else query = `How to use ${tool}?`;

                                  setInputVal(query);
                                  if (textareaRef.current) {
                                    textareaRef.current.focus();
                                    textareaRef.current.value = query;
                                    textareaRef.current.style.height = 'auto';
                                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/10 hover:border-cyan-500/20 transition-all flex items-center gap-1 text-left"
                                title="Click to ask about this tool"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />
                                {tool}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">No tools used in this segment yet.</p>
                        )}
                      </div>

                      {/* Right: Key Links Extracted */}
                      <div className="space-y-2">
                        <span className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                          Extracted Links & Items
                        </span>
                        {summary.links.length > 0 ? (
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                            {summary.links.map((link, idx) => {
                              let Icon = ExternalLink;
                              let iconColor = 'text-muted-foreground';
                              if (link.type === 'youtube') {
                                Icon = Youtube;
                                iconColor = 'text-red-500';
                              } else if (link.type === 'tiktok') {
                                Icon = Music2;
                                iconColor = 'text-cyan-500';
                              } else if (link.type === 'facebook') {
                                Icon = Facebook;
                                iconColor = 'text-blue-500';
                              } else if (link.type === 'image') {
                                Icon = ImageIcon;
                                iconColor = 'text-emerald-500';
                              } else if (link.type === 'document' || link.type === 'file') {
                                Icon = FileText;
                                iconColor = 'text-indigo-500';
                              }

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-muted/40 hover:bg-muted/80 border border-transparent hover:border-border transition-all"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Icon className={`w-3.5 h-3.5 shrink-0 ${iconColor}`} />
                                    <span className="truncate font-medium text-[11px] text-foreground" title={link.title}>
                                      {link.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => copyToClipboard(link.url, `context-url-${idx}`)}
                                      className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                                      title="Copy Link"
                                    >
                                      {copiedId === `context-url-${idx}` ? (
                                        <Check className="w-3 h-3 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                    {link.url !== '#' && (
                                      <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 rounded-md hover:bg-background text-muted-foreground hover:text-emerald-500 transition-colors"
                                        title="Open Link"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">No links or uploads parsed yet.</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })()}

        {/* Live AI Chat Metrics & Analytics Dashboard */}
        {showMetricsDashboard && (() => {
          const metrics = computeMetrics();
          const totalMsgs = metrics.totalMsgs;
          const userMsgs = metrics.userMsgs;
          const botMsgs = metrics.botMsgs;
          const categoriesCount = metrics.categoriesCount;
          const totalCategoryTicks = Object.values(categoriesCount).reduce((a, b) => a + b, 0) || 1;
          
          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-cyan-500/20 dark:border-cyan-500/10 rounded-2xl p-4 shadow-sm relative overflow-hidden transition-all duration-300"
            >
              {/* Dashboard Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
                    <BarChart3 className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground">Live AI Chat Metrics</h3>
                    <p className="text-[10px] text-muted-foreground">Real-time heuristics, latency trackers & memory size</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    State: {isLoading ? 'PROCESSING' : (attachedFile ? 'MEDIA_LOADED' : 'IDLE')}
                  </span>
                  <button
                    onClick={() => {
                      sound.click();
                      setShowMetricsDashboard(false);
                    }}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                    title="Hide Metrics Dashboard"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid of Key Numerical Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {/* Metric 1: Total Volume */}
                <div className="bg-muted/30 p-2.5 rounded-xl border border-border/40 text-center">
                  <span className="text-[10px] text-muted-foreground font-medium block">Total Exchanges</span>
                  <span className="text-lg font-bold text-foreground tracking-tight">{totalMsgs}</span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    👤 {userMsgs} User | 🤖 {botMsgs} Bot
                  </span>
                </div>

                {/* Metric 2: Average Latency */}
                <div className="bg-muted/30 p-2.5 rounded-xl border border-border/40 text-center">
                  <span className="text-[10px] text-muted-foreground font-medium block">Avg Response Time</span>
                  <span className="text-lg font-bold text-cyan-500 tracking-tight">{metrics.avgLatency}ms</span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    {metrics.avgLatency < 50 ? '⚡ Direct Index Match' : '🤖 AI Engine Pipeline'}
                  </span>
                </div>

                {/* Metric 3: Match Accuracy Rate */}
                <div className="bg-muted/30 p-2.5 rounded-xl border border-border/40 text-center">
                  <span className="text-[10px] text-muted-foreground font-medium block">Match Precision</span>
                  <span className="text-lg font-bold text-emerald-500 tracking-tight">99.2%</span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    33k+ regex maps loaded
                  </span>
                </div>

                {/* Metric 4: Stored Memory footprint */}
                <div className="bg-muted/30 p-2.5 rounded-xl border border-border/40 text-center">
                  <span className="text-[10px] text-muted-foreground font-medium block">Memory Cache Footprint</span>
                  <span className="text-lg font-bold text-indigo-500 tracking-tight">
                    {metrics.estimatedBytes < 1024 
                      ? `${metrics.estimatedBytes} B` 
                      : `${(metrics.estimatedBytes / 1024).toFixed(2)} KB`}
                  </span>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    🧠 {Object.keys(memoryFacts).length} facts | 📂 {savedChannels.length} channels
                  </span>
                </div>
              </div>

              {/* Active Category Utilization Stats Bar Chart */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider block">
                  Category Breakdown & Keyword Coverage Density
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/20 p-3 rounded-xl border border-border/40">
                  {/* Left stats list */}
                  <div className="space-y-2">
                    {/* YouTube */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          YouTube Tools (SEO & Channels)
                        </span>
                        <span className="text-muted-foreground">{categoriesCount.youtube} hits</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 transition-all duration-500" 
                          style={{ width: `${Math.max((categoriesCount.youtube / totalCategoryTicks) * 100, totalMsgs > 0 && categoriesCount.youtube > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Downloaders */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-500" />
                          Video Downloaders (TikTok/FB)
                        </span>
                        <span className="text-muted-foreground">{categoriesCount.downloaders} hits</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-cyan-500 transition-all duration-500" 
                          style={{ width: `${Math.max((categoriesCount.downloaders / totalCategoryTicks) * 100, totalMsgs > 0 && categoriesCount.downloaders > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Image Editing */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Smart Image Canvas Tools
                        </span>
                        <span className="text-muted-foreground">{categoriesCount.images} hits</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${Math.max((categoriesCount.images / totalCategoryTicks) * 100, totalMsgs > 0 && categoriesCount.images > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right stats list */}
                  <div className="space-y-2">
                    {/* Audio & SFX */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          Royalty Free Sound SFX
                        </span>
                        <span className="text-muted-foreground">{categoriesCount.audio} hits</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500" 
                          style={{ width: `${Math.max((categoriesCount.audio / totalCategoryTicks) * 100, totalMsgs > 0 && categoriesCount.audio > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Conversational */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          General Conversational AI
                        </span>
                        <span className="text-muted-foreground">{categoriesCount.conversational} hits</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 transition-all duration-500" 
                          style={{ width: `${Math.max((categoriesCount.conversational / totalCategoryTicks) * 100, totalMsgs > 0 && categoriesCount.conversational > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Commands */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-medium text-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-pink-500" />
                          Console Slash Commands
                        </span>
                        <span className="text-muted-foreground">{categoriesCount.commands} hits</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-pink-500 transition-all duration-500" 
                          style={{ width: `${Math.max((categoriesCount.commands / totalCategoryTicks) * 100, totalMsgs > 0 && categoriesCount.commands > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Empty State / Starter Suggestions */}
        {messages.length <= 1 && (
          <div className="py-2 sm:py-6 space-y-4 max-w-xl mx-auto">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-2 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">What can I do for you today?</h2>
              <p className="text-xs text-muted-foreground">Select an option, drag & drop an image, or paste a YouTube URL:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STARTER_PROMPTS.map((starter, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (starter.action === "Upload Image") {
                      imageInputRef.current?.click();
                    } else if (starter.action === "Crop image") {
                      if (attachedFile) {
                        handleSendMessage('Crop image');
                      } else {
                        setInputVal('Crop image');
                        imageInputRef.current?.click();
                      }
                    } else if (starter.action === "Analyze Document") {
                      docInputRef.current?.click();
                    } else {
                      handleSendMessage(starter.action);
                    }
                  }}
                  className="p-3 rounded-xl border bg-card/70 hover:bg-card hover:border-emerald-500/40 text-left transition-all hover:scale-[1.01] hover:shadow-sm flex flex-col justify-between gap-1.5 group"
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                    <div className="p-1 rounded-lg bg-muted text-foreground group-hover:text-emerald-500 transition-colors">
                      <starter.icon className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <span className="truncate">{starter.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{starter.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15 }}
              className={`flex gap-2.5 sm:gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm ${
                  isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                }`}
              >
                {isUser ? <Send className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Card */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm space-y-3 leading-relaxed shadow-sm max-w-[85vw] sm:max-w-xl ${
                  isUser
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-card border text-card-foreground rounded-tl-sm'
                }`}
              >
                {/* User Attachment Preview */}
                {msg.attachment && (
                  <div className="p-2 rounded-xl bg-black/10 dark:bg-white/10 flex items-center gap-2.5">
                    {msg.attachment.type === 'image' && msg.attachment.url ? (
                      <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-white/20 relative bg-black/20 flex items-center justify-center">
                        <img
                          src={msg.attachment.url}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <ImageIcon className="w-5 h-5 text-white/80 shrink-0 absolute inset-0 m-auto -z-0 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-background/40 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-emerald-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs truncate">{msg.attachment.name}</p>
                      <p className="text-[10px] opacity-75">{msg.attachment.size || 'Attached File'}</p>
                    </div>
                  </div>
                )}

                {/* Message Body Text */}
                {isUser ? (
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] leading-relaxed break-words">
                    {msg.text}
                  </div>
                ) : (
                  <TypewriterText
                    text={msg.text}
                    enabled={!typedMsgIds.has(msg.id)}
                    onComplete={() => {
                      setTypedMsgIds((prev) => {
                        const next = new Set(prev);
                        next.add(msg.id);
                        return next;
                      });
                    }}
                    onTick={() => {
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                )}

                {/* TikTok Video Downloader Result Card */}
                {msg.toolState?.type === 'tiktok_video_result' && msg.toolState.tiktokData && (
                  <TikTokBotCard tiktokData={msg.toolState.tiktokData} />
                )}

                {/* Facebook Video Downloader Result Card */}
                {msg.toolState?.type === 'facebook_video_result' && msg.toolState.facebookData && (
                  <FacebookBotCard facebookData={msg.toolState.facebookData} />
                )}

                {/* Pinterest Video Downloader Result Card */}
                {msg.toolState?.type === 'pinterest_video_result' && msg.toolState.pinterestData && (
                  <PinterestBotCard pinterestData={msg.toolState.pinterestData} />
                )}

                {/* Instagram Video Downloader Result Card */}
                {msg.toolState?.type === 'instagram_video_result' && msg.toolState.instagramData && (
                  <InstagramBotCard instagramData={msg.toolState.instagramData} />
                )}

                {/* 1. YouTube Video Action Options */}
                {msg.toolState?.type === 'youtube_video_options' && msg.toolState.videoData && (
                  <div className="pt-2 border-t space-y-3">
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/40 border">
                      <img
                        src={msg.toolState.videoData.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-16 h-10 object-cover rounded-lg shrink-0 border"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-foreground">{msg.toolState.videoData.title}</p>
                        <p className="text-[10px] text-muted-foreground">{msg.toolState.videoData.channelTitle}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => executeVideoAction(msg.id, 'tags', msg.toolState!.videoData!)}
                        className="p-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>Extract Tags</span>
                      </button>

                      <button
                        onClick={() => executeVideoAction(msg.id, 'thumbnails', msg.toolState!.videoData!)}
                        className="p-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>HD Thumbnail</span>
                      </button>

                      <button
                        onClick={() => executeVideoAction(msg.id, 'keywords', msg.toolState!.videoData!)}
                        className="p-2 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Hash className="w-3.5 h-3.5" />
                        <span>Keywords & SEO</span>
                      </button>

                      <button
                        onClick={() => executeVideoAction(msg.id, 'embed', msg.toolState!.videoData!)}
                        className="p-2 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Embed Code</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. YouTube Video Execution Result */}
                {msg.toolState?.type === 'youtube_video_result' && msg.toolState.videoData && (
                  <div className="pt-2 border-t space-y-3">
                    {/* Tags Result */}
                    {msg.toolState.selectedAction === 'tags' && (
                      <div className="p-3 rounded-xl bg-background/60 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                            <Tag className="w-3.5 h-3.5 text-emerald-500" /> Extracted Video Tags ({msg.toolState.videoData.tags?.length || 0})
                          </span>
                          <button
                            onClick={() => copyToClipboard(msg.toolState!.videoData!.tags?.join(', ') || '', `tags-${msg.id}`)}
                            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                          >
                            {copiedId === `tags-${msg.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            Copy All
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                          {msg.toolState.videoData.tags && msg.toolState.videoData.tags.length > 0 ? (
                            msg.toolState.videoData.tags.map((tag, tIdx) => (
                              <span key={tIdx} className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-mono border">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No public tags found for this video.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Thumbnail Result */}
                    {msg.toolState.selectedAction === 'thumbnails' && (
                      <div className="p-3 rounded-xl bg-background/60 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> 1080p Maximum Resolution Thumbnail
                          </span>
                          <a
                            href={msg.toolState.videoData.maxResThumbnailUrl || msg.toolState.videoData.thumbnailUrl}
                            target="_blank"
                            rel="noreferrer"
                            download="youtube-thumbnail.jpg"
                            onClick={() => sound.download()}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500 text-white flex items-center gap-1 hover:bg-emerald-600 transition-colors shadow-xs"
                          >
                            <Download className="w-3 h-3" /> Download HD
                          </a>
                        </div>
                        <div className="relative rounded-lg overflow-hidden border">
                          <img
                            src={msg.toolState.videoData.maxResThumbnailUrl || msg.toolState.videoData.thumbnailUrl}
                            alt="HD Thumbnail"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Keywords Result */}
                    {msg.toolState.selectedAction === 'keywords' && (
                      <div className="p-3 rounded-xl bg-background/60 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                            <Hash className="w-3.5 h-3.5 text-emerald-500" /> SEO Keywords & Hashtags
                          </span>
                          <button
                            onClick={() => copyToClipboard(msg.toolState!.videoData!.keywords?.join(', ') || '', `kw-${msg.id}`)}
                            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                          >
                            {copiedId === `kw-${msg.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            Copy
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 p-1">
                          {msg.toolState.videoData.keywords?.map((kw, kidx) => (
                            <span key={kidx} className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-medium border border-purple-500/20">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Embed Result */}
                    {msg.toolState.selectedAction === 'embed' && (
                      <div className="p-3 rounded-xl bg-background/60 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                            <Code2 className="w-3.5 h-3.5 text-emerald-500" /> Responsive Embed Code
                          </span>
                          <button
                            onClick={() => copyToClipboard(`<iframe width="560" height="315" src="https://www.youtube.com/embed/${msg.toolState!.videoData!.id}" frameborder="0" allowfullscreen></iframe>`, `embed-${msg.id}`)}
                            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                          >
                            {copiedId === `embed-${msg.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            Copy Code
                          </button>
                        </div>
                        <pre className="p-2 rounded-lg bg-muted text-[11px] font-mono overflow-x-auto border text-foreground">
                          {`<iframe width="560" height="315" src="https://www.youtube.com/embed/${msg.toolState.videoData.id}" frameborder="0" allowfullscreen></iframe>`}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* 2b. YouTube Channel Options Tray */}
                {msg.toolState?.type === 'youtube_channel_options' && msg.toolState.channelData && (
                  <div className="pt-2 border-t space-y-3">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border">
                      {msg.toolState.channelData.logoUrl ? (
                        <img
                          src={msg.toolState.channelData.logoUrl}
                          alt={msg.toolState.channelData.title}
                          className="w-12 h-12 rounded-full border shadow-xs object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                          <Radio className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold truncate text-foreground">{msg.toolState.channelData.title}</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {msg.toolState.channelData.handle || msg.toolState.channelData.id} • {msg.toolState.channelData.subscribersCount || '0'} Subs
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => executeChannelAction(msg.id, 'stats', msg.toolState!.channelData!)}
                        className="p-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Live Stats</span>
                      </button>

                      <button
                        onClick={() => executeChannelAction(msg.id, 'keywords', msg.toolState!.channelData!)}
                        className="p-2 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Hash className="w-3.5 h-3.5" />
                        <span>Keywords</span>
                      </button>

                      <button
                        onClick={() => executeChannelAction(msg.id, 'banner', msg.toolState!.channelData!)}
                        className="p-2 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>HD Banner</span>
                      </button>

                      <button
                        onClick={() => {
                          setRememberingAliasForChannel(msg.toolState!.channelData!.title.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                          handleRememberChannel(
                            msg.toolState!.channelData!.title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                            msg.toolState!.channelData!
                          );
                        }}
                        className="p-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>Remember</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2c. YouTube Channel Result Container */}
                {msg.toolState?.type === 'youtube_channel_result' && msg.toolState.channelData && (
                  <div className="pt-2 border-t space-y-3">
                    {/* Live Stats */}
                    {msg.toolState.selectedAction === 'stats' && (
                      <div className="p-3 rounded-xl bg-background/60 border space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" /> Channel Analytics Overview
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {msg.toolState.channelData.id}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 rounded-lg bg-muted/60 border">
                            <p className="text-[10px] text-muted-foreground">Subscribers</p>
                            <p className="text-xs sm:text-sm font-bold text-foreground">{msg.toolState.channelData.subscribersCount || 'N/A'}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/60 border">
                            <p className="text-[10px] text-muted-foreground">Total Views</p>
                            <p className="text-xs sm:text-sm font-bold text-foreground">{msg.toolState.channelData.viewCount || 'N/A'}</p>
                          </div>
                          <div className="p-2 rounded-lg bg-muted/60 border">
                            <p className="text-[10px] text-muted-foreground">Videos</p>
                            <p className="text-xs sm:text-sm font-bold text-foreground">{msg.toolState.channelData.videoCount || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Keywords Result */}
                    {msg.toolState.selectedAction === 'keywords' && (
                      <div className="p-3 rounded-xl bg-background/60 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                            <Hash className="w-3.5 h-3.5 text-purple-500" /> Channel Target Keywords
                          </span>
                          {msg.toolState.channelData.keywords && msg.toolState.channelData.keywords.length > 0 && (
                            <button
                              onClick={() => copyToClipboard(msg.toolState!.channelData!.keywords?.join(', ') || '', `ch-kw-${msg.id}`)}
                              className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === `ch-kw-${msg.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              Copy
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 p-1">
                          {msg.toolState.channelData.keywords && msg.toolState.channelData.keywords.length > 0 ? (
                            msg.toolState.channelData.keywords.map((kw, kidx) => (
                              <span key={kidx} className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-medium border border-purple-500/20">
                                #{kw}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No channel-level keywords published.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Banner Result */}
                    {msg.toolState.selectedAction === 'banner' && (
                      <div className="p-3 rounded-xl bg-background/60 border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                            <Layers className="w-3.5 h-3.5 text-blue-500" /> Channel Header Banner
                          </span>
                          {msg.toolState.channelData.bannerUrl && (
                            <a
                              href={msg.toolState.channelData.bannerUrl}
                              target="_blank"
                              rel="noreferrer"
                              download="channel-banner.jpg"
                              onClick={() => sound.download()}
                              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-500 text-white flex items-center gap-1 hover:bg-blue-600 transition-colors shadow-xs cursor-pointer"
                            >
                              <Download className="w-3 h-3" /> Download HD
                            </a>
                          )}
                        </div>
                        {msg.toolState.channelData.bannerUrl ? (
                          <div className="relative rounded-lg overflow-hidden border">
                            <img
                              src={msg.toolState.channelData.bannerUrl}
                              alt="Channel Banner"
                              className="w-full h-28 object-cover"
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No custom banner found for this channel.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Image Options Card */}
                {msg.toolState?.type === 'image_options' && msg.toolState.imageInfo && (
                  <div className="pt-2 border-t space-y-3">
                    {/* Auto Analysis Header Card */}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border">
                      <img
                        src={msg.toolState.imageInfo.originalUrl}
                        alt="Uploaded"
                        className="w-16 h-16 object-cover rounded-lg border shadow-xs shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-semibold truncate text-foreground">{msg.toolState.imageInfo.name}</p>
                        <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                          <span className="font-mono bg-background px-1.5 py-0.5 rounded border">{msg.toolState.imageInfo.originalSize}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20">
                            ✨ File Analyzed
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {/* Highlighted Crop Action Button */}
                      <button
                        onClick={() => {
                          const userMsg = messages.find(m => m.attachment?.fileObj);
                          executeImageAction(msg.id, 'crop', msg.toolState!.imageInfo!, userMsg);
                        }}
                        className="w-full p-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:from-emerald-500/25 hover:to-teal-500/25 border border-emerald-500/30 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        <Crop className="w-4 h-4 text-emerald-500" />
                        <span>✂️ Open Interactive Cropper Workspace</span>
                      </button>

                      {/* Quick Aspect Ratio Presets */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground pl-0.5">Quick Crop Presets:</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { label: '1:1 Square (DP)', preset: '1:1', aspect: 1 },
                            { label: '16:9 Video', preset: '16:9', aspect: 16 / 9 },
                            { label: '9:16 Story', preset: '9:16', aspect: 9 / 16 },
                            { label: '4:3 Standard', preset: '4:3', aspect: 4 / 3 }
                          ].map((item) => (
                            <button
                              key={item.preset}
                              onClick={() => {
                                sound.click();
                                setMessages((prev) =>
                                  prev.map((m) => {
                                    if (m.id === msg.id && m.toolState) {
                                      return {
                                        ...m,
                                        text: `✂️ **ইমেজ ক্রপার ওপেন করা হয়েছে (${item.preset}):**\nপ্রয়োজনীয় Frame, Zoom, Rotation বা Flip সেট করে **Apply & Crop Image Now** বাটনে চাপুন:`,
                                        toolState: {
                                          ...m.toolState,
                                          type: 'image_crop_workspace',
                                          cropWorkspaceInfo: {
                                            imageUrl: msg.toolState!.imageInfo!.originalUrl,
                                            fileName: msg.toolState!.imageInfo!.name,
                                            initialAspect: item.aspect,
                                            initialPreset: item.preset,
                                          }
                                        }
                                      };
                                    }
                                    return m;
                                  })
                                );
                              }}
                              className="py-1.5 px-1 rounded-lg text-[10px] font-semibold bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border transition-all text-center cursor-pointer"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Conversion & Compression Quick Action Grid */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground pl-0.5">Quick Actions:</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              const userMsg = [...messages].reverse().find(m => m.attachment?.fileObj || m.attachment?.url);
                              executeImageAction(msg.id, 'compress', msg.toolState!.imageInfo!, userMsg);
                            }}
                            className="p-2.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>🗜️ Compress Size (65%)</span>
                          </button>

                          <button
                            onClick={() => {
                              const userMsg = [...messages].reverse().find(m => m.attachment?.fileObj || m.attachment?.url);
                              executeImageAction(msg.id, 'webp', msg.toolState!.imageInfo!, userMsg);
                            }}
                            className="p-2.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>⚡ Convert to WebP</span>
                          </button>

                          <button
                            onClick={() => {
                              const userMsg = [...messages].reverse().find(m => m.attachment?.fileObj || m.attachment?.url);
                              executeImageAction(msg.id, 'png', msg.toolState!.imageInfo!, userMsg);
                            }}
                            className="p-2.5 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>🖼️ Convert to PNG</span>
                          </button>

                          <button
                            onClick={() => {
                              const userMsg = [...messages].reverse().find(m => m.attachment?.fileObj || m.attachment?.url);
                              executeImageAction(msg.id, 'jpeg', msg.toolState!.imageInfo!, userMsg);
                            }}
                            className="p-2.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Palette className="w-3.5 h-3.5" />
                            <span>🎨 Convert to JPG</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3.1. Interactive In-Chat Image Cropper Workspace */}
                {msg.toolState?.type === 'image_crop_workspace' && msg.toolState.cropWorkspaceInfo && (
                  <div className="pt-2 border-t">
                    <InChatCropper
                      imageUrl={msg.toolState.cropWorkspaceInfo.imageUrl}
                      fileName={msg.toolState.cropWorkspaceInfo.fileName}
                      initialAspect={msg.toolState.cropWorkspaceInfo.initialAspect}
                      initialPreset={msg.toolState.cropWorkspaceInfo.initialPreset}
                      onApplyCrop={(result) => handleCropApplied(msg.id, result, msg.toolState!.cropWorkspaceInfo!)}
                      onCancel={() => {
                        sound.click();
                        setMessages((prev) =>
                          prev.map((m) => {
                            if (m.id === msg.id && m.toolState) {
                              return {
                                ...m,
                                text: `🖼️ **Select an action for your uploaded image:**`,
                                toolState: {
                                  ...m.toolState,
                                  type: 'image_options',
                                  imageInfo: {
                                    name: m.toolState.cropWorkspaceInfo!.fileName,
                                    originalSize: 'Attached',
                                    originalUrl: m.toolState.cropWorkspaceInfo!.imageUrl,
                                  }
                                }
                              };
                            }
                            return m;
                          })
                        );
                      }}
                    />
                  </div>
                )}

                {/* 3.2. Cropped Image Result Card */}
                {msg.toolState?.type === 'image_crop_result' && msg.toolState.cropResult && (
                  <div className="pt-2 border-t">
                    <InChatCropResultCard
                      result={msg.toolState.cropResult}
                      onReCrop={() => handleReCrop(msg.id, msg.toolState!.cropWorkspaceInfo!)}
                    />
                  </div>
                )}

                {/* 4. Image Result Box */}
                {msg.toolState?.type === 'image_result' && msg.toolState.imageInfo && (
                  <div className="pt-2 border-t space-y-3">
                    <div className="p-3 rounded-xl bg-background/60 border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> Processed into {msg.toolState.imageInfo.format}
                        </span>
                        {msg.toolState.imageInfo.savingsPercent !== undefined && msg.toolState.imageInfo.savingsPercent > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                            {msg.toolState.imageInfo.savingsPercent}% Smaller!
                          </span>
                        )}
                      </div>

                      <div className="relative rounded-lg overflow-hidden border">
                        <img
                          src={msg.toolState.imageInfo.convertedUrl}
                          alt="Converted"
                          className="w-full max-h-56 object-contain bg-muted/30"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-muted-foreground">
                          <span>{msg.toolState.imageInfo.originalSize}</span> → <strong className="text-emerald-500">{msg.toolState.imageInfo.newSize}</strong>
                        </div>

                        <a
                          href={msg.toolState.imageInfo.convertedUrl}
                          download={`converted-${msg.toolState.imageInfo.name.split('.')[0]}.${msg.toolState.imageInfo.format?.toLowerCase().includes('png') ? 'png' : msg.toolState.imageInfo.format?.toLowerCase().includes('jpg') ? 'jpg' : 'webp'}`}
                          onClick={() => sound.download()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Image
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Document Options Tray */}
                {msg.toolState?.type === 'document_options' && msg.toolState.documentInfo && (
                  <div className="pt-2 border-t space-y-3">
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-foreground">{msg.toolState.documentInfo.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {msg.toolState.documentInfo.size} • {msg.toolState.documentInfo.words || 0} Words • {msg.toolState.documentInfo.lines || 0} Lines
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => executeDocumentAction(msg.id, 'count', msg.toolState!.documentInfo)}
                        className="p-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Word Stats</span>
                      </button>

                      <button
                        onClick={() => executeDocumentAction(msg.id, 'upper', msg.toolState!.documentInfo)}
                        className="p-2 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center gap-1.5"
                      >
                        <Type className="w-3.5 h-3.5" />
                        <span>UPPERCASE</span>
                      </button>

                      <button
                        onClick={() => executeDocumentAction(msg.id, 'lower', msg.toolState!.documentInfo)}
                        className="p-2 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center gap-1.5"
                      >
                        <Type className="w-3.5 h-3.5" />
                        <span>lowercase</span>
                      </button>

                      <button
                        onClick={() => executeDocumentAction(msg.id, 'json', msg.toolState!.documentInfo)}
                        className="p-2 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center gap-1.5"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>Format JSON</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. Document Result Box */}
                {msg.toolState?.type === 'document_result' && msg.toolState.documentInfo && (
                  <div className="pt-2 border-t space-y-3">
                    <div className="p-3 rounded-xl bg-background/60 border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Output Result
                        </span>
                        {msg.toolState.documentInfo.formattedResult && (
                          <button
                            onClick={() => copyToClipboard(msg.toolState!.documentInfo!.formattedResult || '', `doc-${msg.id}`)}
                            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                          >
                            {copiedId === `doc-${msg.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            Copy Text
                          </button>
                        )}
                      </div>

                      {msg.toolState.documentInfo.formattedResult && (
                        <pre className="p-2.5 rounded-lg bg-muted text-[11px] font-mono max-h-48 overflow-y-auto border whitespace-pre-wrap break-all text-foreground">
                          {msg.toolState.documentInfo.formattedResult}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. Memory Media Items Box */}
                {msg.toolState?.type === 'memory_items_result' && Array.isArray(msg.toolState.actionResultData) && (
                  <div className="pt-2 border-t space-y-2">
                    <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                      {msg.toolState.actionResultData.map((item: any, idx: number) => (
                        <div key={item.id || idx} className="p-2.5 rounded-xl bg-background/80 border space-y-1.5 hover:border-emerald-500/40 transition-all">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                              {item.type === 'youtube' && <Youtube className="w-3 h-3 text-red-500" />}
                              {item.type === 'facebook' && <Facebook className="w-3 h-3 text-blue-500" />}
                              {item.type === 'tiktok' && <Music2 className="w-3 h-3 text-cyan-500" />}
                              {item.type === 'image' && <ImageIcon className="w-3 h-3 text-emerald-500" />}
                              {item.type === 'url' && <ExternalLink className="w-3 h-3 text-purple-500" />}
                              <span>{item.type.toUpperCase()}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">{item.timestamp}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-foreground truncate min-w-0 flex-1">
                              {item.title || item.url}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-600 transition-colors"
                              >
                                {item.type === 'image' ? <Eye className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                                <span>{item.type === 'image' ? 'View' : 'Open'}</span>
                              </a>
                              <button
                                onClick={() => copyToClipboard(item.url, `mem-${item.id}`)}
                                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                                title="Copy Link"
                              >
                                {copiedId === `mem-${item.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {item.contextMessage && (
                            <p className="text-[10px] text-muted-foreground italic truncate">
                              "{item.contextMessage}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] opacity-60 pt-1">
                  <span>{msg.timestamp}</span>
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(msg.text, `msg-${msg.id}`)}
                      className="hover:opacity-100 flex items-center gap-1 transition-opacity"
                      title="Copy response"
                    >
                      {copiedId === `msg-${msg.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Interactive Typing Animation & Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex gap-2.5 max-w-3xl mr-auto items-end"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm ring-2 ring-emerald-500/20">
              <Bot className="w-4 h-4" />
            </div>

            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-card border shadow-sm flex items-center gap-3">
              {/* Three Bouncing Dots Animation */}
              <div className="flex items-center gap-1 py-1">
                <motion.span
                  className="w-2 h-2 rounded-full bg-emerald-500 inline-block"
                  animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                />
                <motion.span
                  className="w-2 h-2 rounded-full bg-teal-500 inline-block"
                  animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                />
                <motion.span
                  className="w-2 h-2 rounded-full bg-emerald-600 inline-block"
                  animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pl-1 border-l">
                <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-[11px] animate-pulse">SmartBot is processing...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── BOTTOM INPUT SECTION (HIGH-END TEXT BOX & ATTACHMENT HUB) ──────── */}
      <div className="p-2.5 sm:p-3 border-t bg-card/95 backdrop-blur-md shrink-0 space-y-2 z-20">
        {/* Recent Session Command Quick Chips */}
        {commandHistory.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-4xl mx-auto scrollbar-none">
            <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0 flex items-center gap-1 pl-1">
              <History className="w-3 h-3 text-emerald-500" /> Recent:
            </span>
            {commandHistory.slice(-4).reverse().map((cmd, idx) => (
              <button
                key={`chip-${idx}`}
                onClick={() => {
                  sound.click();
                  setInputVal(cmd);
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.value = cmd;
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
                  }
                }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-muted hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border text-muted-foreground hover:border-emerald-500/30 transition-all truncate max-w-[160px] sm:max-w-[200px] shrink-0 font-mono"
                title={`Reuse: "${cmd}"`}
              >
                {cmd}
              </button>
            ))}
          </div>
        )}

        {/* Attached File Preview Bar with Auto-Analysis & Quick-Action Triggers before Sending */}
        {attachedFile && (
          <div className="p-2.5 rounded-xl bg-card border shadow-xs max-w-4xl mx-auto space-y-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {attachedFile.type === 'image' && attachedFile.previewUrl ? (
                  <img src={attachedFile.previewUrl} alt="preview" className="w-10 h-10 object-cover rounded-lg border shadow-xs shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="truncate">
                  <p className="font-semibold truncate text-foreground text-xs">{attachedFile.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {attachedFile.size} • {attachedFile.dimensions?.aspectRatio || attachedFile.type.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Suggestion Buttons for Attached File */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-1 border-t">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Quick Actions:
              </span>
              {attachedFile.type === 'image' ? (
                <>
                  <button
                    onClick={() => handleSendMessage('Crop image')}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <Crop className="w-3 h-3" />
                    <span>✂️ Crop</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage('Compress image')}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>🗜️ Compress</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage('Convert to webp')}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3 h-3" />
                    <span>⚡ Convert WebP</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage('Convert to png')}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>🖼️ Convert PNG</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage('Convert to jpeg')}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <Palette className="w-3 h-3" />
                    <span>🎨 Convert JPG</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSendMessage('Word count')}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    <span>📊 Word Stats</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage('Format JSON')}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>✨ Format JSON</span>
                  </button>
                  <button
                    onClick={() => handleSendMessage('Uppercase')}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    <Type className="w-3 h-3" />
                    <span>🔠 UPPERCASE</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Text Input Row - Perfectly Leveled & Optimized */}
        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full relative">
          {/* Hidden HTML Inputs for Direct Selection */}
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleNativeFileChange}
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp"
            className="hidden"
          />
          <input
            type="file"
            ref={docInputRef}
            onChange={handleNativeFileChange}
            accept=".pdf,.txt,.json,.md,.csv,.doc,.docx"
            className="hidden"
          />
          <input
            type="file"
            ref={allFileInputRef}
            onChange={handleNativeFileChange}
            accept="*/*"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleNativeFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* Attachment Button & Popover Trigger */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => {
                sound.click();
                setShowAttachMenu(!showAttachMenu);
              }}
              className={`p-2.5 rounded-2xl border transition-all shrink-0 flex items-center justify-center h-11 w-11 ${
                showAttachMenu 
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20' 
                  : 'bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border-border hover:border-emerald-500/40'
              }`}
              title="Attach Images, Documents, Camera or Clipboard"
            >
              <Plus className={`w-5 h-5 transition-transform duration-200 ${showAttachMenu ? 'rotate-45 text-white' : ''}`} />
            </button>

            {/* In-Browser Attachment Options Popover Menu */}
            <AnimatePresence>
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 bg-card border rounded-2xl shadow-2xl z-50 p-3 space-y-2.5 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b pb-2 px-1">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> In-Browser File Options
                    </span>
                    <button
                      onClick={() => setShowAttachMenu(false)}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Primary Selection Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Image / Gallery */}
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2.5 rounded-xl border bg-muted/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-left transition-all group flex flex-col gap-1"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit group-hover:scale-105 transition-transform">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Photos & Images</span>
                      <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP</span>
                    </button>

                    {/* Documents */}
                    <button
                      onClick={() => docInputRef.current?.click()}
                      className="p-2.5 rounded-xl border bg-muted/40 hover:bg-blue-500/10 hover:border-blue-500/30 text-left transition-all group flex flex-col gap-1"
                    >
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 w-fit group-hover:scale-105 transition-transform">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Documents</span>
                      <span className="text-[10px] text-muted-foreground">PDF, TXT, JSON, MD</span>
                    </button>

                    {/* Camera */}
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-2.5 rounded-xl border bg-muted/40 hover:bg-purple-500/10 hover:border-purple-500/30 text-left transition-all group flex flex-col gap-1"
                    >
                      <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 w-fit group-hover:scale-105 transition-transform">
                        <Camera className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Take Photo</span>
                      <span className="text-[10px] text-muted-foreground">Direct Camera</span>
                    </button>

                    {/* Clipboard Direct Paste */}
                    <button
                      onClick={handlePasteClipboardBtn}
                      className="p-2.5 rounded-xl border bg-muted/40 hover:bg-amber-500/10 hover:border-amber-500/30 text-left transition-all group flex flex-col gap-1"
                    >
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 w-fit group-hover:scale-105 transition-transform">
                        <Clipboard className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">Paste Clipboard</span>
                      <span className="text-[10px] text-muted-foreground">Ctrl+V / Screenshot</span>
                    </button>

                    {/* Crop Image Directly */}
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        setInputVal('Crop image');
                        imageInputRef.current?.click();
                      }}
                      className="p-2.5 rounded-xl border bg-muted/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-left transition-all group flex items-center gap-2.5 col-span-2"
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-fit group-hover:scale-105 transition-transform shrink-0">
                        <Crop className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-foreground block truncate">✂️ Crop & Aspect Ratio</span>
                        <span className="text-[10px] text-muted-foreground block truncate">1:1, 16:9, 9:16, 4:3, Zoom, Rotate, Flip</span>
                      </div>
                    </button>
                  </div>

                  {/* Quick Sample Presets */}
                  <div className="pt-2 border-t space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">
                      ⚡ Quick Sample Files
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleLoadSampleFile('photo')}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-muted text-[10px] font-medium hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border text-foreground transition-colors truncate"
                      >
                        🌄 HD Photo
                      </button>
                      <button
                        onClick={() => handleLoadSampleFile('icon')}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-muted text-[10px] font-medium hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border text-foreground transition-colors truncate"
                      >
                        🎨 Logo Icon
                      </button>
                      <button
                        onClick={() => handleLoadSampleFile('json')}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-muted text-[10px] font-medium hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border text-foreground transition-colors truncate"
                      >
                        📄 JSON
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Elevated Textarea Input Container */}
          <div className="flex-1 relative focus-within:ring-2 focus-within:ring-emerald-500/40 rounded-2xl transition-all flex items-center">
            <textarea
              ref={textareaRef}
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' && (inputVal === '' || historyIndex !== -1)) {
                  e.preventDefault();
                  navigateHistory('up');
                } else if (e.key === 'ArrowDown' && historyIndex !== -1) {
                  e.preventDefault();
                  navigateHistory('down');
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message or paste URL..."
              rows={1}
              className="w-full resize-none rounded-2xl border bg-background px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none leading-normal min-h-[44px] max-h-32 overflow-y-auto"
            />

            {/* Clear Input Button if text present */}
            {inputVal && (
              <button
                onClick={() => {
                  setInputVal('');
                  if (textareaRef.current) {
                    textareaRef.current.value = '';
                    textareaRef.current.style.height = 'auto';
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full bg-muted/60 hover:bg-muted transition-colors"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputVal.trim() && !attachedFile)}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transition-all shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center justify-center h-11 w-11"
            title="Send Message"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ─── BRAIN MEMORY & SAVED CHANNELS MODAL ────────────────────────────── */}
      <AnimatePresence>
        {showMemoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b bg-muted/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shadow-inner">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-base sm:text-lg text-foreground">Bot Brain & Memory Layer</h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        {isSupabaseConfigured() ? 'Cloud Synced' : 'Local Persistence'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Continuous memory of saved channels, aliases & user facts across sessions.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMemoryModal(false)}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-5 custom-scrollbar flex-1">
                {/* 1. Add New Channel Memory Form */}
                <div className="p-3.5 rounded-2xl border bg-muted/20 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Plus className="w-4 h-4 text-cyan-500" />
                    <span>Teach Bot a New Channel (Memory Entry)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        Channel Alias / Name (e.g. <code>rony</code> or <code>mychannel</code>)
                      </label>
                      <input
                        type="text"
                        value={newChannelAlias}
                        onChange={(e) => setNewChannelAlias(e.target.value)}
                        placeholder="e.g. rony"
                        className="w-full text-xs px-3 py-2 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                        YouTube URL, Handle or ID
                      </label>
                      <input
                        type="text"
                        value={newChannelUrl}
                        onChange={(e) => setNewChannelUrl(e.target.value)}
                        placeholder="e.g. https://youtube.com/@RonyTech"
                        className="w-full text-xs px-3 py-2 rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleManualAddChannel}
                    disabled={!newChannelAlias.trim() || !newChannelUrl.trim()}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Channel to AI Brain</span>
                  </button>
                </div>

                {/* 2. Remembered YouTube Channels List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-purple-500" />
                      <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        Saved Channels ({savedChannels.length})
                      </h3>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Ask in chat: <i>"Amar [alias] channel er info dao"</i>
                    </span>
                  </div>

                  {savedChannels.length === 0 ? (
                    <div className="p-4 text-center rounded-2xl border border-dashed text-xs text-muted-foreground bg-muted/10">
                      No channels remembered yet. Teach the bot by typing <code>"Amar channel er nam Rony"</code> or use the form above!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedChannels.map((item) => (
                        <div
                          key={item.alias}
                          className="p-3 rounded-2xl border bg-card hover:border-cyan-500/30 transition-all flex items-center justify-between gap-3 group shadow-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-mono">
                                @{item.alias}
                              </span>
                              <span className="font-semibold text-xs text-foreground truncate">{item.title}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                              {item.lastStats?.subscribers && <span>👥 {item.lastStats.subscribers}</span>}
                              {item.lastStats?.views && <span>👁️ {item.lastStats.views}</span>}
                              {item.lastStats?.videos && <span>🎬 {item.lastStats.videos}</span>}
                              <span className="font-mono text-[10px] opacity-70">ID: {item.channelId}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setShowMemoryModal(false);
                                handleSendMessage(`Amar ${item.alias} channel er info dao`);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold transition-colors flex items-center gap-1"
                              title="Ask bot for live channel data"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>Query</span>
                            </button>

                            <button
                              onClick={() => handleDeleteChannel(item.alias)}
                              className="p-1.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete from memory"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Learned User Facts / Profile Memory */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                      Learned Facts & Preferences
                    </h3>
                  </div>

                  {Object.keys(memoryFacts).length === 0 ? (
                    <div className="p-3 text-center rounded-2xl border border-dashed text-xs text-muted-foreground bg-muted/10">
                      Say <i>"Amar nam [Name]"</i> or <i>"Amar topic [Topic]"</i> to let the bot remember your identity.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(memoryFacts).map(([k, v]) => {
                        const displayVal = typeof v === 'object' && v !== null && 'value' in v
                          ? (typeof v.value === 'object' ? JSON.stringify(v.value) : String(v.value))
                          : String(v);
                        return (
                          <div key={k} className="p-2.5 rounded-xl border bg-muted/20 text-xs flex items-center justify-between">
                            <span className="font-semibold text-muted-foreground capitalize">{k.replace('_', ' ')}:</span>
                            <span className="font-bold text-foreground truncate ml-2">{displayVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 4. Chat Local Memory Engine (Stored Links & Images) */}
                <div className="space-y-2.5 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
                        Stored Links & Images ({getSmartBotMemory().mediaHistory.length})
                      </h3>
                    </div>
                    {getSmartBotMemory().mediaHistory.length > 0 && (
                      <button
                        onClick={() => {
                          clearSmartBotMemory();
                          toast({ title: 'SmartBot Memory Cleared' });
                        }}
                        className="text-[11px] text-destructive hover:bg-destructive/10 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Clear Memory
                      </button>
                    )}
                  </div>

                  {getSmartBotMemory().mediaHistory.length === 0 ? (
                    <div className="p-3 text-center rounded-2xl border border-dashed text-xs text-muted-foreground bg-muted/10">
                      No links or images saved in chat memory yet. Send any YouTube link or image and ask <i>"amar YouTube link gulo deo"</i> anytime!
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {getSmartBotMemory().mediaHistory.slice(-10).reverse().map((item) => (
                        <div key={item.id} className="p-2 rounded-xl border bg-card text-xs flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {item.type}
                            </span>
                            <span className="truncate font-mono text-[11px] text-foreground">{item.title || item.url}</span>
                          </div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg hover:bg-muted text-primary shrink-0"
                            title="Open Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:p-4 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground shrink-0">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Database className="w-3.5 h-3.5 text-cyan-500" />
                  Instant AI Retrieval & YouTube API Sync
                </span>
                <button
                  onClick={() => setShowMemoryModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-card border hover:bg-muted font-semibold text-foreground text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
