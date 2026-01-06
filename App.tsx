import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Features
import { Login, Register } from './features/Auth';
import { Dashboard, DeckEditor } from './features/DeckManagement';
import { StudySession } from './features/Study';
import { PublicCatalog, DeckDetail } from './features/PublicBrowser';
import { AdminPanel } from './features/Admin';
import { UserProfile } from './features/profile';
import { LandingPage } from './features/LandingPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const RedirectIfAuthenticated: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes (Guest Only) */}
            <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
            <Route path="/register" element={<RedirectIfAuthenticated><Register /></RedirectIfAuthenticated>} />
            <Route path="/" element={<RedirectIfAuthenticated><LandingPage /></RedirectIfAuthenticated>} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/decks/new" element={<ProtectedRoute><DeckEditor /></ProtectedRoute>} />
            <Route path="/decks/:id/edit" element={<ProtectedRoute><DeckEditor /></ProtectedRoute>} />
            <Route path="/decks/:id/study" element={<ProtectedRoute><StudySession /></ProtectedRoute>} />

            {/* Public Catalog Routes */}
            <Route path="/public" element={<PublicCatalog />} />
            <Route path="/public/:id" element={<DeckDetail />} />

            {/* Profile Route */}
            <Route path="/profile/:userId" element={<UserProfile />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;