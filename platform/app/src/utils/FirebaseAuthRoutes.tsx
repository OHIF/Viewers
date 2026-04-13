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

function FirebaseAuthRoutes({ userAuthenticationService, children }: FirebaseAuthRoutesProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null | false>(null);
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

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuth, provider);
    } catch (err: any) {
      console.error('Firebase sign-in error:', err.code, err.message);
    }
  };

  useEffect(() => {
    userAuthenticationService.set({ enabled: true });
    userAuthenticationService.setServiceImplementation({
      getAuthorizationHeader,
      handleUnauthenticated: () => null,
      reset: () => signOut(firebaseAuth),
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, user => {
      userAuthenticationService.setUser(user);
      setFirebaseUser(user ?? false);
    });
    return () => unsubscribe();
  }, []);

  if (firebaseUser === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <p className="text-sm text-white/60">Loading…</p>
      </div>
    );
  }

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

  return <>{children}</>;
}

export default FirebaseAuthRoutes;
