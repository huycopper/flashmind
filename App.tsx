import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Features (Lazy Loaded)
const Login = lazy(() => import('./features/Auth').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./features/Auth').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./features/DeckManagement').then(m => ({ default: m.Dashboard })));
const DeckEditor = lazy(() => import('./features/DeckManagement').then(m => ({ default: m.DeckEditor })));
const StudySession = lazy(() => import('./features/Study').then(m => ({ default: m.StudySession })));
const PublicCatalog = lazy(() => import('./features/PublicBrowser').then(m => ({ default: m.PublicCatalog })));
const DeckDetail = lazy(() => import('./features/PublicBrowser').then(m => ({ default: m.DeckDetail })));
const AdminPanel = lazy(() => import('./features/Admin').then(m => ({ default: m.AdminPanel })));
const UserProfile = lazy(() => import('./features/profile').then(m => ({ default: m.UserProfile })));
const LandingPage = lazy(() => import('./features/LandingPage').then(m => ({ default: m.LandingPage })));

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

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="text-primary text-xl font-semibold animate-pulse">Loading FlashMind...</div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<LoadingFallback />}>
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
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;