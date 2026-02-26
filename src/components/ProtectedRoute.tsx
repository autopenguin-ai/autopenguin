import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { PendingApproval } from './PendingApproval';

/**
 * @security UI-ONLY GUARD - Does NOT provide security
 * @description This component provides UX routing only. All security is enforced server-side:
 * 
 * **Server-Side Security Enforcement:**
 * 1. Database: RLS policies with has_role() checks on all tables
 * 2. Edge Functions: JWT verification (verify_jwt = true) 
 * 3. API: Supabase Auth validates all requests with JWT tokens
 * 4. Functions: SECURITY DEFINER functions (has_role, get_user_company_id, etc.)
 * 
 * **Why Client-Side Checks Are Safe:**
 * Bypassing this component via DevTools grants ZERO access to protected data because:
 * - RLS policies reject unauthorized queries at database level
 * - Edge functions verify JWT and reject invalid tokens
 * - All sensitive operations validate auth.uid() server-side
 * 
 * **Attack Scenarios That Are Blocked:**
 * - DevTools bypass → RLS denies data access
 * - Modified localStorage → Server validates JWT signature
 * - Fake role claims → SECURITY DEFINER functions check actual user_roles table
 * - Direct API calls → Supabase Auth requires valid session token
 * 
 * **Purpose of This Component:**
 * - Improve UX by preventing unauthorized users from seeing UI they can't use
 * - Redirect to appropriate pages (login, onboarding, pending approval)
 * - Provide clear "Access Denied" messages for role-restricted pages
 * 
 * @see Database RLS policies in supabase/migrations/
 * @see SECURITY DEFINER functions: has_role(), get_user_company_id(), etc.
 */

// Helper function to check role hierarchy access
function hasRoleAccess(userRole: string | null, requiredRole: string): boolean {
  if (!userRole) return false;

  const roleHierarchy: Record<string, string[]> = {
    'SUPER_ADMIN': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE'],
    'ADMIN': ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE'],
    'MANAGER': ['MANAGER', 'EMPLOYEE'],
    'ACCOUNTANT': ['ACCOUNTANT'],
    'EMPLOYEE': ['EMPLOYEE'],
  };

  return roleHierarchy[userRole]?.includes(requiredRole) || false;
}

// Helper function to check module-level permission access
function hasModuleAccess(permissions: Record<string, string> | null, module: string, requiredAccess: string): boolean {
  if (!permissions) return true; // No permissions defined = full access (backwards compat)
  const access = permissions[module];
  if (!access || access === 'none') return false;

  const accessLevels = ['none', 'read', 'assigned', 'view', 'full'];
  const requiredLevel = accessLevels.indexOf(requiredAccess);
  const userLevel = accessLevels.indexOf(access);
  return userLevel >= requiredLevel;
}

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredModule?: string;
  requiredAccess?: string;
}

export function ProtectedRoute({ children, requiredRole, requiredModule, requiredAccess }: ProtectedRouteProps) {
  const { user, userRole, userProfile, permissions, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    
    // Redirect to onboarding if not completed (but not if already on onboarding page)
    if (!loading && user && userProfile && !userProfile.onboarding_completed && window.location.pathname !== '/onboarding') {
      navigate('/onboarding');
      return;
    }
    
    // Prevent accessing onboarding if already completed
    if (!loading && user && userProfile && userProfile.onboarding_completed && window.location.pathname === '/onboarding') {
      navigate('/chat');
    }
  }, [user, loading, userProfile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user account is pending approval
  if (userProfile && !userProfile.is_active) {
    return <PendingApproval />;
  }

  // Check role-based access with hierarchy
  if (requiredRole && !hasRoleAccess(userRole, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Check module-level permission access
  if (requiredModule && requiredAccess && !hasModuleAccess(permissions, requiredModule, requiredAccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this module.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}