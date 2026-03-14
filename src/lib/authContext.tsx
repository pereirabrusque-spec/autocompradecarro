import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'buyer' | 'buyer_premium' | 'buyer_master';
  full_name: string;
  avatar_url?: string;
  phone?: string;
  last_login?: string;
  view_auth?: boolean;
  send_config?: any;
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
        console.error('[AUTH-DEBUG] Erro detalhado ao buscar perfil:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          context: 'refreshProfile',
          userId: targetUser.id
        });
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
        
        let updates: any = { last_login: new Date().toISOString() };
        
        if (isSuperAdmin && data.role !== 'admin') {
          updates.role = 'admin';
        }
        
        // Force pull name and photo from Google Auth if missing or different
        if (targetUser.user_metadata?.full_name && data.full_name !== targetUser.user_metadata.full_name) {
          updates.full_name = targetUser.user_metadata.full_name;
        }
        if (targetUser.user_metadata?.avatar_url && data.avatar_url !== targetUser.user_metadata.avatar_url) {
          updates.avatar_url = targetUser.user_metadata.avatar_url;
        }
        
        if (Object.keys(updates).length > 0) {
          try {
            await supabase
              .from('profiles')
              .update(updates)
              .eq('id', targetUser.id);
            setProfile({ ...data, ...updates } as Profile);
          } catch (e) {
            console.error('Failed to update profile with Google data:', e);
          }
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
          console.log('[AUTH-DEBUG] Tentando criar perfil para:', targetUser.id);
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();
            
          if (createError) {
            console.error('[AUTH-DEBUG] ERRO AO CRIAR PERFIL:', createError);
          } else if (createdProfile) {
            console.log('[AUTH-DEBUG] Perfil criado com sucesso:', createdProfile);
            setProfile(createdProfile as Profile);
          }
        } catch (e) {
          console.error('[AUTH-DEBUG] EXCEÇÃO AO CRIAR PERFIL:', e);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AUTH-DEBUG] Evento: ${event}`, {
        user: session?.user?.email,
        userId: session?.user?.id,
        sessionExists: !!session
      });
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
    console.log('[Auth] Iniciando login com Google...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      console.error('[Auth] Erro no signInWithGoogle:', error);
      throw error;
    }
    console.log('[Auth] Resposta do signInWithGoogle:', data);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  };

  const value = useMemo(() => ({
    user,
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin' || user?.email === 'pereira.brusque@gmail.com',
    isBuyer: profile?.role === 'buyer' || profile?.role === 'buyer_premium' || profile?.role === 'buyer_master',
    signInWithGoogle,
    signOut,
    refreshProfile
  }), [user, profile, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
