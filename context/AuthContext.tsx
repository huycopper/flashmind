import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { supabase } from '../services/supabaseClient';
import { supabaseService } from '../services/supabaseService';

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const user = await supabaseService.getCurrentUser();
          if (user) {
            setState({ user, isAuthenticated: true });
          }
        } catch (err) {
          console.error('Error loading user:', err);
        }
      }
      setLoading(false);
    }).catch(err => {
      console.error('Session check error:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const user = await supabaseService.getCurrentUser();
          if (user) {
            setState({ user, isAuthenticated: true });
          }
        } catch (err) {
          console.error('Error on auth change:', err);
        }
      } else {
        setState({ user: null, isAuthenticated: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (user: User) => {
    setState({ user, isAuthenticated: true });
  };

  const logout = async () => {
    try {
      await supabaseService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    setState({ user: null, isAuthenticated: false });
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!state.user) return;
    try {
      const updatedUser = await supabaseService.updateUserProfile(state.user.id, {
        displayName: updates.displayName,
        bio: updates.bio,
      });
      setState({ user: updatedUser, isAuthenticated: true });
    } catch (err) {
      console.error('Update user error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-textSecondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
