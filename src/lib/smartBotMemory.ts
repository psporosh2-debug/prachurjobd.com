import chatDataRaw from '../data/chatdata.json';

export interface ChatDatasetItem {
  id: string;
  category: string;
  keywords: string[];
  responses: string[];
}

export interface StoredMediaItem {
  id: string;
  type: 'youtube' | 'facebook' | 'tiktok' | 'url' | 'image';
  url: string;
  title?: string;
  thumbnail?: string;
  timestamp: string;
  contextMessage?: string;
}

export interface SmartBotMemoryState {
  userNotes: string[];
  mediaHistory: StoredMediaItem[];
  chatStats: {
    totalMessages: number;
    linksSharedCount: number;
    imagesUploadedCount: number;
    lastActive: string;
  };
}

const MEMORY_STORAGE_KEY = 'prachurjo_smartbot_memory_v1';

// Get or initialize memory from localStorage
export function getSmartBotMemory(): SmartBotMemoryState {
  if (typeof window === 'undefined') {
    return {
      userNotes: [],
      mediaHistory: [],
      chatStats: { totalMessages: 0, linksSharedCount: 0, imagesUploadedCount: 0, lastActive: new Date().toISOString() }
    };
  }

  try {
    const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        userNotes: Array.isArray(parsed.userNotes) ? parsed.userNotes : [],
        mediaHistory: Array.isArray(parsed.mediaHistory) ? parsed.mediaHistory : [],
        chatStats: parsed.chatStats || { totalMessages: 0, linksSharedCount: 0, imagesUploadedCount: 0, lastActive: new Date().toISOString() }
      };
    }
  } catch (e) {
    console.error('Failed to parse SmartBot memory:', e);
  }

  return {
    userNotes: [],
    mediaHistory: [],
    chatStats: { totalMessages: 0, linksSharedCount: 0, imagesUploadedCount: 0, lastActive: new Date().toISOString() }
  };
}

// Save memory to localStorage
export function saveSmartBotMemory(memory: SmartBotMemoryState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
  } catch (e) {
    console.error('Failed to save SmartBot memory:', e);
  }
}

// Extract URLs and images from incoming user text and store them into local memory
export function recordInteractionToMemory(text: string, attachedImages: string[] = []): { newLinks: StoredMediaItem[]; newImages: StoredMediaItem[] } {
  const memory = getSmartBotMemory();
  const timestamp = new Date().toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' });

  const newLinks: StoredMediaItem[] = [];
  const newImages: StoredMediaItem[] = [];

  // Extract all URLs from text
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];

  matches.forEach((url) => {
    // Avoid duplicate storing if identical URL stored recently
    const alreadyExists = memory.mediaHistory.some((m) => m.url === url);
    if (!alreadyExists) {
      let type: StoredMediaItem['type'] = 'url';
      let title = 'Saved Link';

      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        type = 'youtube';
        title = 'YouTube Video Link';
      } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
        type = 'facebook';
        title = 'Facebook Video Link';
      } else if (url.includes('tiktok.com')) {
        type = 'tiktok';
        title = 'TikTok Video Link';
      }

      const item: StoredMediaItem = {
        id: 'link_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        type,
        url,
        title,
        timestamp,
        contextMessage: text.slice(0, 80)
      };

      memory.mediaHistory.unshift(item);
      newLinks.push(item);
    }
  });

  // Extract uploaded images
  attachedImages.forEach((imgUrl) => {
    const alreadyExists = memory.mediaHistory.some((m) => m.url === imgUrl);
    if (!alreadyExists) {
      const item: StoredMediaItem = {
        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        type: 'image',
        url: imgUrl,
        title: 'User Uploaded Photo',
        timestamp,
        contextMessage: text ? text.slice(0, 60) : 'Direct Image Attachment'
      };
      memory.mediaHistory.unshift(item);
      newImages.push(item);
    }
  });

  // Update Stats
  memory.chatStats.totalMessages += 1;
  memory.chatStats.linksSharedCount += newLinks.length;
  memory.chatStats.imagesUploadedCount += newImages.length;
  memory.chatStats.lastActive = new Date().toISOString();

  saveSmartBotMemory(memory);

  return { newLinks, newImages };
}

// Track response selection state to avoid repetitive behavior
const lastResponseIndexMap: Record<string, number> = {};
let lastServedResponseText: string = '';

