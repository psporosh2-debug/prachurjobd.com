import React from 'react';
import { useHistory } from '@/hooks/useHistory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History as HistoryIcon, Trash2, Youtube, Sparkles, FileText, BarChart3, Video, Image as ImageIcon, Type, Palette, Clock, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { sound } from '@/lib/sound';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'thumbnail': return <Youtube className="w-4 h-4" />;
    case 'title_gen': return <Sparkles className="w-4 h-4" />;
    case 'desc_gen': return <FileText className="w-4 h-4" />;
    case 'channel_analysis': return <BarChart3 className="w-4 h-4" />;
    case 'video_analysis': return <Video className="w-4 h-4" />;
    case 'image_conv': return <ImageIcon className="w-4 h-4" />;
    case 'text_tool': return <Type className="w-4 h-4" />;
    case 'favicon': return <Palette className="w-4 h-4" />;
    default: return <HistoryIcon className="w-4 h-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'thumbnail': return 'text-red-500 bg-red-500/10';
    case 'title_gen': return 'text-amber-500 bg-amber-500/10';
    case 'desc_gen': return 'text-emerald-500 bg-emerald-500/10';
    case 'channel_analysis': return 'text-blue-500 bg-blue-500/10';
    case 'video_analysis': return 'text-indigo-500 bg-indigo-500/10';
    case 'image_conv': return 'text-purple-500 bg-purple-500/10';
    case 'text_tool': return 'text-pink-500 bg-pink-500/10';
    case 'favicon': return 'text-orange-500 bg-orange-500/10';
    default: return 'text-primary bg-primary/10';
  }
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

export default function History() {
  const { history, clearHistory, removeHistoryItem } = useHistory();

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-primary" />
            Activity History
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your recent interactions and tool usage. Saved locally on your device.
          </p>
        </div>

        {history.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              sound.clear();
              clearHistory();
            }} 
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <Card className="border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <HistoryIcon className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-medium text-foreground">No history yet</p>
            <p className="text-sm">Your activity will appear here once you start using the tools.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden transition-all hover:border-primary/50">
              <div className="flex items-start sm:items-center p-4 gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${getTypeColor(item.type)}`}>
                  {getTypeIcon(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                    <h3 className="font-semibold text-foreground truncate" title={item.title}>
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(item.timestamp)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {item.description}
                  </p>
                  
                  {item.url && (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{item.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <button 
                  onClick={() => {
                    sound.delete();
                    removeHistoryItem(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
