import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const vantaRef = useRef<HTMLDivElement | null>(null);
  const vantaEffect = useRef<any>(null);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('ユーザー名とパスワードを入力してください');
      return;
    }

    const success = await login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('ログインに失敗しました');
    }
  };

  return (
    <div className="login-container">
      <div className="wrapper">
        <div className="container">
          <h1>計算機稼働状況 - ログイン</h1>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="ユーザー名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button type="submit">ログイン</button>
          </form>

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
      <div id="dots" ref={vantaRef}></div>
    </div>
  );
}