// Active conversation flow state tracking
export type BotConversationState = 
  | 'NONE'
  | 'AWAITING_URL_CONFIRMATION_YOUTUBE'
  | 'AWAITING_URL_YOUTUBE'
  | 'AWAITING_URL_CONFIRMATION_TIKTOK'
  | 'AWAITING_URL_TIKTOK'
  | 'AWAITING_URL_CONFIRMATION_FACEBOOK'
  | 'AWAITING_URL_FACEBOOK'
  | 'AWAITING_IMAGE_UPLOAD_CONFIRMATION'
  | 'AWAITING_IMAGE';

let activeBotState: BotConversationState = 'NONE';

export function getActiveBotState(): BotConversationState {
  return activeBotState;
}

export function setActiveBotState(state: BotConversationState): void {
  activeBotState = state;
}

export function resetDatasetResponseState(): void {
  for (const key in lastResponseIndexMap) {
    delete lastResponseIndexMap[key];
  }
  lastServedResponseText = '';
  activeBotState = 'NONE';
}

// Search chatdata.json for match with dynamic non-repetitive response selection
export function queryChatDataset(userInput: string): { matched: boolean; response: string; category?: string } | null {
  if (!userInput) return null;
  const cleanInput = userInput.trim().toLowerCase();

  const yesKeywords = ["he", "ha", "hoo", "hmm", "ji", "yep", "yeah", "yes", "হ্যাঁ", "হুম", "জি", "জি স্যার", "হুম দেন", "ok", "okay", "den", "dao", "send", "de"];
  const noKeywords = ["na", "no", "not", "lagbe na", "na thak", "pore", "no thanks", "না", "নাহ", "লাগবে না", "বাদ দাও"];

  // 1. Check if we are in an active multi-turn conversational state
  if (activeBotState !== 'NONE') {
    const isYes = yesKeywords.some(kw => cleanInput === kw || cleanInput.startsWith(kw + ' ') || cleanInput.endsWith(' ' + kw));
    const isNo = noKeywords.some(kw => cleanInput === kw || cleanInput.startsWith(kw + ' ') || cleanInput.endsWith(' ' + kw));

    if (isNo) {
      activeBotState = 'NONE';
      return {
        matched: true,
        response: "ঠিক আছে স্যার, কোনো সমস্যা নেই! অন্য যেকোনো কিছু প্রসেস বা জানতে চাইলে আমাকে সরাসরি জানাতে পারেন। 😊",
        category: "conversational_flow"
      };
    }

    if (activeBotState === 'AWAITING_URL_CONFIRMATION_YOUTUBE') {
      if (isYes) {
        activeBotState = 'AWAITING_URL_YOUTUBE';
        return {
          matched: true,
          response: "den ami apnake extract kore dibo",
          category: "conversational_flow"
        };
      }
    } else if (activeBotState === 'AWAITING_URL_YOUTUBE') {
      activeBotState = 'NONE';
      return {
        matched: true,
        response: "ey nen 😋 আপনার ইউটিউব ভিডিওর সমস্ত থাম্বনেইল, এসইও টাইটেল, ভাইরাল ট্যাগ এবং ডেসক্রিপশন জেনারেট করে দিয়েছি স্যার!",
        category: "conversational_flow"
      };
    } else if (activeBotState === 'AWAITING_URL_CONFIRMATION_TIKTOK') {
      if (isYes) {
        activeBotState = 'AWAITING_URL_TIKTOK';
        return {
          matched: true,
          response: "তাহলে টিকটক ভিডিওর লিঙ্কটি দিন, আমি নো-ওয়াটারমার্ক এইচডি ভিডিও রেডি করে দিচ্ছি স্যার!",
          category: "conversational_flow"
        };
      }
    } else if (activeBotState === 'AWAITING_URL_TIKTOK') {
      activeBotState = 'NONE';
      return {
        matched: true,
        response: "ey nen 😋 ওয়াটারমার্ক ছাড়া আপনার টিকটক এইচডি ভিডিও এবং এমপি৩ ব্যাকগ্রাউন্ড মিউজিক ডাউনলোড লিংক রেডি!",
        category: "conversational_flow"
      };
    } else if (activeBotState === 'AWAITING_URL_CONFIRMATION_FACEBOOK') {
      if (isYes) {
        activeBotState = 'AWAITING_URL_FACEBOOK';
        return {
          matched: true,
          response: "লিঙ্কটি এখানে দিন স্যার, ফেসবুক পাবলিক ভিডিও বা রিলস ফুল এইচডি ১০৮০p ফাইল রেডি করে দিচ্ছি!",
          category: "conversational_flow"
        };
      }
    } else if (activeBotState === 'AWAITING_URL_FACEBOOK') {
      activeBotState = 'NONE';
      return {
        matched: true,
        response: "ey nen 😋 আপনার ফেসবুক ফুল এইচডি ১০৮০p ভিডিও ফাইল সরাসরি ডাউনলোডের জন্য একদম রেডি!",
        category: "conversational_flow"
      };
    } else if (activeBotState === 'AWAITING_IMAGE_UPLOAD_CONFIRMATION') {
      if (isYes) {
        activeBotState = 'AWAITING_IMAGE';
        return {
          matched: true,
          response: "জি স্যার, আপনার কাঙ্ক্ষিত ছবিটি সেন্ড করুন অথবা ড্র্যাগ করে চ্যাটে ড্রপ করুন, আমি ক্রপ ও ফরম্যাট চেঞ্জ মেনু ওপেন করে দিচ্ছি!",
          category: "conversational_flow"
        };
      }
    } else if (activeBotState === 'AWAITING_IMAGE') {
      activeBotState = 'NONE';
      return {
        matched: true,
        response: "ey nen 😋 আপনার ছবির এডিটিং ও ফরম্যাট কনভার্সন অপশন প্যানেল সম্পূর্ণ প্রস্তুত!",
        category: "conversational_flow"
      };
    }
  }

  // 2. Fallback to normal dataset query
  const dataset: ChatDatasetItem[] = chatDataRaw.dataset;

  // Track best match
  let bestMatch: ChatDatasetItem | null = null;
  let maxMatchedLen = 0;

  for (const item of dataset) {
    for (const kw of item.keywords) {
      const lowerKw = kw.toLowerCase();
      // Match if input includes keyword or exact match
      if (cleanInput.includes(lowerKw) || lowerKw.includes(cleanInput)) {
        if (lowerKw.length > maxMatchedLen) {
          maxMatchedLen = lowerKw.length;
          bestMatch = item;
        }
      }
    }
  }

  if (bestMatch && bestMatch.responses && bestMatch.responses.length > 0) {
    const responses = bestMatch.responses;
    let selectedResponse = '';

    // Adjust state transitions depending on which tutorial/guide was matched
    if (bestMatch.id === "youtube_tool_guide") {
      activeBotState = 'AWAITING_URL_CONFIRMATION_YOUTUBE';
    } else if (bestMatch.id === "tiktok_tool_guide") {
      activeBotState = 'AWAITING_URL_CONFIRMATION_TIKTOK';
    } else if (bestMatch.id === "facebook_tool_guide") {
      activeBotState = 'AWAITING_URL_CONFIRMATION_FACEBOOK';
    } else if (bestMatch.id === "image_tool_guide") {
      activeBotState = 'AWAITING_IMAGE_UPLOAD_CONFIRMATION';
    }

    if (responses.length === 1) {
      selectedResponse = responses[0];
      // If user repeatedly asks the same single-response prompt back-to-back, attach dynamic polite repetition prefix
      if (selectedResponse === lastServedResponseText) {
        const repetitionPrefixes = [
          "যেমনটা আগেই জানালাম স্যার: ",
          "পুনরায় জানাচ্ছি স্যার: ",
          "আরেকবার স্যারকে বলছি: ",
          "জ্বী স্যার, আবারো বলছি: ",
          "যেমনটি আগের মেসেজে বলেছিলাম স্যার: "
        ];
        const randomPrefix = repetitionPrefixes[Math.floor(Math.random() * repetitionPrefixes.length)];
        selectedResponse = randomPrefix + selectedResponse;
      }
    } else {
      // Pick next variation index via round-robin state tracking to cycle through all available variations
      const lastIndex = lastResponseIndexMap[bestMatch.id] !== undefined ? lastResponseIndexMap[bestMatch.id] : -1;
      let nextIndex = (lastIndex + 1) % responses.length;

      // If candidate response matches the exact text of the immediately preceding response, advance index to prevent consecutive duplicates
      if (responses[nextIndex] === lastServedResponseText && responses.length > 2) {
        nextIndex = (nextIndex + 1) % responses.length;
      }

      lastResponseIndexMap[bestMatch.id] = nextIndex;
      selectedResponse = responses[nextIndex];
    }

    lastServedResponseText = selectedResponse;

    return {
      matched: true,
      response: selectedResponse,
      category: bestMatch.category
    };
  }

  return null;
}

