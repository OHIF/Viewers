import React, { useState } from 'react';
import { supabase } from './auth/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage('Error: ' + error.message);
    } else {
      setMessage('Check your email for the magic link!');
    }

    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '300px' }}>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '8px' }}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
        {message && <p style={{ marginTop: '10px' }}>{message}</p>}
      </div>
    </div>
  );
}
