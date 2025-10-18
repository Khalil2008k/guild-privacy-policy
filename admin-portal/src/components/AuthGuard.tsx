import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  permission?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, permission }) => {
  const { user, loading, isAuthorized } = useAuth();

  // Check for dev bypass
  const devBypass = localStorage.getItem('devBypass') === 'true';

  if (loading && !devBypass) {
    return <LoadingScreen />;
  }

  if (!user && !devBypass) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !isAuthorized(permission) && !devBypass) {
    return (
      <div className="unauthorized-page">
        <div className="unauthorized-content">
          <h1>🔒 Access Denied</h1>
          <p>You don&apos;t have permission to access this page.</p>
          <p>Required permission: <code>{permission}</code></p>
          <p>Your role: <code>{user?.role || 'unknown'}</code></p>
          <button onClick={() => window.history.back()}>Go Back</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;

