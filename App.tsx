import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';

// Features
import { Login, Register } from './features/Auth';
import { Dashboard, DeckEditor } from './features/DeckManagement';
import { StudySession } from './features/Study';
import { PublicCatalog, DeckDetail } from './features/PublicBrowser';
import { AdminPanel } from './features/Admin';

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

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/" element={<Navigate to="/public" />} />

    {/* Protected Routes */}
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/decks/new" element={<ProtectedRoute><DeckEditor /></ProtectedRoute>} />
    <Route path="/decks/:id/edit" element={<ProtectedRoute><DeckEditor /></ProtectedRoute>} />
    <Route path="/decks/:id/study" element={<ProtectedRoute><StudySession /></ProtectedRoute>} />

    {/* Public Catalog Routes (Accessible by all, but Detail view handles logic inside) */}
    <Route path="/public" element={<Layout><PublicCatalog /></Layout>} />
    <Route path="/public/:id" element={<Layout><DeckDetail /></Layout>} />

    {/* Admin Routes */}
    <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
  </Routes>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
           <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Feature Routes wrapped in simple layout logic handled by Main Layout component based on path/auth */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              
              <Route path="/decks/new" element={<ProtectedRoute><DeckEditor /></ProtectedRoute>} />
              <Route path="/decks/:id/edit" element={<ProtectedRoute><DeckEditor /></ProtectedRoute>} />
              <Route path="/decks/:id/study" element={<ProtectedRoute><StudySession /></ProtectedRoute>} />

              <Route path="/public" element={<PublicCatalog />} />
              <Route path="/public/:id" element={<DeckDetail />} />

              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
           </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;