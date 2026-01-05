import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { mockBackend } from '../services/mockDataService';

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

  useEffect(() => {
    // Check local storage for persisted session
    const storedUser = localStorage.getItem('flashmind_session_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setState({ user, isAuthenticated: true });
      } catch (e) {
        console.error("Session parse error", e);
      }
    }
  }, []);

  const login = (user: User) => {
    localStorage.setItem('flashmind_session_user', JSON.stringify(user));
    setState({ user, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('flashmind_session_user');
    setState({ user: null, isAuthenticated: false });
  };

  const updateUser = (updates: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...updates };
      login(updatedUser); // persist
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};