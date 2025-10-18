import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { validateEmail, sanitizeEmail } from '../utils/validation';
import './Login.css';

const LoginPage: React.FC = () => {
  const { signIn, user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.errors[0]);
      return;
    }

    if (!password || password.trim() === '') {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      // Sanitize email before sending
      const sanitizedEmail = sanitizeEmail(email);
      await signIn(sanitizedEmail, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('User not found. Please check your email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Invalid password. Please try again.');
      } else if (err.message?.includes('Unauthorized') || err.message?.includes('denied')) {
        setError('This account does not have admin privileges.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = () => {
    // Dev bypass - ONLY in development mode with explicit flag
    const isDevelopment = process.env.NODE_ENV === 'development' && 
                          process.env.REACT_APP_ENABLE_DEV_MODE === 'true';
    
    if (!isDevelopment) {
      setError('⚠️ Dev bypass is not available in production mode');
      return;
    }
    
    console.warn('⚠️ DEV BYPASS: Skipping authentication');
    console.warn('⚠️ This should NEVER be enabled in production!');
    localStorage.setItem('devBypass', 'true');
    window.location.href = '/dashboard'; // Force reload to trigger context update
  };

  return (
    <div className="login-page" style={{ backgroundColor: theme.background }}>
      <div className="login-container">
        {/* Logo and Title */}
        <div className="login-logo">
          <Shield size={60} color={theme.primary} />
        </div>
        <h1 className="login-title" style={{ color: theme.primary }}>
          GUILD ADMIN
        </h1>
        <p className="login-subtitle" style={{ color: theme.textSecondary }}>
          Admin Portal Access
        </p>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit} aria-label="Admin Login Form">
          {error && (
            <div 
              className="error-message" 
              style={{ backgroundColor: theme.error + '20' }}
              role="alert"
              aria-live="polite"
            >
              <AlertCircle size={20} color={theme.error} aria-hidden="true" />
              <span style={{ color: theme.error }}>{error}</span>
            </div>
          )}

          <div className="form-group">
            <div className="input-wrapper" style={{ 
              backgroundColor: theme.surface,
              borderColor: theme.border 
            }}>
              <Mail size={20} color={theme.textSecondary} />
              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-label="Admin Email"
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                style={{ 
                  backgroundColor: 'transparent',
                  color: theme.textPrimary 
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-wrapper" style={{ 
              backgroundColor: theme.surface,
              borderColor: theme.border 
            }}>
              <Lock size={20} color={theme.textSecondary} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                aria-label="Password"
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                style={{ 
                  backgroundColor: 'transparent',
                  color: theme.textPrimary 
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
            style={{ 
              backgroundColor: theme.primary,
              color: theme.background 
            }}
          >
            {loading ? (
              <div className="login-spinner"></div>
            ) : (
              'Sign In'
            )}
          </button>

          {/* DEV BYPASS BUTTON - ONLY IN DEVELOPMENT WITH FLAG */}
          {process.env.NODE_ENV === 'development' && process.env.REACT_APP_ENABLE_DEV_MODE === 'true' && (
            <button
              type="button"
              onClick={handleDevBypass}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#ffaa00',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              🔓 DEV BYPASS (No Auth)
            </button>
          )}
        </form>

        {/* Login Instructions */}
        <div className="login-info" style={{ 
          backgroundColor: theme.surface,
          borderColor: theme.border 
        }}>
          <p style={{ color: theme.textSecondary }}>
            Use your admin credentials to access the Guild Admin Portal.
          </p>
          {process.env.NODE_ENV === 'development' && process.env.REACT_APP_ENABLE_DEV_MODE === 'true' && (
            <p style={{ color: '#ffaa00', marginTop: '8px', fontSize: '12px' }}>
              🔧 Development Mode: You can use the bypass button for quick testing
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="login-footer" style={{ color: theme.textTertiary }}>
          © 2025 Guild Platform. Admin access only.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

