import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  full_name: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        // Check if user is in admin_users table to ensure role is up to date
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', user.email)
          .single();

        const shouldBeAdmin = !!adminData || user.email === 'pereira.brusque@gmail.com';
        
        if (shouldBeAdmin && data.role !== 'admin') {
          // Update profile to admin if it's not already
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.id)
            .select()
            .single();
          
          if (!updateError && updatedProfile) {
            setProfile(updatedProfile as Profile);
          } else {
            setProfile(data as Profile);
          }
        } else {
          setProfile(data as Profile);
        }
      } else {
        // Check if user is in admin_users table
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', user.email)
          .single();

        const isAdminEmail = !!adminData || user.email === 'pereira.brusque@gmail.com';

        // If profile doesn't exist, create it
        const newProfile = {
          id: user.id,
          email: user.email,
          role: isAdminEmail ? 'admin' : 'user',
          full_name: user.user_metadata.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata.avatar_url
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();
          
        if (!createError && createdProfile) {
          setProfile(createdProfile as Profile);
        }
      }
    } catch (error) {
      console.error('Error in refreshProfile:', error);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      refreshProfile();
    } else {
      setProfile(null);
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
    isAdmin: profile?.role === 'admin',
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
