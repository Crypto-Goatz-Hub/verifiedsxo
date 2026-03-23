import Head from 'next/head';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) throw loginError;
      router.push('/');
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - VerifiedSXO</title>
        <meta name="description" content="Sign in to VerifiedSXO" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="auth-page">
        <div className="auth-bg" />
        <div className="auth-container">
          <Link href="/" className="auth-logo">
            <span className="auth-logo-icon">&#x26A1;</span>
            <span className="auth-logo-text">VerifiedSXO</span>
          </Link>

          <div className="auth-card">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account</p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <p className="auth-footer-text">
              Don't have an account? <Link href="/signup" className="auth-link">Sign up</Link>
            </p>
            <p className="auth-footer-text" style={{ marginTop: '8px' }}>
              <Link href="/" className="auth-link" style={{ fontSize: '13px' }}>Forgot password?</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
