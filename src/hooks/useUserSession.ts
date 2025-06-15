import { useEffect, useState } from 'react';
import { db } from '../lib/supabase';

interface UserSession {
  user: {
    firstName: string;
    lastName: string;
    photoURL?: string;
  } | null;
  brandName: string | null;
  isLoading: boolean;
  error: Error | null;
}

export const useUserSession = (): UserSession => {
  const [session, setSession] = useState<UserSession>({
    user: null,
    brandName: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const loadUserSession = async () => {
      try {
        // Get current user from Supabase auth
        const { data: { user } } = await db.auth.getUser();
        
        if (!user) {
          setSession({
            user: null,
            brandName: null,
            isLoading: false,
            error: null
          });
          return;
        }

        // Get user profile from Supabase
        const { data: profile } = await db
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Get brand info
        const { data: brand } = await db
          .from('brands')
          .select('name')
          .eq('owner_id', user.id)
          .single();

        setSession({
          user: profile ? {
            firstName: profile.first_name,
            lastName: profile.last_name,
            photoURL: profile.photo_url
          } : null,
          brandName: brand?.name || null,
          isLoading: false,
          error: null
        });

      } catch (error) {
        setSession(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error
        }));
      }
    };

    loadUserSession();
  }, []);

  return session;
}; 