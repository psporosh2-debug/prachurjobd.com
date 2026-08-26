import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, 
  Terminal, 
  Code2, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Zap, 
  Activity, 
  Server, 
  Layers, 
  Play, 
  Globe, 
  Cpu, 
  Sparkles,
  AlertCircle,
  FileCode,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Send
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { sound } from '@/lib/sound';
import { motion, AnimatePresence } from 'motion/react';
import { GeminiQuotaDashboard } from '@/components/GeminiQuotaDashboard';

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  type: 'live' | 'test';
  status: 'active' | 'revoked';
  rateLimitPerMinute: number;
  monthlyQuota: number;
  usedToday: number;
  totalCalls: number;
  createdAt: string;
  lastUsedAt?: string | null;
}

const CODE_LANGUAGES = [
  { id: 'curl', label: 'cURL (Bash)' },
  { id: 'javascript', label: 'JavaScript (Fetch)' },
  { id: 'python', label: 'Python (requests)' },
  { id: 'nodejs', label: 'Node.js (Axios)' },
  { id: 'php', label: 'PHP (cURL)' }
];

const ENDPOINT_DOCS = [
  {
    id: 'tiktok_extract',
    name: 'TikTok Video & Audio Extractor (No Watermark)',
    method: 'POST',
    path: '/api/v1/tiktok/extract',
    description: 'Extract 1080p No-Watermark MP4 video, background sound MP3, cover photo, and play/like stats from any TikTok URL.',
    defaultPayload: JSON.stringify({ url: "https://www.tiktok.com/@tiktok/video/7123456789012345678" }, null, 2),
    sampleResponse: {
      success: true,
      data: {
        id: "7123456789012345678",
        title: "Trending TikTok Dance",
        videoHdUrl: "https://www.tiktok.com/video_hd.mp4",
        videoUrl: "https://www.tiktok.com/video_sd.mp4",
        audioUrl: "https://www.tiktok.com/audio.mp3",
        cover: "https://www.tiktok.com/cover.jpg",
        stats: { playCount: 150000, diggCount: 25000 }
      }
    }
  },
  {
    id: 'facebook_extract',
    name: 'Facebook HD Video & Reels Extractor',
    method: 'POST',
    path: '/api/v1/facebook/extract',
    description: 'Extract HD 1080p MP4 videos, Reels, thumbnail images, and MP3 audio streams from public Facebook links.',
    defaultPayload: JSON.stringify({ url: "https://www.facebook.com/watch/?v=123456789" }, null, 2),
    sampleResponse: {
      success: true,
      data: {
        id: "123456789",
        title: "Viral Facebook Reel",
        videoHdUrl: "https://www.facebook.com/fb_hd.mp4",
        videoSdUrl: "https://www.facebook.com/fb_sd.mp4",
        thumbnail: "https://www.facebook.com/thumb.jpg",
        author: { name: "Creator Page" }
      }
    }
  },
  {
    id: 'youtube_extract',
    name: 'YouTube HD Metadata & Thumbnails Extractor',
    method: 'POST',
    path: '/api/v1/youtube/extract',
    description: 'Extracts 4K, 1080p, 720p thumbnails, title, author, and embed links from any YouTube URL or Video ID.',
    defaultPayload: JSON.stringify({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }, null, 2),
    sampleResponse: {
      success: true,
      data: {
        videoId: "dQw4w9WgXcQ",
        title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
        authorName: "Rick Astley",
        thumbnails: {
          ultraHd4k: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
          maxRes1080p: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
          high720p: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        }
      }
    }
  },
  {
    id: 'sfx_library',
    name: 'Royalty-Free SFX Audio Library',
    method: 'GET',
    path: '/api/v1/sfx?category=impact&limit=10',
    description: 'Fetch direct WAV audio effect URLs, category metadata, and tags across 60+ royalty-free sounds.',
    defaultPayload: '',
    sampleResponse: {
      success: true,
      total: 8,
      data: [
        {
          id: "sfx_01_cinematic_riser",
          name: "Cinematic Riser Hit",
          category: "impact",
          path: "/sounds/SFX50+/01_Cinematic_Riser_Hit.wav",
          tag: "Riser Hit"
        }
      ]
    }
  },
  {
    id: 'text_convert',
    name: 'Text Utilities & Slugify',
    method: 'POST',
    path: '/api/v1/text/convert',
    description: 'Transform text into URL slugs, camelCase, snake_case, titleCase, and get word / reading metrics.',
    defaultPayload: JSON.stringify({ text: "Ultimate 2026 Developer Guide", mode: "slug" }, null, 2),
    sampleResponse: {
      success: true,
      mode: "slug",
      originalText: "Ultimate 2026 Developer Guide",
      convertedText: "ultimate-2026-developer-guide",
      metrics: { wordCount: 4, charCount: 29, readingTimeMinutes: 1 }
    }
  },
  {
    id: 'ai_titles',
    name: 'AI High-CTR Title Generator',
    method: 'POST',
    path: '/api/v1/ai/generate-title',
    description: 'Generate high-ranking viral video/blog titles using server-side Gemini AI engine.',
    defaultPayload: JSON.stringify({ topic: "Full Stack Web Development 2026", tone: "Viral", count: 3 }, null, 2),
    sampleResponse: {
      success: true,
      topic: "Full Stack Web Development 2026",
      tone: "Viral",
      titles: [
        "10 Full Stack Web Dev Secrets Nobody Tells You (2026)",
        "How I Built a Production SaaS in 7 Days",
        "The Complete 2026 Web Roadmap"
      ]
    }
  },
  {
    id: 'health_status',
    name: 'Health & System Status',
    method: 'GET',
    path: '/api/v1/health',
    description: 'Check platform uptime, latency, and operational health of all integrated micro-services.',
    defaultPayload: '',
    sampleResponse: {
      status: "ok",
      version: "v1.0.0",
      uptimeSeconds: 3600,
      services: { aiEngine: "operational", youtubeParser: "operational", sfxLibrary: "operational" }
    }
  }
];

