import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { firebaseAuth } from './firebaseConfig';
import LoginPage from '../routes/LoginPage';

interface FirebaseAuthRoutesProps {
  userAuthenticationService: AppTypes.UserAuthenticationService;
  children: React.ReactNode;
}

/**
 * FirebaseAuthRoutes — Firebase Google auth wrapper for OHIF.
 *
 * Uses signInWithPopup (NOT signInWithRedirect) so there is no full-page
 * reload and no race condition between getRedirectResult and onAuthStateChanged.
 *
 * Renders exactly ONE of three states:
 *   null  → loading (Firebase resolving cached session)
 *   false → login page only (OHIF routes are NOT mounted, so PrivateRoute
 *            never fires handleUnauthenticated → no redirect loop)
 *   User  → OHIF app only
 */
function FirebaseAuthRoutes({ userAuthenticationService, children }: FirebaseAuthRoutesProps) {
  // null  = Firebase hasn't resolved yet
  // false = resolved, no user
  // User  = resolved, user logged in
  const [firebaseUser, setFirebaseUser] = useState<User | null | false>(null);

  /** Returns Firebase ID token as a Bearer header for DICOMweb requests. */
  const getAuthorizationHeader = async () => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) return {};
    try {
      const token = await currentUser.getIdToken(false);
      return { Authorization: `Bearer ${token}` };
    } catch {
      return {};
    }
  };

  /** Opens a Google sign-in popup. onAuthStateChanged handles the result. */
  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
      // onAuthStateChanged fires automatically with the new user.
    } catch (err: any) {
      // User closed the popup or an error occurred.
      console.error('Firebase sign-in error:', err.code, err.message);
    }
  };

  // Register Firebase implementations with OHIF's auth service once on mount.
  useEffect(() => {
    userAuthenticationService.set({ enabled: true });
    userAuthenticationService.setServiceImplementation({
      getAuthorizationHeader,
      // handleUnauthenticated is never reached — OHIF routes only mount
      // when firebaseUser is a User object (see render logic below).
      handleUnauthenticated: () => null,
      reset: () => signOut(firebaseAuth),
    });
  }, []);

  // Subscribe to Firebase auth state.
  // Fires immediately with the cached user (or null) and on every change.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, user => {
      userAuthenticationService.setUser(user);
      setFirebaseUser(user ?? false);
    });
    return () => unsubscribe();
  }, []);

  // ── 1. Resolving cached session ─────────────────────────────────────────────
  if (firebaseUser === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <p className="text-sm text-white/60">Loading…</p>
      </div>
    );
  }

  // ── 2. Not authenticated — show login page ONLY ─────────────────────────────
  if (firebaseUser === false) {
    return (
      <Routes>
        <Route
          path="*"
          element={<LoginPage onSignIn={handleSignIn} />}
        />
      </Routes>
    );
  }

  // ── 3. Authenticated — show OHIF app ONLY ──────────────────────────────────
  return <>{children}</>;
}

export default FirebaseAuthRoutes;
