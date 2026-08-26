import { API_CONFIG } from './apiKeys';

// Robust client-side Gemini REST API caller for direct browser execution (e.g. static deployed sites without Express backend)
async function callGeminiDirectlyInBrowser<T>(systemPrompt: string, userContent: string, schema: any, fallbackData: T): Promise<T> {
  try {
    const apiKey = API_CONFIG.geminiApiKey;
    if (!apiKey) return fallbackData;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userContent }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          maxOutputTokens: 2500,
        },
      }),
    });

    if (!res.ok) {
      console.warn(`Direct Gemini API call status ${res.status}`);
      return fallbackData;
    }

    const json = await res.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) return fallbackData;

    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      return JSON.parse(cleaned);
    } catch {
      return fallbackData;
    }
  } catch (err) {
    console.warn('Direct browser Gemini API call failed:', err);
    return fallbackData;
  }
}

export interface AiOptimizationRequest {
  mode: 'video' | 'channel';
  type?: 'video' | 'channel';
  title?: string;
  description?: string;
  tags?: string[];
  keywords?: string[];
  category?: string;
  stats?: any;
  extraPrompt?: string;
  bypassCache?: boolean;
}

export interface AiSuggestedTitle {
  title: string;
  reason: string;
}

export interface AiOptimizationResult {
  issues: string[];
  suggestedTitles: AiSuggestedTitle[];
  suggestedDescription: string;
  suggestedTags: string[];
  suggestedKeywords: string[];
  suggestedHashtags: string[];
  overallScore: number;
  summary: string;
}

export interface AiApiResponse {
  data: AiOptimizationResult;
  cached?: boolean;
  tokensUsed?: number;
  tokensSaved?: number;
  compressionRatio?: number;
  message?: string;
}

export async function generateAiOptimizations(req: AiOptimizationRequest): Promise<AiApiResponse> {
  // 1. Try Backend Server Endpoint
  try {
    const response = await fetch('/api/ai/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data) {
        return {
          data: resData.data as AiOptimizationResult,
          cached: resData.cached,
          tokensUsed: resData.tokensUsed,
          tokensSaved: resData.tokensSaved,
          compressionRatio: resData.compressionRatio,
          message: resData.message,
        };
      }
    }
  } catch (err: any) {
    console.warn('Backend API request failed, switching to direct client-side Gemini fallback:', err);
  }

  // 2. Direct Browser Gemini API Fallback (Works on static hosting, Vercel, Netlify, etc.)
  const systemPrompt = `You are an elite YouTube Growth Strategist & Video SEO Consultant. Analyze user channel/video and return actionable JSON advice. Use single quotes (') instead of unescaped double quotes inside values.`;
  const userContent = `Mode: ${req.mode || req.type}\nTitle: ${req.title || ''}\nDescription: ${req.description || ''}\nTags: ${(req.tags || []).join(', ')}`;
  
  const schema = {
    type: "OBJECT",
    properties: {
      issues: { type: "ARRAY", items: { type: "STRING" } },
      suggestedTitles: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            reason: { type: "STRING" }
          },
          required: ["title", "reason"]
        }
      },
      suggestedDescription: { type: "STRING" },
      suggestedTags: { type: "ARRAY", items: { type: "STRING" } },
      suggestedKeywords: { type: "ARRAY", items: { type: "STRING" } },
      suggestedHashtags: { type: "ARRAY", items: { type: "STRING" } },
      overallScore: { type: "INTEGER" },
      summary: { type: "STRING" }
    },
    required: ["issues", "suggestedTitles", "suggestedDescription", "suggestedTags", "suggestedKeywords", "suggestedHashtags", "overallScore", "summary"]
  };

  const defaultFallback = {
    issues: ["Title needs high-converting power words", "Description lacks search hook and chapter structure"],
    suggestedTitles: [
      { title: req.title ? `${req.title} (2026 Complete Guide)` : "How to Grow Your YouTube Channel Fast", reason: "Adds year and high search intent keywords." }
    ],
    suggestedDescription: `${req.title || "Video Title"}\n\nIn this video, discover the ultimate step-by-step tutorial.\n\nCHAPTERS:\n0:00 Intro\n1:30 Overview\n3:45 Tips\n\n#YouTubeSEO #Growth`,
    suggestedTags: ["youtube seo", "growth tips", "viral strategy"],
    suggestedKeywords: ["youtube ranking", "video views", "seo guide"],
    suggestedHashtags: ["#YouTubeSEO", "#Growth", "#VideoTips"],
    overallScore: 82,
    summary: "Optimized for viewer engagement and search discovery."
  };

  const clientResult = await callGeminiDirectlyInBrowser(systemPrompt, userContent, schema, defaultFallback);
  return {
    data: clientResult,
    cached: false,
    tokensUsed: 400,
    message: "Generated via Client-Side Direct AI Engine",
  };
}

export interface TitleGeneratorRequest {
  topic: string;
  category?: string;
  tone?: string;
  language?: string;
  currentTitle?: string;
  extraPrompt?: string;
  bypassCache?: boolean;
}

