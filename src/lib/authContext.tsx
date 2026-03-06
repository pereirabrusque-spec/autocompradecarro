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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        // Check if user is in admin_users table to ensure role is up to date
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('email')
          .eq('email', targetUser.email)
          .single();

        const { data: buyerData } = await supabase
          .from('interested_buyers')
          .select('email')
          .eq('email', targetUser.email)
          .single();

        const shouldBeAdmin = !!adminData || targetUser.email === 'pereira.brusque@gmail.com';
        const shouldBeBuyer = !!buyerData;
        
        let newRole: 'admin' | 'user' | 'buyer' = data.role;
        if (shouldBeAdmin) newRole = 'admin';
        else if (shouldBeBuyer) newRole = 'buyer';
        else newRole = 'user';

        if (newRole !== data.role) {
          // Update profile role if it's not already correct
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', targetUser.id)
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
          .eq('email', targetUser.email)
          .single();

        const { data: buyerData } = await supabase
          .from('interested_buyers')
          .select('email')
          .eq('email', targetUser.email)
          .single();

        const isAdminEmail = !!adminData || targetUser.email === 'pereira.brusque@gmail.com';
        const isBuyerEmail = !!buyerData;

        // If profile doesn't exist, create it
        const newProfile = {
          id: targetUser.id,
          email: targetUser.email,
          role: isAdminEmail ? 'admin' : (isBuyerEmail ? 'buyer' : 'user'),
          full_name: targetUser.user_metadata.full_name || targetUser.email?.split('@')[0],
          avatar_url: targetUser.user_metadata.avatar_url
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