// Check if user is asking for their memory (e.g. "amar youtube link gulo deo", "amar image gulo deo", "amar memory/history")
export function handleMemoryInquiry(userInput: string): { isMemoryQuery: boolean; responseText: string; mediaItems: StoredMediaItem[] } | null {
  const input = userInput.toLowerCase();

  const memoryKeywords = [
    'amar link', 'amar image', 'amar history', 'amar memory', 'amar sob link', 'amar yt link',
    'amar photo', 'আমার লিংক', 'আমার পিকচার', 'আমার লিংকগুলো', 'আমার ইউটিউব লিংক', 'আমার ফটো',
    'my links', 'my images', 'show memory', 'my history', 'youtube link gulo', 'all links', 'all images'
  ];

  const matched = memoryKeywords.some((kw) => input.includes(kw));
  if (!matched) return null;

  const memory = getSmartBotMemory();
  const allHistory = memory.mediaHistory;

  let filteredItems = allHistory;
  let queryType = 'all';

  if (input.includes('youtube') || input.includes('ইউটিউব') || input.includes('yt')) {
    filteredItems = allHistory.filter((m) => m.type === 'youtube');
    queryType = 'youtube';
  } else if (input.includes('facebook') || input.includes('ফেসবুক') || input.includes('fb')) {
    filteredItems = allHistory.filter((m) => m.type === 'facebook');
    queryType = 'facebook';
  } else if (input.includes('tiktok') || input.includes('টিকটক')) {
    filteredItems = allHistory.filter((m) => m.type === 'tiktok');
    queryType = 'tiktok';
  } else if (input.includes('image') || input.includes('photo') || input.includes('ছবি') || input.includes('পিকচার') || input.includes('ফটো')) {
    filteredItems = allHistory.filter((m) => m.type === 'image');
    queryType = 'image';
  }

  if (filteredItems.length === 0) {
    let emptyMsg = 'স্যার, আপনার মেমোরিতে এখনো কোনো লিঙ্ক বা ছবি সেভ করা নেই। আপনি চ্যাটে কোনো ভিডিও লিঙ্ক পেস্ট করলে বা ছবি আপলোড করলে আমি তা আপনার স্মরণে অটোমেটিক সেভ করে রাখবো!';
    if (queryType === 'youtube') emptyMsg = 'স্যার, আপনার চ্যাট মেমোরিতে কোনো ইউটিউব লিঙ্ক পাওয়া যায়নি। কোনো YouTube লিঙ্ক পেস্ট করলে আমি স্মরণে সেভ করে রাখবো!';
    if (queryType === 'image') emptyMsg = 'স্যার, আপনার চ্যাট মেমোরিতে কোনো ছবি পাওয়া যায়নি। কোনো ইমেজ আপলোড করলে আমি তা এখানে ট্র্যাক করে রাখবো!';

    return {
      isMemoryQuery: true,
      responseText: emptyMsg,
      mediaItems: []
    };
  }

  let textHeader = `স্যার, আপনার চ্যাট মেমোরি থেকে মোট **${filteredItems.length}টি** রেকর্ড উদ্ধার করা হয়েছে:`;
  if (queryType === 'youtube') textHeader = `স্যার, আপনার অতীতের সব **YouTube Links (${filteredItems.length}টি)** নিচে দেওয়া হলো:`;
  if (queryType === 'image') textHeader = `স্যার, আপনার আপলোড করা সব **ইমেজ/ছবি (${filteredItems.length}টি)** নিচে দেওয়া হলো:`;

  return {
    isMemoryQuery: true,
    responseText: textHeader,
    mediaItems: filteredItems
  };
}

// Clear memory helper
export function clearSmartBotMemory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(MEMORY_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear memory:', e);
  }
}