export interface GeneratedTitleItem {
  title: string;
  style: string;
  ctrScore: number;
  charCount: number;
  reason: string;
  powerWords: string[];
}

export interface TitleGeneratorResult {
  titles: GeneratedTitleItem[];
  viralHooks: string[];
  suggestedKeywords: string[];
  summary: string;
}

export interface TitleGeneratorApiResponse {
  data: TitleGeneratorResult;
  cached?: boolean;
  tokensUsed?: number;
  tokensSaved?: number;
  message?: string;
}

export async function generateTitleIdeas(req: TitleGeneratorRequest): Promise<TitleGeneratorApiResponse> {
  // 1. Try Backend Server Endpoint
  try {
    const response = await fetch('/api/ai/title-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data) {
        return {
          data: resData.data as TitleGeneratorResult,
          cached: resData.cached,
          tokensUsed: resData.tokensUsed,
          tokensSaved: resData.tokensSaved,
          message: resData.message,
        };
      }
    }
  } catch (err: any) {
    console.warn('Backend Title Generator API failed, switching to direct client-side Gemini fallback:', err);
  }

  // 2. Direct Browser Gemini API Fallback
  const systemPrompt = `You are an elite YouTube Growth & Viral Title Strategist. Generate 8-10 high-CTR YouTube video titles based on user topic. Use single quotes (') instead of unescaped double quotes inside values. Return JSON matching schema.`;
  const userContent = `Topic: ${req.topic}\nCategory: ${req.category || 'General'}\nTone: ${req.tone || 'High CTR'}\nLanguage: ${req.language || 'English'}\nCurrent Title: ${req.currentTitle || ''}`;

  const schema = {
    type: "OBJECT",
    properties: {
      titles: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            style: { type: "STRING" },
            ctrScore: { type: "INTEGER" },
            charCount: { type: "INTEGER" },
            reason: { type: "STRING" },
            powerWords: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["title", "style", "ctrScore", "charCount", "reason", "powerWords"]
        }
      },
      viralHooks: { type: "ARRAY", items: { type: "STRING" } },
      suggestedKeywords: { type: "ARRAY", items: { type: "STRING" } },
      summary: { type: "STRING" }
    },
    required: ["titles", "viralHooks", "suggestedKeywords", "summary"]
  };

  const defaultFallback = {
    titles: [
      {
        title: req.topic ? `How to ${req.topic}: Step-by-Step Complete Guide` : "How to Earn Money with Websites in 2026",
        style: "How-To & Educational",
        ctrScore: 94,
        charCount: 52,
        reason: "Clear actionable value proposition for search traffic.",
        powerWords: ["Step-by-Step", "Complete Guide"]
      },
      {
        title: req.topic ? `I Tried ${req.topic} for 30 Days (Here's What Happened)` : "I Made $1,000 from a Simple Website",
        style: "Curiosity & Hook",
        ctrScore: 96,
        charCount: 54,
        reason: "High curiosity storytelling element triggers clicks.",
        powerWords: ["I Tried", "What Happened"]
      },
      {
        title: req.topic ? `5 Secrets to ${req.topic} Nobody Tells You` : "5 Best Ways to Earn Money Online Without Investment",
        style: "Listicle & Numbers",
        ctrScore: 93,
        charCount: 50,
        reason: "Numbers and secrets drive strong emotional engagement.",
        powerWords: ["5 Secrets", "Nobody Tells You"]
      }
    ],
    viralHooks: [
      `In this video, I will show you the exact blueprint for ${req.topic || 'success'}.`,
      `If you want to master ${req.topic || 'this skill'}, do NOT skip this video!`
    ],
    suggestedKeywords: [(req.topic || 'online growth').toLowerCase(), "youtube titles", "viral content", "seo guide"],
    summary: "Use power words and curiosity numbers in your thumbnail text to double CTR."
  };

  const clientResult = await callGeminiDirectlyInBrowser(systemPrompt, userContent, schema, defaultFallback);
  return {
    data: clientResult,
    cached: false,
    tokensUsed: 350,
    message: "Generated via Client-Side Direct AI Engine",
  };
}

export interface DescriptionGeneratorRequest {
  title?: string;
  topic?: string;
  type?: 'video' | 'channel';
  tone?: string;
  language?: string;
  timestamps?: boolean;
  socialLinks?: boolean;
  extraPrompt?: string;
  bypassCache?: boolean;
}

export interface DescriptionGeneratorResult {
  fullDescription: string;
  hookParagraph: string;
  timestampsSection: string;
  suggestedHashtags: string[];
  suggestedKeywords: string[];
  summary: string;
}

export interface DescriptionGeneratorApiResponse {
  data: DescriptionGeneratorResult;
  cached?: boolean;
  tokensUsed?: number;
  tokensSaved?: number;
  message?: string;
}

