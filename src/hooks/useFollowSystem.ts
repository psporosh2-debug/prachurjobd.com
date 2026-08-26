import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useFollowSystem(creatorIdentifier?: string) {
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Storage key for guest / cached follows
  const storageKey = 'prachurjo_followed_creators';

  const checkFollowStatus = useCallback(async () => {
    if (!creatorIdentifier) return;

    // 1. Check local storage
    try {
      const stored = localStorage.getItem(storageKey);
      const followedList: string[] = stored ? JSON.parse(stored) : [];
      setIsFollowed(followedList.includes(creatorIdentifier));
    } catch {
      // Ignored
    }

    // 2. Check Supabase if user is logged in
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('creator_follows')
          .select('id')
          .eq('follower_id', session.user.id)
          .eq('creator_name', creatorIdentifier)
          .maybeSingle();

        if (!error && data) {
          setIsFollowed(true);
        }
      }
    } catch (err) {
      console.warn('Follow check skipped/table not configured yet:', err);
    }
  }, [creatorIdentifier]);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const toggleFollow = async (requireAuthCallback?: () => void): Promise<boolean> => {
    if (!creatorIdentifier) return false;

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      if (requireAuthCallback) {
        requireAuthCallback();
      }
      return false;
    }

    setLoading(true);
    const nextState = !isFollowed;
    setIsFollowed(nextState);

    // Save in LocalStorage
    try {
      const stored = localStorage.getItem(storageKey);
      let followedList: string[] = stored ? JSON.parse(stored) : [];
      if (nextState) {
        if (!followedList.includes(creatorIdentifier)) followedList.push(creatorIdentifier);
      } else {
        followedList = followedList.filter(name => name !== creatorIdentifier);
      }
      localStorage.setItem(storageKey, JSON.stringify(followedList));
    } catch {
      // Ignored
    }

    // Sync with Supabase table (gracefully fallback if table does not exist)
    try {
      if (nextState) {
        await supabase.from('creator_follows').upsert({
          follower_id: session.user.id,
          creator_name: creatorIdentifier,
          created_at: new Date().toISOString()
        });
      } else {
        await supabase.from('creator_follows')
          .delete()
          .eq('follower_id', session.user.id)
          .eq('creator_name', creatorIdentifier);
      }
    } catch (err) {
      console.warn('Supabase creator_follows sync skipped/offline:', err);
    } finally {
      setLoading(false);
    }

    return nextState;
  };

  return { isFollowed, toggleFollow, loading };
}
