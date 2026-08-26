import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  Bot, 
  FileCode2, 
  Lock, 
  User, 
  ExternalLink,
  Maximize2,
  Share2,
  Heart,
  CheckCircle2
} from 'lucide-react';
import { ReelPost } from '@/types/reels';
import { soundEffects } from '@/lib/sound';
import { useToast } from '@/hooks/use-toast';
import { useAuthUser } from '@/hooks/useAuthUser';
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal';
import { ReelShareSheetModal } from '@/components/reels/ReelShareSheetModal';
import { supabase } from '@/lib/supabase';

interface ReelInfoModalProps {
  reel: ReelPost | null;
  isOpen: boolean;
  onClose: () => void;
  onCopySuccess?: (newCount: number) => void;
}

export const ReelInfoModal: React.FC<ReelInfoModalProps> = ({
  reel,
  isOpen,
  onClose,
  onCopySuccess
}) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthUser();
  const [copied, setCopied] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showShareSheet, setShowShareSheet] = useState<boolean>(false);

  if (!isOpen || !reel) return null;

  const promptText = reel.prompt_text || reel.title;

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      soundEffects.play('chime');
      toast({
        title: "Prompt Copied! ✨",
        description: "Full prompt instruction copied to clipboard.",
      });

      const newCount = (reel.copy_count || 0) + 1;
      try {
        await supabase.from('reels_posts').update({ copy_count: newCount }).eq('id', reel.id);
      } catch (err) {
        console.warn('Could not sync copy_count:', err);
      }

      if (onCopySuccess) {
        onCopySuccess(newCount);
      }

      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleCopy = async () => {
    if (!isAuthenticated) {
      soundEffects.play('alert');
      setShowAuthModal(true);
      return;
    }
    await doCopy();
  };

  const handleOpenSmartBot = () => {
    soundEffects.play('launch');
    onClose();
    const encoded = encodeURIComponent(promptText);
    setLocation(`/smart-bot?prompt=${encoded}`);
  };

  const handleGoToFullPage = () => {
    soundEffects.play('click');
    onClose();
    setLocation(`/prompt/${reel.id}`);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-2xl bg-zinc-950/95 border border-white/15 rounded-3xl shadow-2xl overflow-hidden text-white backdrop-blur-2xl animate-scale-in flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                {reel.category}
              </span>
              <span className="text-xs text-white/60 font-mono">
                {reel.copy_count || 0} copies
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundEffects.play('pop');
                  setShowShareSheet(true);
                }}
                className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                title="Share & Download Media"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share & Download</span>
              </button>

              <button
                onClick={handleGoToFullPage}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                title="Open Dedicated Full Screen Prompt Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Full Details</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            {/* Title */}
            <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
              {reel.title}
            </h3>

            {/* Prompt Code Block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode2 className="w-4 h-4" />
                  AI Prompt / Formula Instructions:
                </label>

                <button
                  onClick={handleCopy}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : !isAuthenticated
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : !isAuthenticated ? (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Sign In
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> 1-Click Copy
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-black/80 rounded-2xl border border-white/15 font-mono text-xs sm:text-sm text-cyan-100/90 select-all max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {promptText}
              </div>
            </div>

            {/* Creator Notes */}
            {reel.description && (
              <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                <strong className="text-amber-400 font-bold block mb-0.5">Creator Tips & Guidance:</strong>
                {reel.description}
              </div>
            )}

            {/* Action Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleOpenSmartBot}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Bot className="w-4 h-4" />
                <span>Open in Smart AI Bot</span>
              </button>

              <button
                onClick={handleGoToFullPage}
                className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-white/15 active:scale-95"
              >
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                <span>View Full Screen Details</span>
              </button>
            </div>
          </div>

          {/* Footer Meta */}
          <div className="px-5 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>By @{reel.author_name || 'Prachurjo Creator'}</span>
            </div>

            {reel.tiktok_url && (
              <a
                href={reel.tiktok_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
              >
                <span>View Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* TikTok-Style Share & Download Bottom Sheet */}
      <ReelShareSheetModal
        reel={reel}
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        onCopySuccess={onCopySuccess}
      />

      {/* Auth Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        mode="copy_prompt"
        onClose={() => setShowAuthModal(false)}
        onSuccess={async () => {
          setShowAuthModal(false);
          await doCopy();
        }}
      />
    </>
  );
};
