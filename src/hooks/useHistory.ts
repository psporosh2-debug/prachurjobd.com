import { useState, useEffect } from 'react';

export type HistoryItemType = 
  | 'thumbnail' 
  | 'title_gen' 
  | 'desc_gen' 
  | 'channel_analysis' 
  | 'video_analysis' 
  | 'image_conv'
  | 'image_compress'
  | 'image_crop'
  | 'text_tool' 
  | 'favicon'
  | 'tiktok_download'
  | 'fb_download';

export interface HistoryItem {
  id: string;
  type: HistoryItemType;
  title: string;
  description: string;
  timestamp: number;
  url?: string;
  metadata?: Record<string, any>;
}

const HISTORY_KEY = 'prachurjo_user_history';
const MAX_HISTORY_ITEMS = 100;

const TYPE_TO_TOOL_ID: Record<HistoryItemType, string> = {
  thumbnail: 'thumbnail-downloader',
  title_gen: 'title-generator',
  desc_gen: 'description-generator',
  channel_analysis: 'channel-analyzer',
  video_analysis: 'video-analyzer',
  image_conv: 'image-converter',
  image_compress: 'image-compressor',
  image_crop: 'image-cropper',
  text_tool: 'text-tools',
  favicon: 'favicon-generator',
  tiktok_download: 'tiktok-downloader',
  fb_download: 'facebook-downloader'
};

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const addHistoryItem = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    // Record into recent tools
    try {
      const toolId = TYPE_TO_TOOL_ID[item.type];
      if (toolId) {
        const raw = localStorage.getItem('prachurjo_recent_tools');
        const list = raw ? JSON.parse(raw) : [];
        const existingIdx = list.findIndex((e: { toolId: string }) => e.toolId === toolId);
        let updated;
        if (existingIdx >= 0) {
          updated = [
            { toolId, lastUsed: Date.now(), count: (list[existingIdx].count || 1) + 1 },
            ...list.filter((_: unknown, i: number) => i !== existingIdx)
          ].slice(0, 8);
        } else {
          updated = [{ toolId, lastUsed: Date.now(), count: 1 }, ...list].slice(0, 8);
        }
        localStorage.setItem('prachurjo_recent_tools', JSON.stringify(updated));
      }
    } catch {
      // ignore
    }

    setHistory((prev) => {
      const newItem: HistoryItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      
      const updatedHistory = [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const removeHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updatedHistory = prev.filter(item => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  };

  return {
    history,
    addHistoryItem,
    clearHistory,
    removeHistoryItem
  };
}
