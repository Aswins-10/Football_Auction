import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/ui/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TournamentPage from './pages/TournamentPage';
import AuctionPage from './pages/AuctionPage';
import TeamPage from './pages/TeamPage';
import AdminLoginPage from './pages/AdminLoginPage';

// Layout with navbar — used by all public/user routes
function MainLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e' }}>
      <Navbar />
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin portal — no navbar, completely isolated */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* All other pages share the Navbar via MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/tournament/:id" element={
              <ProtectedRoute><TournamentPage /></ProtectedRoute>
            } />
            <Route path="/tournament/:id/auction" element={
              <ProtectedRoute><AuctionPage /></ProtectedRoute>
            } />
            <Route path="/tournament/:id/team/:teamId" element={
              <ProtectedRoute><TeamPage /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
