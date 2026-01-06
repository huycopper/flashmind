import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from './UI';
import { WarningBanner } from './WarningBanner';
import { supabaseService } from '../services/supabaseService';
import { Warning } from '../types';
import { useEffect } from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useEffect(() => {
    if (user) {
      supabaseService.getWarnings(user.id).then(setWarnings);
    } else {
      setWarnings([]);
    }
  }, [user]);

  const handleDismissWarning = async (id: string) => {
    await supabaseService.dismissWarning(id);
    setWarnings(prev => prev.filter(w => w.id !== id));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink: React.FC<{ to: string; label: string }> = ({ to, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
            ? 'bg-primary text-white'
            : 'text-textSecondary hover:text-textPrimary hover:bg-gray-100'
          }`}
        onClick={() => setIsMenuOpen(false)}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans text-textPrimary">
      {/* Header */}
      <header className="bg-surface shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-primary tracking-tight">FlashMind</span>
              </Link>
              {isAuthenticated && (
                <div className="hidden md:ml-6 md:flex md:space-x-4">
                  <NavLink to="/dashboard" label="My Decks" />
                  <NavLink to="/public" label="Public Catalog" />
                  {user?.isAdmin && <NavLink to="/admin" label="Admin Panel" />}
                </div>
              )}
            </div>

            <div className="flex items-center">
              {isAuthenticated ? (
                <div className="hidden md:flex items-center space-x-4">
                  <Link to={`/profile/${user?.id}`} className="flex items-center gap-2 group">
                    <Avatar name={user?.displayName || ''} url={user?.profilePicture} size="sm" />
                    <span className="text-sm font-medium text-textPrimary group-hover:text-primary transition-colors">{user?.displayName}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary border border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <div className="flex items-center md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-textSecondary hover:text-textPrimary hover:bg-gray-100 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-surface border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" label="My Decks" />
                  <NavLink to="/public" label="Public Catalog" />
                  <NavLink to={`/profile/${user?.id}`} label="My Profile" />
                  {user?.isAdmin && <NavLink to="/admin" label="Admin Panel" />}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </>
              ) : (
                <div className="space-y-2 px-3 py-2">
                  <Link
                    to="/login"
                    className="block w-full px-4 py-2.5 text-center text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full px-4 py-2.5 text-center text-sm font-medium text-white bg-gradient-to-r from-primary to-blue-600 rounded-lg shadow-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {warnings.map(w => (
          <WarningBanner
            key={w.id}
            warning={w}
            onDismiss={() => handleDismissWarning(w.id)}
          />
        ))}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-textSecondary">
            &copy; {new Date().getFullYear()} FlashMind. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};