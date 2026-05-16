import React, { useState } from 'react';

interface LoginPageProps {
  onSignIn: () => void;
}

function LoginPage({ onSignIn }: LoginPageProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      onSignIn();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Sign-in failed. Please try again.');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-white/10 bg-white/5 p-10">
        <div className="flex flex-col items-center gap-2">
          <img
            src="/ohif-logo-light.svg"
            alt="OHIF Logo"
            className="h-10 w-auto"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <h1 className="text-xl font-semibold text-white">24x7 Dental Viewer</h1>
          <p className="text-sm text-white/50">Sign in to continue</p>
        </div>

        {error && (
          <div className="w-full rounded-md bg-red-500/20 px-4 py-2 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/20 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
          {isSigningIn ? 'Redirecting…' : 'Sign in with Google'}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
