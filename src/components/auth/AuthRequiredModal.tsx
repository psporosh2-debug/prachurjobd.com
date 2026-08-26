import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  Mail, 
  User, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle,
  Copy,
  Upload
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { soundEffects } from '@/lib/sound';
import { useToast } from '@/hooks/use-toast';

export type AuthModalMode = 'copy_prompt' | 'upload_reel' | 'follow_creator' | 'general';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: AuthModalMode;
  onSuccess?: () => void;
  creatorName?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  mode = 'general',
  onSuccess,
  creatorName
}) => {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const getTitleAndSubtitle = () => {
    switch (mode) {
      case 'upload_reel':
        return {
          badge: 'Creator Studio Access',
          badgeColor: 'from-amber-500 to-orange-500',
          title: 'Account Required to Upload Reel',
          subtitle: 'Create a free creator account or sign in to publish TikTok Reels and 1-Click AI prompts.',
          icon: Upload
        };
      case 'copy_prompt':
        return {
          badge: '1-Click Prompt Security',
          badgeColor: 'from-cyan-500 to-blue-600',
          title: 'Sign In to Copy AI Prompts',
          subtitle: 'Create a free account or login to unlock unlimited 1-Click Prompt copying (PTCopy).',
          icon: Copy
        };
      case 'follow_creator':
        return {
          badge: 'Creator Community',
          badgeColor: 'from-pink-500 to-rose-600',
          title: `Follow ${creatorName || 'Creator'}`,
          subtitle: 'Sign in to follow top prompt creators and get notified of their latest video recipes.',
          icon: UserPlus
        };
      default:
        return {
          badge: 'Free Member Access',
          badgeColor: 'from-primary to-indigo-600',
          title: 'Sign In to Prachurjo',
          subtitle: 'Unlock community prompts, creator features, and tool synchronizations.',
          icon: ShieldCheck
        };
    }
  };

  const info = getTitleAndSubtitle();
  const IconComponent = info.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) {
          setErrorMsg(error.message || 'Invalid email or password.');
          soundEffects.play('alert');
        } else if (data?.user) {
          soundEffects.play('chime');
          toast({
            title: 'Welcome Back! 👋',
            description: 'Successfully signed in. Action unlocked!',
          });
          if (onSuccess) onSuccess();
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim() || email.split('@')[0],
            }
          }
        });

        if (error) {
          setErrorMsg(error.message || 'Could not register account.');
          soundEffects.play('alert');
        } else {
          soundEffects.play('resonantHit');
          toast({
            title: 'Account Created! 🎉',
            description: 'You are now registered and logged in.',
          });
          if (onSuccess) onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-card/95 border border-border/80 rounded-3xl shadow-2xl p-6 sm:p-7 text-card-foreground backdrop-blur-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Visual */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${info.badgeColor} text-white flex items-center justify-center shadow-xl shadow-primary/20`}>
            <IconComponent className="w-7 h-7" />
          </div>

          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
            {info.badge}
          </span>

          <h2 className="text-xl font-black text-foreground tracking-tight">
            {info.title}
          </h2>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
            {info.subtitle}
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          {/* Full Name for Signup */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" /> Full Name
              </label>
              <input
                type="text"
                required={!isLogin}
                placeholder="e.g. Alex Creator"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" /> Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" /> Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" /> Sign In & Continue
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Create Account & Continue
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="mt-5 pt-4 border-t border-border/70 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
              soundEffects.play('click');
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {isLogin 
              ? "Don't have an account? Sign up free (1-Click)" 
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
