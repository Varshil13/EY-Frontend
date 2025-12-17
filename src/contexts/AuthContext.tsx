import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  supabaseUser: SupabaseUser | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Omit<User, 'profile_id' | 'created_at'>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserByAuthId(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          await loadUserByAuthId(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const generateProfileId = async (): Promise<string> => {
    // Get all existing profile IDs to find the next available one
    const { data: existingUsers, error } = await supabase
      .from('users')
      .select('profile_id')
      .order('profile_id');
    
    if (error) {
      console.error('Error fetching existing profile IDs:', error);
      // Fallback to timestamp-based ID if query fails
      return `U${Date.now().toString().slice(-6)}`;
    }
    
    const existingIds = existingUsers?.map(user => user.profile_id) || [];
    
    // Find the next available ID
    let nextId = 1;
    let candidateId = `U${nextId.toString().padStart(3, '0')}`;
    
    while (existingIds.includes(candidateId)) {
      nextId++;
      candidateId = `U${nextId.toString().padStart(3, '0')}`;
    }
    
    return candidateId;
  };

  const loadUserByAuthId = async (authId: string) => {
    try {
      // First, try to find user by auth_id (we'll add this field)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      
      if (data) {
        setUser(data);
      } else {
        // User exists in auth but not in users table - this shouldn't happen with proper signup
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setUser(data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Omit<User, 'profile_id' | 'created_at'>) => {
    try {
      // Clear any existing session first
      await supabase.auth.signOut();

      // Attempt signup with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('User already registered')) {
          // Try to sign in instead
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (signInError) {
            throw new Error('Account exists but password is incorrect. Please use the login form.');
          }

          if (signInData.user) {
            // Check if user profile exists
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('auth_id', signInData.user.id)
              .maybeSingle();

            if (existingUser) {
              await loadUserByAuthId(signInData.user.id);
              return;
            } else {
              // User exists in auth but not in users table, create profile
              const profile_id = await generateProfileId();
              
              const { error: insertError } = await supabase.from('users').insert({
                profile_id,
                auth_id: signInData.user.id,
                name: userData.name,
                age: userData.age,
                city: userData.city,
                monthly_income: userData.monthly_income,
                employment_type: userData.employment_type,
                years_employed: userData.years_employed,
                credit_score: userData.credit_score,
                existing_emi: userData.existing_emi || 0,
              });

              if (insertError) throw insertError;
              await loadUserByAuthId(signInData.user.id);
              return;
            }
          }
        }
        throw error;
      }

      if (data?.user) {
        // Generate unique profile ID
        const profile_id = await generateProfileId();
        
        // Create user record in our users table
        const { error: insertError } = await supabase.from('users').insert({
          profile_id,
          auth_id: data.user.id,
          name: userData.name,
          age: userData.age,
          city: userData.city,
          monthly_income: userData.monthly_income,
          employment_type: userData.employment_type,
          years_employed: userData.years_employed,
          credit_score: userData.credit_score,
          existing_emi: userData.existing_emi || 0,
        });

        if (insertError) {
          console.error('Profile creation error:', insertError);
          throw new Error(`Failed to create user profile: ${insertError.message}`);
        }

        // Load the newly created user
        await loadUserByAuthId(data.user.id);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      if (data?.user) {
        // Load user profile after successful sign in
        await loadUserByAuthId(data.user.id);
      }
    } catch (error: any) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('profile_id', user.profile_id);

    if (error) throw error;
    
    // Reload user data
    await loadUser(user.profile_id);
  };

  return (
    <AuthContext.Provider value={{ supabaseUser, user, loading, signUp, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
