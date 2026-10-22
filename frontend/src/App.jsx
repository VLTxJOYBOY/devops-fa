import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './utils/AuthContext';
import { ToastProvider } from './utils/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Explore from './pages/Explore';
import Login from './pages/Login';
import Register from './pages/Register';
import ImageDetail from './pages/ImageDetail';
import UploadImage from './pages/UploadImage';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 16px' }} />
        <p style={{ color: '#94a3b8' }}>Verifying session...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* 1. Explore page */}
                <Route path="/" element={<Explore />} />

                {/* 2. Login page */}
                <Route path="/login" element={<Login />} />
                <Route path="/auth" element={<Navigate to="/login" replace />} />

                {/* 3. Registration page */}
                <Route path="/register" element={<Register />} />

                {/* 4. Image detail page */}
                <Route path="/image/:id" element={<ImageDetail />} />

                {/* 5. Upload image page (Protected) */}
                <Route
                  path="/upload"
                  element={
                    <ProtectedRoute>
                      <UploadImage />
                    </ProtectedRoute>
                  }
                />

                {/* 6. Profile and uploads page */}
                <Route path="/profile" element={<Profile />} />

                {/* 7. Saved favorites page (Protected) */}
                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <Favorites />
                    </ProtectedRoute>
                  }
                />

                {/* 8. Collections overview page (Protected) */}
                <Route
                  path="/collections"
                  element={
                    <ProtectedRoute>
                      <Collections />
                    </ProtectedRoute>
                  }
                />

                {/* 9. Individual collection details page */}
                <Route path="/collections/:id" element={<CollectionDetail />} />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
