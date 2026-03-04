import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;

    // Admin trying to access team-owner-only routes → send to admin dashboard
    if (role === 'TEAM_OWNER' && user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;

    // Team owner trying to access admin-only routes → send to their dashboard
    if (role === 'ADMIN' && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

    return children;
}
