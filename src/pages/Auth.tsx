import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, User, ShieldCheck, ArrowRight, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setLocation('/profile');
      }
    });
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter email and password.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) {
          toast({
            title: "Sign In Failed",
            description: error.message || "Invalid login credentials.",
            variant: "destructive"
          });
        } else if (data?.user) {
          toast({
            title: "Welcome Back! 👋",
            description: "Successfully signed in.",
          });
          setLocation('/profile');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim(),
            }
          }
        });

        if (error) {
          toast({
            title: "Sign Up Failed",
            description: error.message || "Could not register account.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Account Created! 🎉",
            description: "Your account is created. Logging in...",
          });
          setLocation('/profile');
        }
      }
    } catch (err: any) {
      toast({
        title: "Authentication Error",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {isLogin ? 'Sign In to Prachurjo' : 'Create Free Account'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLogin 
            ? 'Access your tool history, saved preferences, and creator profile.' 
            : 'Join Prachurjo to sync settings, API keys, and custom tool preferences.'}
        </p>
      </div>

      <Card className="border-primary/20 bg-card shadow-xl rounded-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2 font-bold py-5">
              {isLogin ? (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center border-t pt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {isLogin 
                ? "Don't have an account? Sign up free" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
