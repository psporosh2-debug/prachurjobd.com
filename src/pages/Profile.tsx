import React, { useState, useEffect } from 'react';
import { supabase, UserProfile } from '@/lib/supabase';
import { User, Mail, Phone, MapPin, Globe, Twitter, Instagram, Github, Save, LogOut, Shield, Sparkles, Check, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    full_name: '',
    avatar_url: '',
    phone: '',
    address: '',
    twitter_url: '',
    instagram_url: '',
    github_url: '',
    website_url: ''
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setSessionUser(session.user);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data && !error) {
          setProfile(data as UserProfile);
        } else {
          // Initialize profile from authenticated user metadata
          setProfile({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
            avatar_url: session.user.user_metadata?.avatar_url || '',
            phone: '',
            address: '',
            twitter_url: '',
            instagram_url: '',
            github_url: '',
            website_url: ''
          });
        }
      } else {
        setSessionUser(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your profile.",
        variant: "destructive"
      });
      setLocation('/auth');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: sessionUser.id,
        email: profile.email || sessionUser.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
        address: profile.address,
        twitter_url: profile.twitter_url,
        instagram_url: profile.instagram_url,
        github_url: profile.github_url,
        website_url: profile.website_url,
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.error('Supabase upsert error:', error);
        toast({
          title: "Database Error",
          description: error.message || "Failed to update profile in database.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile Saved! 💾",
          description: "Your information has been successfully updated in Supabase.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save profile.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been logged out.",
    });
    setLocation('/auth');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-28 bg-muted rounded-2xl" />
        <div className="h-96 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary">
          <User className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Sign In to View Profile</h2>
          <p className="text-sm text-muted-foreground">
            Please log in or create an account to manage your creator profile and preferences.
          </p>
        </div>
        <Link href="/auth">
          <Button className="gap-2 font-bold w-full">
            <LogIn className="w-4 h-4" /> Go to Login / Register
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-primary/20 shadow-md">
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400'}
            alt={profile.full_name || 'User'}
            className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400';
            }}
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">{profile.full_name || 'Creator Profile'}</h1>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              <Shield className="w-3 h-3" /> Prachurjo AI Creator
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      {/* Profile Edit Form */}
      <Card className="border-primary/20 bg-card shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Personal & Social Details
          </CardTitle>
          <CardDescription className="text-xs">
            Manage your personal information, address, phone, and social connections stored in Supabase.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary" /> Full Name
                </label>
                <Input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" /> Email Address
                </label>
                <Input
                  type="email"
                  value={profile.email || ''}
                  disabled
                  className="opacity-80 cursor-not-allowed bg-muted"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
                </label>
                <Input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> Physical Address
                </label>
                <Input
                  type="text"
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
            </div>

            {/* Avatar URL */}
            <div className="space-y-1.5 pt-2 border-t">
              <label className="text-xs font-semibold text-foreground">Avatar Image URL</label>
              <Input
                type="url"
                value={profile.avatar_url || ''}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            {/* Social Links */}
            <div className="space-y-3 pt-2 border-t">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Social & Web Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                    <Twitter className="w-3.5 h-3.5 text-sky-500" /> Twitter Profile
                  </label>
                  <Input
                    type="url"
                    value={profile.twitter_url || ''}
                    onChange={(e) => setProfile({ ...profile, twitter_url: e.target.value })}
                    placeholder="https://twitter.com/..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                    <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram
                  </label>
                  <Input
                    type="url"
                    value={profile.instagram_url || ''}
                    onChange={(e) => setProfile({ ...profile, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                    <Github className="w-3.5 h-3.5" /> GitHub Profile
                  </label>
                  <Input
                    type="url"
                    value={profile.github_url || ''}
                    onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" /> Personal Website
                  </label>
                  <Input
                    type="url"
                    value={profile.website_url || ''}
                    onChange={(e) => setProfile({ ...profile, website_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2 font-bold">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile Details'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
