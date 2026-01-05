import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from './UI';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink: React.FC<{ to: string; label: string }> = ({ to, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
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
                    className="text-sm text-warning hover:text-red-700 font-medium ml-2"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex space-x-4">
                   <Link to="/login" className="text-primary font-medium hover:underline">Log In</Link>
                   <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-full hover:bg-blue-700 transition">Sign Up</Link>
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
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-warning hover:bg-gray-100"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-textPrimary hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>Log In</Link>
                  <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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