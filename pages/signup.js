import Head from 'next/head';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (signUpError) throw signUpError;
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - VerifiedSXO</title>
        <meta name="description" content="Create your VerifiedSXO account" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="auth-page">
        <div className="auth-bg" />
        <div className="auth-container">
          <Link href="/" className="auth-logo">
            <span className="auth-logo-icon">&#x26A1;</span>
            <span className="auth-logo-text">VerifiedSXO</span>
          </Link>

          {success ? (
            <div className="auth-card">
              <div className="auth-success">
                <div className="auth-success-icon">&#x2713;</div>
                <h2>Check Your Email</h2>
                <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
                <Link href="/login" className="auth-link">Go to Login</Link>
              </div>
            </div>
          ) : (
            <div className="auth-card">
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Start verifying intelligence today</p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSignup} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
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
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <p className="auth-footer-text">
                Already have an account? <Link href="/login" className="auth-link">Sign in</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
