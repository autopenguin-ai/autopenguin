import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  permissions: Record<string, string> | null;
  userProfile: { is_active: boolean; status: string; first_name: string | null; last_name: string | null; onboarding_completed?: boolean; industry?: string | null; assistant_name?: string | null; learning_enabled?: boolean } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, string> | null>(null);
  const [userProfile, setUserProfile] = useState<{ is_active: boolean; status: string; first_name: string | null; last_name: string | null; onboarding_completed?: boolean; industry?: string | null; assistant_name?: string | null; learning_enabled?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_active, status, first_name, last_name, onboarding_completed, industry, assistant_name, learning_enabled')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return;
      }

      setUserProfile({
        is_active: profileData?.is_active || false,
        status: profileData?.status || 'PENDING',
        first_name: profileData?.first_name || null,
        last_name: profileData?.last_name || null,
        onboarding_completed: profileData?.onboarding_completed || false,
        industry: profileData?.industry || null,
        assistant_name: profileData?.assistant_name || null,
        learning_enabled: profileData?.learning_enabled !== false,
      });

      // Fetch role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        setUserRole(null);
      } else {
        setUserRole(roleData?.role || null);

        // Fetch permissions from role_templates if available
        if (roleData?.role) {
          const { data: templateData } = await supabase
            .from('role_templates')
            .select('permissions')
            .eq('name', roleData.role)
            .is('company_id', null)
            .single();

          setPermissions(templateData?.permissions || null);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to defer Supabase calls and prevent deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setPermissions(null);
          setUserProfile(null);
        }

        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in.",
      });

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      // Always clear local session first to avoid server 403 when no session
      await supabase.auth.signOut({ scope: 'local' });

      // Attempt global sign-out, but ignore "Session not found" errors
      const { error } = await supabase.auth.signOut();
      if (error && !/session not found/i.test(error.message)) {
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
      }
    } catch (err: any) {
      // Ignore unexpected errors but still clear local state
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } finally {
      // Ensure local state is cleared so ProtectedRoute redirects to /auth
      setSession(null);
      setUser(null);
      setUserRole(null);
      setPermissions(null);
      setUserProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  const value = {
    user,
    session,
    userRole,
    permissions,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
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