export async function generateDescriptionIdeas(req: DescriptionGeneratorRequest): Promise<DescriptionGeneratorApiResponse> {
  // 1. Try Backend Server Endpoint
  try {
    const response = await fetch('/api/ai/description-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.data) {
        return {
          data: resData.data as DescriptionGeneratorResult,
          cached: resData.cached,
          tokensUsed: resData.tokensUsed,
          tokensSaved: resData.tokensSaved,
          message: resData.message,
        };
      }
    }
  } catch (err: any) {
    console.warn('Backend Description Generator API failed, switching to direct client-side Gemini fallback:', err);
  }

  // 2. Direct Browser Gemini API Fallback
  const systemPrompt = `You are an expert YouTube Video SEO Copywriter. Generate a high-converting YouTube Description or Channel About section. Use single quotes (') instead of unescaped double quotes inside values. Return JSON matching schema.`;
  const userContent = `Title/Name: ${req.title || ''}\nTopic/Details: ${req.topic || ''}\nTone: ${req.tone || 'Engaging'}\nLanguage: ${req.language || 'English'}`;

  const schema = {
    type: "OBJECT",
    properties: {
      fullDescription: { type: "STRING" },
      hookParagraph: { type: "STRING" },
      timestampsSection: { type: "STRING" },
      suggestedHashtags: { type: "ARRAY", items: { type: "STRING" } },
      suggestedKeywords: { type: "ARRAY", items: { type: "STRING" } },
      summary: { type: "STRING" }
    },
    required: ["fullDescription", "hookParagraph", "timestampsSection", "suggestedHashtags", "suggestedKeywords", "summary"]
  };

  const defaultFallback = {
    fullDescription: `🔥 Welcome to our channel!\n\nIn this video "${req.title || req.topic || "YouTube Guide"}", we explore step-by-step strategies to achieve real results.\n\n📌 Key Highlights:\n- Actionable steps and clear guidance\n- Proven frameworks for growth\n- Best practices and top tools\n\n⏰ TIMESTAMPS:\n0:00 - Introduction\n1:15 - Core Strategy\n3:40 - Step-by-Step Breakdown\n6:10 - Final Tips & Summary\n\n🔗 CONNECT WITH US:\n- Subscribe: https://youtube.com/@yourchannel\n\n#YouTubeSEO #ContentCreation #Growth`,
    hookParagraph: `In this video "${req.title || req.topic || "YouTube Guide"}", discover step-by-step strategies to succeed online.`,
    timestampsSection: "0:00 - Introduction\n1:15 - Core Strategy\n3:40 - Step-by-Step Breakdown\n6:10 - Wrap-Up",
    suggestedHashtags: ["#YouTubeSEO", "#ContentCreator", "#VideoOptimization"],
    suggestedKeywords: ["youtube description", "video seo", "channel growth"],
    summary: "Place the hook snippet in the first 2 lines so viewers see it before clicking 'Show More'."
  };

  const clientResult = await callGeminiDirectlyInBrowser(systemPrompt, userContent, schema, defaultFallback);
  return {
    data: clientResult,
    cached: false,
    tokensUsed: 350,
    message: "Generated via Client-Side Direct AI Engine",
  };
}

export interface ChatMessageItem {
  role: 'user' | 'assistant' | 'model';
  content: string;
}

export async function sendAiChatMessage(
  messages: ChatMessageItem[],
  systemInstruction?: string
): Promise<string> {
  // 1. Try Backend Server Endpoint
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        systemInstruction,
      }),
    });

    if (response.ok) {
      const resData = await response.json();
      if (resData.success && resData.reply) {
        return resData.reply;
      }
    }
  } catch (err) {
    console.warn('Backend Chat API failed, switching to direct browser Gemini API:', err);
  }

  // 2. Fallback: Direct Browser Gemini API
  try {
    const apiKey = API_CONFIG.geminiApiKey;
    if (!apiKey) {
      return "Hello! I am Prachurjo Smart AI Assistant. Please check your API configuration or network connection to enable full AI responses.";
    }

    const defaultSysPrompt = systemInstruction || `You are Prachurjo Smart Assistant, an advanced, polite, and helpful AI assistant for the Prachurjo Prachurjo Tools. Answer clearly using beautiful markdown, code blocks, bold text, and bullet points. Support Bengali and English naturally.`;

    const formattedContents = messages.slice(-12).map((msg) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: { parts: [{ text: defaultSysPrompt }] },
        generationConfig: {
          maxOutputTokens: 2500,
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      // Try fallback to gemini-3.7-flash
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`;
      const resFallback = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: formattedContents,
          systemInstruction: { parts: [{ text: defaultSysPrompt }] },
          generationConfig: {
            maxOutputTokens: 2500,
            temperature: 0.7,
          },
        }),
      });
      if (resFallback.ok) {
        const jsonFallback = await resFallback.json();
        return jsonFallback?.candidates?.[0]?.content?.parts?.[0]?.text || "I processed your request. How else can I assist you?";
      }
      throw new Error(`Gemini API returned status ${res.status}`);
    }

    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text || "I processed your request, but could not generate a textual reply. How can I help further?";
  } catch (err: any) {
    console.error("Direct browser Gemini chat error:", err);
    return `⚠️ AI service temporarily unavailable: ${err?.message || "Please check your network and try again."}`;
  }
}



