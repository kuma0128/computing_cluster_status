import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

type AuthMethod = 'credentials' | 'sso';

interface LoginAttempt {
  timestamp: number;
  failed: boolean;
}

export function Login() {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<number>(0);
  const { login } = useAuth();
  const navigate = useNavigate();
  const vantaRef = useRef<HTMLDivElement | null>(null);
  const vantaEffect = useRef<any>(null);

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        setCsrfToken(data.token || '');
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
        // Generate a client-side token as fallback
        setCsrfToken(crypto.randomUUID());
      }
    };

    fetchCsrfToken();
  }, []);

  // Load Vanta background effect
  useEffect(() => {
    let isMounted = true;

    const loadVanta = async () => {
      if (!vantaRef.current) return;

      try {
        // Dynamically import Three.js and Vanta
        const THREE = await import('three');

        // Set THREE to window object for Vanta to use
        if (typeof window !== 'undefined') {
          (window as any).THREE = THREE;
        }

        // @ts-expect-error vanta has no type definitions
        const DOTS = (await import('vanta/dist/vanta.dots.min.js')).default;

        if (!isMounted || vantaEffect.current) return;

        vantaEffect.current = DOTS({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0xffaa80,
          color2: 0xffaa80,
          backgroundColor: 0x222222,
          size: 3,
          spacing: 35,
          showLines: true
        });
      } catch (err) {
        console.error('Failed to load Vanta effect:', err);
      }
    };

    loadVanta();

    return () => {
      isMounted = false;
      if (vantaEffect.current) {
        try {
          vantaEffect.current.destroy();
          vantaEffect.current = null;
        } catch (err) {
          console.error('Failed to destroy Vanta effect:', err);
        }
      }
    };
  }, []);

  // Rate limiting and lockout timer
  useEffect(() => {
    if (isLocked && lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutTime]);

  // Check for rate limiting
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const recentAttempts = loginAttempts.filter(attempt =>
      now - attempt.timestamp < 15 * 60 * 1000 // Last 15 minutes
    );

    const failedAttempts = recentAttempts.filter(a => a.failed);

    // Lock after 5 failed attempts
    if (failedAttempts.length >= 5) {
      const lockDuration = Math.min(300, Math.pow(2, failedAttempts.length - 5) * 30); // Exponential backoff, max 5 minutes
      setIsLocked(true);
      setLockoutTime(lockDuration);
      return false;
    }

    // Add delay after 3 failed attempts
    if (failedAttempts.length >= 3) {
      const delay = Math.pow(2, failedAttempts.length - 3) * 1000; // Exponential delay
      return new Promise<boolean>(resolve => {
        setTimeout(() => resolve(true), delay);
      }) as any;
    }

    return true;
  };

  const recordLoginAttempt = (failed: boolean) => {
    setLoginAttempts(prev => [
      ...prev,
      { timestamp: Date.now(), failed }
    ]);
  };

  // CapsLock detection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.getModifierState && !e.getModifierState('CapsLock')) {
      setCapsLockOn(false);
    }
  };

  const handleSSO = async () => {
    setLoading(true);
    setError('');

    try {
      // Redirect to SSO provider
      window.location.href = '/api/auth/sso';
    } catch (err) {
      setError('SSO authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if account is locked
    if (isLocked) {
      setError(`Account temporarily locked. Please try again in ${lockoutTime} seconds.`);
      return;
    }

    // Check rate limit
    if (!checkRateLimit()) {
      setError('Too many failed attempts. Please try again later.');
      return;
    }

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      // TODO: Include CSRF token when making API call to backend
      // For now, store it for future use
      console.log('CSRF Token:', csrfToken);

      const success = await login(username, password);
      if (success) {
        recordLoginAttempt(false); // Successful login
        navigate('/');
      } else {
        recordLoginAttempt(true); // Failed login
        setError('Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      recordLoginAttempt(true); // Failed login
      if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Network error occurred. Please check your connection.');
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Login to Cluster Monitor</h1>
          <p className="login-subtitle">
            Internal system access only.<br />
            All access attempts are logged and monitored.
          </p>
        </div>

        {/* Authentication method tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${authMethod === 'credentials' ? 'active' : ''}`}
            onClick={() => setAuthMethod('credentials')}
            disabled={loading}
          >
            Username / Password
          </button>
          <button
            type="button"
            className={`auth-tab ${authMethod === 'sso' ? 'active' : ''}`}
            onClick={() => setAuthMethod('sso')}
            disabled={loading}
          >
            Continue with SSO
          </button>
        </div>

        {authMethod === 'sso' ? (
          /* SSO Form */
          <div className="sso-container">
            <p className="sso-description">
              Use your organization's single sign-on to authenticate securely.
            </p>
            <button
              type="button"
              className="submit-button"
              onClick={handleSSO}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Redirecting...
                </>
              ) : (
                'Continue with SSO'
              )}
            </button>
          </div>
        ) : (
          /* Credentials Form */
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {/* Username field */}
            <div className="form-field">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                placeholder="Enter your username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                required
                aria-invalid={error ? 'true' : 'false'}
                disabled={loading || isLocked}
              />
            </div>

            {/* Password field */}
            <div className="form-field">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  aria-invalid={error ? 'true' : 'false'}
                  disabled={loading || isLocked}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                  disabled={loading || isLocked}
                >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

            {/* CapsLock warning */}
            {capsLockOn && (
              <div className="caps-lock-warning" role="alert">
                ⚠️ Caps Lock is ON
              </div>
            )}

            {/* Lockout warning */}
            {isLocked && (
              <div className="lockout-warning" role="alert">
                🔒 Account temporarily locked. Try again in {lockoutTime}s
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="error-message" role="alert" aria-live="assertive">
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="submit-button"
              disabled={loading || isLocked}
            >
              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Authenticating...
                </>
              ) : isLocked ? (
                `Locked (${lockoutTime}s)`
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        )}
      </div>

      <div id="dots" ref={vantaRef}></div>
    </div>
  );
}
