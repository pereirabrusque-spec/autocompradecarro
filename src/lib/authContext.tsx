import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'buyer';
  full_name: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isBuyer: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: (currentUser?: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const refreshProfile = async (currentUser?: User) => {
    const targetUser = currentUser || user;
    if (!targetUser) return;
    
    setIsProfileLoading(true);
    try {
      // 1. Fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUser.id)
        .single();

      // Handle missing table or recursion error
      if (error) {
        if (error.code === 'PGRST116') {
          // Profile not found, will create below
        } else if (error.code === '42P17' || error.message?.includes('recursion')) {
          console.error('Recursion detected in profiles policy. Please fix DB policies.');
          // Don't crash, but we can't do much more with profiles
          setIsLoading(false);
          return;
        } else if (error.code === '42P01') {
          console.warn('Profiles table missing or inaccessible.');
          setIsLoading(false);
          return;
        } else {
          console.error('Error fetching profile:', error);
        }
      }

      if (data) {
        setProfile(data as Profile);
        
        // 2. Optional: Sync roles only if it's the super admin or if we really need to check
        // This avoids 406 errors on every load for normal users
        const isSuperAdmin = targetUser.email === 'pereira.brusque@gmail.com';
        
        if (isSuperAdmin && data.role !== 'admin') {
          try {
            await supabase
              .from('profiles')
              .update({ role: 'admin', last_login: new Date().toISOString() })
              .eq('id', targetUser.id);
            setProfile({ ...data, role: 'admin' } as Profile);
          } catch (e) {}
        } else {
          // Just update last login
          try {
            await supabase
              .from('profiles')
              .update({ last_login: new Date().toISOString() })
              .eq('id', targetUser.id);
          } catch (e) {}
        }
      } else {
        // Profile doesn't exist, create a default one
        const isSuperAdmin = targetUser.email === 'pereira.brusque@gmail.com';
        
        const newProfile = {
          id: targetUser.id,
          email: targetUser.email,
          role: isSuperAdmin ? 'admin' : 'user',
          full_name: targetUser.user_metadata.full_name || targetUser.email?.split('@')[0],
          avatar_url: targetUser.user_metadata.avatar_url,
          last_login: new Date().toISOString()
        };
        
        try {
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();
            
          if (!createError && createdProfile) {
            setProfile(createdProfile as Profile);
          }
        } catch (e) {
          console.error('Failed to create profile:', e);
        }
      }
    } catch (error) {
      console.error('Error in refreshProfile:', error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setIsLoading(false);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      refreshProfile(user).then(() => {
        setIsLoading(false);
      });
    }
  }, [user]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  };

  const value = {
    user,
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin' || user?.email === 'pereira.brusque@gmail.com',
    isBuyer: profile?.role === 'buyer',
    signInWithGoogle,
    signOut,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
