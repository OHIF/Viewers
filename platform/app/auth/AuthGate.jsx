import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { isUserAllowed } from './allowedUsers';

const AuthState = {
  LOADING: 'LOADING',
  AUTHORIZED: 'AUTHORIZED',
  UNAUTHORIZED: 'UNAUTHORIZED',
};

export default function AuthGate({ children }) {
  const [authState, setAuthState] = useState(AuthState.LOADING);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = '/login';
      return;
    }

    const allowed = await isUserAllowed(session.user.email);

    if (!allowed) {
      await supabase.auth.signOut();
      window.location.href = '/login';
      return;
    }

    setAuthState(AuthState.AUTHORIZED);
  }

  if (authState === AuthState.LOADING) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (authState === AuthState.AUTHORIZED) {
    return <>{children}</>;
  }

  return null;
}