export default function ApiKeysDashboard() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'live' | 'test'>('live');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Docs state
  const [selectedLanguage, setSelectedLanguage] = useState('curl');
  const [selectedDocEndpoint, setSelectedDocEndpoint] = useState(ENDPOINT_DOCS[0].id);

  // AI Prompt Guide state
  const [promptTarget, setPromptTarget] = useState<string>('all');
  const [promptFramework, setPromptFramework] = useState<string>('react');

  // Live Sandbox state
  const [sandboxEndpointId, setSandboxEndpointId] = useState(ENDPOINT_DOCS[0].id);
  const [sandboxPayload, setSandboxPayload] = useState(ENDPOINT_DOCS[0].defaultPayload);
  const [sandboxKey, setSandboxKey] = useState('');
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<number | null>(null);
  const [sandboxLatency, setSandboxLatency] = useState<number | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/keys');
      const data = await res.json();
      if (data.success && Array.isArray(data.keys)) {
        setKeys(data.keys);
        if (data.keys.length > 0 && !sandboxKey) {
          setSandboxKey(data.keys[0].key);
        }
      }
    } catch (err) {
      console.error('Failed to load keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.generate();

    try {
      const res = await fetch('/api/v1/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim() || 'My Developer App',
          type: newKeyType
        })
      });

      const data = await res.json();
      if (data.success && data.apiKey) {
        setKeys(prev => [data.apiKey, ...prev]);
        setSandboxKey(data.apiKey.key);
        setNewKeyName('');
        setShowCreateModal(false);
        sound.success();

        toast({
          title: 'API Key Created 🎉',
          description: `Key "${data.apiKey.name}" is now ready for use.`,
        });
      }
    } catch {
      toast({
        title: 'Creation Failed',
        description: 'Could not create new API key.',
        variant: 'destructive'
      });
    }
  };

  const handleToggleRevoke = async (keyItem: ApiKeyItem) => {
    sound.click();
    try {
      const res = await fetch('/api/v1/keys/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId: keyItem.id })
      });
      const data = await res.json();
      if (data.success) {
        setKeys(prev => prev.map(k => k.id === keyItem.id ? { ...k, status: data.status } : k));
        toast({
          title: `Key ${data.status === 'active' ? 'Activated' : 'Revoked'}`,
          description: `Key status updated to ${data.status}.`
        });
      }
    } catch {
      toast({ title: 'Action Failed', variant: 'destructive' });
    }
  };

  const handleRegenerate = async (keyItem: ApiKeyItem) => {
    if (!window.confirm(`Are you sure you want to regenerate "${keyItem.name}"? The old key will stop working immediately.`)) {
      return;
    }
    sound.click();
    try {
      const res = await fetch('/api/v1/keys/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId: keyItem.id })
      });
      const data = await res.json();
      if (data.success && data.apiKey) {
        setKeys(prev => prev.map(k => k.id === keyItem.id ? { ...k, key: data.apiKey.key, status: 'active' } : k));
        if (sandboxKey === keyItem.key) {
          setSandboxKey(data.apiKey.key);
        }
        sound.success();
        toast({
          title: 'Key Regenerated 🔑',
          description: 'A new secret key has been assigned.'
        });
      }
    } catch {
      toast({ title: 'Regeneration Failed', variant: 'destructive' });
    }
  };

  const handleDeleteKey = async (keyItem: ApiKeyItem) => {
    if (!window.confirm(`Delete API Key "${keyItem.name}" permanently?`)) return;
    sound.click();
    try {
      const res = await fetch(`/api/v1/keys/${keyItem.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setKeys(prev => prev.filter(k => k.id !== keyItem.id));
        toast({ title: 'API Key Deleted' });
      }
    } catch {
      toast({ title: 'Delete Failed', variant: 'destructive' });
    }
  };

  const handleCopyKey = (keyString: string, id: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKeyId(id);
    sound.copy();
    toast({
      title: 'API Key Copied to Clipboard 📋',
      description: 'Keep your secret key safe and never commit it to public repositories.',
    });
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleVisibility = (id: string) => {
    sound.click();
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Active Key for Code Snippets
  const activeKeyString = useMemo(() => {
    const active = keys.find(k => k.status === 'active');
    return active ? active.key : (keys[0]?.key || 'nx_live_your_api_key_here');
  }, [keys]);

  // Selected Doc Spec
  const currentDocEndpoint = useMemo(() => {
    return ENDPOINT_DOCS.find(e => e.id === selectedDocEndpoint) || ENDPOINT_DOCS[0];
  }, [selectedDocEndpoint]);

  // Generate dynamic code snippet based on active language and endpoint
  const generatedCodeSnippet = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    const ep = currentDocEndpoint;
    const isPost = ep.method === 'POST';
    const key = activeKeyString;

    switch (selectedLanguage) {
      case 'curl':
        if (isPost) {
          return `curl -X POST "${origin}${ep.path}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${key}" \\
  -d '${ep.defaultPayload.replace(/\n\s*/g, ' ')}'`;
        }
        return `curl -X GET "${origin}${ep.path}" \\
  -H "x-api-key: ${key}"`;

      case 'javascript':
        if (isPost) {
          return `// JavaScript (Fetch API)
const response = await fetch('${origin}${ep.path}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${key}'
  },
  body: JSON.stringify(${ep.defaultPayload})
});

const result = await response.json();
console.log(result);`;
        }
        return `// JavaScript (Fetch API)
const response = await fetch('${origin}${ep.path}', {
  method: 'GET',
  headers: {
    'x-api-key': '${key}'
  }
});

const result = await response.json();
console.log(result);`;

      case 'python':
        if (isPost) {
          return `# Python 3 (requests)
import requests

url = "${origin}${ep.path}"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "${key}"
}
payload = ${ep.defaultPayload}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
        }
        return `# Python 3 (requests)
import requests

url = "${origin}${ep.path}"
headers = {
    "x-api-key": "${key}"
}

response = requests.get(url, headers=headers)
print(response.json())`;

      case 'nodejs':
        if (isPost) {
          return `// Node.js (Axios)
const axios = require('axios');

async function callApi() {
  try {
    const res = await axios.post('${origin}${ep.path}', ${ep.defaultPayload}, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '${key}'
      }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

callApi();`;
        }
        return `// Node.js (Axios)
const axios = require('axios');

async function callApi() {
  try {
    const res = await axios.get('${origin}${ep.path}', {
      headers: {
        'x-api-key': '${key}'
      }
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

callApi();`;

      case 'php':
        if (isPost) {
          return `<?php
// PHP cURL
$ch = curl_init('${origin}${ep.path}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, '${ep.defaultPayload.replace(/\n\s*/g, ' ')}');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: ${key}'
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);
?>`;
        }
        return `<?php
// PHP cURL
$ch = curl_init('${origin}${ep.path}');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: ${key}'
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);
?>`;

      default:
        return '';
    }
  }, [selectedLanguage, currentDocEndpoint, activeKeyString]);

  // Generate Master AI Integration Prompt for ChatGPT / Claude / Cursor
  const generatedAiPrompt = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    const key = activeKeyString;

    let endpointInfo = '';
    if (promptTarget === 'all') {
      endpointInfo = ENDPOINT_DOCS.map(ep => `
• [${ep.method}] ${ep.path}
  Name: ${ep.name}
  Description: ${ep.description}
  Sample Payload: ${ep.defaultPayload ? ep.defaultPayload.replace(/\n/g, ' ') : 'None (GET)'}
`).join('\n');
    } else {
      const ep = ENDPOINT_DOCS.find(e => e.id === promptTarget) || ENDPOINT_DOCS[0];
      endpointInfo = `
• [${ep.method}] ${ep.path}
  Name: ${ep.name}
  Description: ${ep.description}
  Sample Payload: ${ep.defaultPayload ? ep.defaultPayload.replace(/\n/g, ' ') : 'None (GET)'}
`;
    }

    return `You are an expert full-stack developer assistant. I am connecting my application to the Prachurjo Developer REST API v1.

Here is the complete API Specification & Authorization details:

- Base URL: ${origin}
- Authentication Header: x-api-key: ${key}
- Alternative Auth: Authorization: Bearer ${key}
- Rate Limit: 60 requests per minute
- Target Framework/Language: ${promptFramework.toUpperCase()}

Target Endpoint Specification:
${endpointInfo}

INSTRUCTIONS FOR AI ASSISTANT:
Please generate clean, production-ready, robust code for my ${promptFramework.toUpperCase()} project that connects to the endpoint(s) above.

Include:
1. Complete TypeScript interfaces / type definitions (or class data structures) for request payload and response JSON.
2. An async API client module or custom hook with retry logic for HTTP 429 (Rate Limit Exceeded) and 401 (Invalid Key).
3. Clear error handling and logging.
4. A short working usage example showing how to invoke the API function and handle the returned data.`;
  }, [promptTarget, promptFramework, activeKeyString]);

  // Execute Live API Sandbox Request
  const handleRunSandbox = async () => {
    const ep = ENDPOINT_DOCS.find(e => e.id === sandboxEndpointId) || ENDPOINT_DOCS[0];
    setSandboxLoading(true);
    setSandboxResponse(null);
    setSandboxStatus(null);
    sound.generate();

    const startTime = performance.now();

    try {
      const isPost = ep.method === 'POST';
      let options: RequestInit = {
        method: ep.method,
        headers: {
          'x-api-key': sandboxKey || activeKeyString,
        }
      };

      if (isPost) {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json',
        };
        try {
          options.body = sandboxPayload ? JSON.stringify(JSON.parse(sandboxPayload)) : undefined;
        } catch {
          options.body = sandboxPayload;
        }
      }

      const res = await fetch(ep.path, options);
      const endTime = performance.now();
      setSandboxLatency(Math.round(endTime - startTime));
      setSandboxStatus(res.status);

      const json = await res.json();
      setSandboxResponse(JSON.stringify(json, null, 2));
      sound.success();

      // Refresh key stats in background
      fetchKeys();
    } catch (err: any) {
      const endTime = performance.now();
      setSandboxLatency(Math.round(endTime - startTime));
      setSandboxStatus(500);
      setSandboxResponse(JSON.stringify({ error: 'Request Failed', message: err?.message || String(err) }, null, 2));
      sound.error();
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-blue-500/20 to-purple-500/20 text-primary border border-primary/20 shadow-xs">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Developer API & Keys Hub
              </h1>
              <Badge className="bg-primary/15 text-primary border-none text-[10px] font-bold">
                Public REST v1
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Build your own apps, bots, or scripts using Prachurjo Prompts, YouTube HD Extractor, SFX Audio & AI APIs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              sound.click();
              setShowCreateModal(true);
            }}
            className="h-9 text-xs font-bold gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New Key</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 rounded-xl border bg-card/60 backdrop-blur-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground">Active Keys</div>
            <div className="text-lg font-bold text-foreground">
              {keys.filter(k => k.status === 'active').length}
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border bg-card/60 backdrop-blur-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground">Rate Limit</div>
            <div className="text-lg font-bold text-foreground">60 / min</div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border bg-card/60 backdrop-blur-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground">Monthly Quota</div>
            <div className="text-lg font-bold text-foreground">10,000 reqs</div>
          </div>
        </Card>

        <Card className="p-4 rounded-xl border bg-card/60 backdrop-blur-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground">Total Calls</div>
            <div className="text-lg font-bold text-foreground">
              {keys.reduce((acc, k) => acc + (k.totalCalls || 0), 0)}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/60 rounded-xl border border-border gap-1">
          <TabsTrigger 
            value="keys" 
            onClick={() => sound.tab()}
            className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-card data-[state=active]:shadow-xs"
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys & Tester</span>
          </TabsTrigger>
          <TabsTrigger 
            value="quickstart" 
            onClick={() => sound.tab()}
            className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-card data-[state=active]:shadow-xs"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Examples</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ai_prompt_guide" 
            onClick={() => sound.tab()}
            className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-card data-[state=active]:shadow-xs text-primary"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Integration Prompt</span>
          </TabsTrigger>
          <TabsTrigger 
            value="endpoints" 
            onClick={() => sound.tab()}
            className="text-xs font-bold gap-1.5 py-2 data-[state=active]:bg-card data-[state=active]:shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>API Reference (v1)</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: API Keys & Live Tester */}
        <TabsContent value="keys" className="space-y-6 mt-0">
          {/* Key Creation Form Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 rounded-2xl border bg-card shadow-md space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Create Secret API Key</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                    className="h-7 w-7 p-0 text-muted-foreground"
                  >
                    ✕
                  </Button>
                </div>

                <form onSubmit={handleCreateKey} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Key Name / Application Label</label>
                      <Input
                        type="text"
                        placeholder="e.g. My Discord Bot, React Web App, Python Scraper..."
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="text-xs rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Key Environment</label>
                      <select
                        value={newKeyType}
                        onChange={(e) => setNewKeyType(e.target.value as 'live' | 'test')}
                        className="w-full h-9 text-xs rounded-xl bg-muted/40 border border-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="live">Live (Production: nx_live_)</option>
                        <option value="test">Test (Sandbox: nx_test_)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateModal(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="text-xs font-bold"
                    >
                      Generate Key
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Keys Table / Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                <span>Your API Keys ({keys.length})</span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                All keys authenticate with <code className="font-mono bg-muted px-1.5 py-0.5 rounded">x-api-key</code>
              </span>
            </div>

            <div className="space-y-2.5">
              {keys.map((item) => {
                const isVisible = visibleKeys[item.id];
                const isCopied = copiedKeyId === item.id;
                const isRevoked = item.status === 'revoked';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isRevoked
                        ? 'bg-muted/30 border-dashed border-border opacity-70'
                        : 'bg-card border-border hover:border-primary/40 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Name & Status */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground">
                            {item.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 font-bold ${
                              item.type === 'live'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            }`}
                          >
                            {item.type.toUpperCase()}
                          </Badge>
                          <Badge
                            className={`text-[9px] px-1.5 py-0 font-bold ${
                              item.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-destructive/15 text-destructive'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Secret Key Display */}
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted/60 px-2.5 py-1 rounded-lg text-foreground border border-border/60 select-all">
                            {isVisible ? item.key : `${item.key.slice(0, 10)}••••••••••••••••••••••••••••`}
                          </code>
                          <button
                            type="button"
                            onClick={() => toggleVisibility(item.id)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            title={isVisible ? "Hide Key" : "Show Key"}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyKey(item.key, item.id)}
                          className="h-8 text-xs gap-1.5"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy Key'}</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRevoke(item)}
                          className={`h-8 text-xs ${
                            isRevoked ? 'text-emerald-600 hover:text-emerald-700' : 'text-amber-600 hover:text-amber-700'
                          }`}
                          title={isRevoked ? 'Activate Key' : 'Revoke Key'}
                        >
                          {isRevoked ? 'Activate' : 'Revoke'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerate(item)}
                          className="h-8 text-xs p-2 text-muted-foreground hover:text-foreground"
                          title="Regenerate Key"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteKey(item)}
                          className="h-8 text-xs p-2 text-destructive hover:bg-destructive/10 border-destructive/30"
                          title="Delete Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Stats Footer */}
                    <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
                      <div className="flex items-center gap-3">
                        <span>Calls: <b className="text-foreground">{item.totalCalls || 0}</b></span>
                        <span>Today: <b className="text-foreground">{item.usedToday || 0}</b></span>
                        <span>Rate: <b className="text-foreground">{item.rateLimitPerMinute}/min</b></span>
                      </div>
                      <div className="font-mono text-[10px]">
                        Created: {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}

              {keys.length === 0 && !loading && (
                <div className="p-8 text-center border border-dashed rounded-2xl bg-card space-y-3">
                  <Key className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-sm font-bold text-foreground">No API Keys Generated Yet</p>
                  <p className="text-xs text-muted-foreground">Generate your first secret key to start making requests.</p>
                  <Button size="sm" onClick={() => setShowCreateModal(true)} className="text-xs">
                    Create API Key
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Live Sandbox / Tester */}
          <div className="p-5 rounded-2xl bg-card border space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-foreground">Interactive API Sandbox & Tester</h3>
              </div>
              {sandboxStatus && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge className={`${sandboxStatus === 200 ? 'bg-emerald-500/15 text-emerald-600' : 'bg-destructive/15 text-destructive'}`}>
                    HTTP {sandboxStatus}
                  </Badge>
                  {sandboxLatency && (
                    <span className="text-[11px] font-mono text-muted-foreground">{sandboxLatency}ms</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Select Endpoint</label>
                <select
                  value={sandboxEndpointId}
                  onChange={(e) => {
                    sound.click();
                    const newEp = ENDPOINT_DOCS.find(doc => doc.id === e.target.value);
                    setSandboxEndpointId(e.target.value);
                    if (newEp) setSandboxPayload(newEp.defaultPayload);
                  }}
                  className="w-full h-9 text-xs rounded-xl bg-muted/40 border border-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                >
                  {ENDPOINT_DOCS.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.method} {doc.path.split('?')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Using API Key</label>
                <select
                  value={sandboxKey}
                  onChange={(e) => setSandboxKey(e.target.value)}
                  className="w-full h-9 text-xs rounded-xl bg-muted/40 border border-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                >
                  {keys.map(k => (
                    <option key={k.id} value={k.key}>
                      {k.name} ({k.key.slice(0, 12)}...) - {k.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Request Body Payload (if POST) */}
            {ENDPOINT_DOCS.find(e => e.id === sandboxEndpointId)?.method === 'POST' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Request JSON Body</label>
                <textarea
                  value={sandboxPayload}
                  onChange={(e) => setSandboxPayload(e.target.value)}
                  rows={3}
                  className="w-full p-3 font-mono text-xs rounded-xl bg-muted/30 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder='{"url": "https://www.youtube.com/watch?v=..."}'
                />
              </div>
            )}

            <Button
              onClick={handleRunSandbox}
              disabled={sandboxLoading || !sandboxKey}
              className="w-full h-9 text-xs font-bold gap-2"
            >
              {sandboxLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{sandboxLoading ? 'Executing Request...' : 'Send Live Test Request'}</span>
            </Button>

            {/* Response Box */}
            {sandboxResponse && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold">Response JSON Payload</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sandboxResponse);
                      sound.copy();
                      toast({ title: 'Response Copied' });
                    }}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy Output
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800 custom-scrollbar">
                  {sandboxResponse}
                </pre>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: Code Examples & SDKs */}
        <TabsContent value="quickstart" className="space-y-6 mt-0">
          <div className="p-5 rounded-2xl bg-card border space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Multi-Language Code Integration</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pre-configured code samples with your active API key ready for production.
                </p>
              </div>

              {/* Endpoint Picker */}
              <select
                value={selectedDocEndpoint}
                onChange={(e) => {
                  sound.click();
                  setSelectedDocEndpoint(e.target.value);
                }}
                className="h-9 text-xs rounded-xl bg-muted/40 border border-border px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              >
                {ENDPOINT_DOCS.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.method})
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {CODE_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    sound.tab();
                    setSelectedLanguage(lang.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedLanguage === lang.id
                      ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Code Display Card */}
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-mono">{currentDocEndpoint.method} {currentDocEndpoint.path.split('?')[0]}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCodeSnippet);
                    sound.copy();
                    toast({
                      title: 'Code Copied! 📋',
                      description: `Copied ${selectedLanguage.toUpperCase()} integration snippet.`,
                    });
                  }}
                  className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800 gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </Button>
              </div>

              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-96 leading-relaxed custom-scrollbar">
                {generatedCodeSnippet}
              </pre>
            </div>

            {/* Sample Expected Output */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Expected JSON Response Schema (200 OK)</span>
              <pre className="p-3.5 rounded-xl bg-muted/40 border border-border text-foreground font-mono text-xs overflow-x-auto max-h-48 custom-scrollbar">
                {JSON.stringify(currentDocEndpoint.sampleResponse, null, 2)}
              </pre>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: AI Integration Prompt & Guide */}
        <TabsContent value="ai_prompt_guide" className="space-y-6 mt-0">
          <Card className="p-5 rounded-2xl border bg-card space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-500 border border-purple-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">AI Copilot Prompt Generator</h3>
                  <p className="text-xs text-muted-foreground">
                    Copy this pre-configured prompt into ChatGPT, Claude, Gemini, Cursor, or Copilot to automatically generate your integration code!
                  </p>
                </div>
              </div>

              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generatedAiPrompt);
                  sound.copy();
                  toast({
                    title: 'AI Prompt Copied! 📋',
                    description: 'Paste this prompt directly into ChatGPT / Cursor / Claude to generate your code.',
                  });
                }}
                className="h-9 text-xs font-bold gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm"
              >
                <Copy className="w-4 h-4" />
                <span>Copy AI Prompt</span>
              </Button>
            </div>

            {/* Prompt Customizer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Target Framework / Language</label>
                <select
                  value={promptFramework}
                  onChange={(e) => {
                    sound.click();
                    setPromptFramework(e.target.value);
                  }}
                  className="w-full h-9 text-xs rounded-xl bg-muted/40 border border-border px-3 text-foreground font-semibold"
                >
                  <option value="react">React / Next.js (TypeScript)</option>
                  <option value="node">Node.js / Express (Backend)</option>
                  <option value="python">Python (Requests / FastAPI / Django)</option>
                  <option value="php">PHP (cURL / Laravel)</option>
                  <option value="flutter">Flutter / Dart (Mobile)</option>
                  <option value="curl">cURL / Shell Script</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Target API Endpoint</label>
                <select
                  value={promptTarget}
                  onChange={(e) => {
                    sound.click();
                    setPromptTarget(e.target.value);
                  }}
                  className="w-full h-9 text-xs rounded-xl bg-muted/40 border border-border px-3 text-foreground font-semibold"
                >
                  <option value="all">🌟 All Endpoints (Complete API SDK)</option>
                  {ENDPOINT_DOCS.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.method})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prompt Display Box */}
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
                <span className="font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-purple-400" />
                  Ready-to-Paste Prompt for ChatGPT / Cursor / Claude
                </span>
                <span className="text-[10px] text-purple-300 font-mono">Auto-Filled with API Key</span>
              </div>

              <pre className="p-4 text-xs font-mono text-purple-300 overflow-x-auto max-h-80 leading-relaxed custom-scrollbar whitespace-pre-wrap">
                {generatedAiPrompt}
              </pre>
            </div>

            {/* How to use steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center leading-5 text-[11px] font-mono">1</span>
                  <span>Copy Prompt</span>
                </div>
                <p className="text-muted-foreground text-[11px]">Click the purple "Copy AI Prompt" button above.</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center leading-5 text-[11px] font-mono">2</span>
                  <span>Paste to any AI</span>
                </div>
                <p className="text-muted-foreground text-[11px]">Open ChatGPT, Claude, Gemini, or Cursor IDE and paste it.</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-center leading-5 text-[11px] font-mono">3</span>
                  <span>Get Ready Code</span>
                </div>
                <p className="text-muted-foreground text-[11px]">The AI will write error-handled code matching your exact stack!</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: API Reference (v1) */}
        <TabsContent value="endpoints" className="space-y-4 mt-0">
          <div className="p-4 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Globe className="w-4 h-4 text-primary" />
              <span>Base URL & Authentication Standard</span>
            </div>
            <p className="text-muted-foreground">
              All requests must be made over HTTPS. Authenticate requests by attaching your secret key to the <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">x-api-key</code> HTTP header or as <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">Authorization: Bearer nx_live_...</code>.
            </p>
          </div>

          <div className="space-y-3">
            {ENDPOINT_DOCS.map((ep) => (
              <Card key={ep.id} className="p-4.5 rounded-xl border bg-card space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`font-mono text-[11px] font-bold ${
                      ep.method === 'POST' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {ep.method}
                    </Badge>
                    <code className="text-xs sm:text-sm font-mono font-bold text-foreground">
                      {ep.path}
                    </code>
                  </div>
                  <Badge variant="outline" className="text-[10px] w-fit">
                    Rate: 60 req/min
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  {ep.description}
                </p>

                {ep.defaultPayload && (
                  <div className="pt-2 border-t border-border/40">
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Request Payload:</span>
                    <pre className="p-2 rounded-lg bg-muted/40 font-mono text-[11px] text-foreground">
                      {ep.defaultPayload}
                    </pre>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Error Codes Matrix */}
          <div className="p-5 rounded-2xl bg-card border space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Standard HTTP Error Status Codes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <b className="text-emerald-500 font-mono">200 OK / 201 Created:</b> Request executed successfully.
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <b className="text-amber-500 font-mono">400 Bad Request:</b> Missing or invalid parameters.
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <b className="text-rose-500 font-mono">401 Unauthorized:</b> Missing or invalid <code className="font-mono">x-api-key</code>.
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                <b className="text-purple-500 font-mono">429 Too Many Requests:</b> Rate limit exceeded (60 req/min).
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
