import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spinner } from './components/common/Skeleton';

export const ProtectedRoute = () => {
  const { isAuthenticated, initialized } = useSelector((s) => s.auth);
  const token = localStorage.getItem('token');

  if (token && !initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-925 gap-4">
        <span className="text-5xl animate-wiggle">💬</span>
        <Spinner size="md" />
        <p className="text-sm text-zinc-400">Loading ChatApp…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export const GuestRoute = () => {
  const { isAuthenticated, initialized } = useSelector((s) => s.auth);
  const token = localStorage.getItem('token');
  if (token && !initialized) return null;
  if (isAuthenticated) return <Navigate to="/chat" replace />;
  return <Outlet />;
};
