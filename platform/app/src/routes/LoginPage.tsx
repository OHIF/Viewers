import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuthentication } from '@ohif/ui-next';

const JWT_TOKEN_KEY = 'ekko_jwt_token';

function getBaseUrl(): string {
  const appConfig = typeof window !== 'undefined' ? (window as any).config : {};
  const proxyPath = appConfig?.ekkoPacsApi?.proxyPath ?? '';
  const baseUrlConfig = appConfig?.ekkoPacsApi?.baseUrl ?? '';
  return (
    baseUrlConfig ||
    (proxyPath && typeof window !== 'undefined' ? window.location.origin + proxyPath : '')
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [, { setUser }] = useUserAuthentication();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password.trim()) {
        setError('Veuillez renseigner votre email et votre mot de passe.');
        return;
      }

      const baseUrl = getBaseUrl();
      if (!baseUrl) {
        setError("Configuration API manquante (ekkoPacsApi.baseUrl non défini).");
        return;
      }

      setLoading(true);
      setError(null);

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, jwt: true, session: false }),
      });

      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (!res.ok) {
        if (res.status === 401) {
          setError('Email ou mot de passe incorrect.');
        } else if (res.status === 403) {
          setError('Ce compte est désactivé. Contactez votre administrateur.');
        } else if (res.status === 400) {
          setError(data?.message ?? 'Email ou mot de passe manquant.');
        } else {
          setError(data?.message ?? `Erreur serveur (${res.status}). Réessayez ultérieurement.`);
        }
        return;
      }

      if (!data?.token) {
        setError('La réponse du serveur est invalide (token absent).');
        return;
      }

      localStorage.setItem(JWT_TOKEN_KEY, data.token);
      setUser(data.user ?? null);
      navigate('/');
    },
    [email, password, navigate, setUser]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-sm">
        {/* Logo / titre */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">PACS IA</h1>
          <p className="mt-1 text-sm text-[#666]">Système d&apos;imagerie médicale</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#141414] p-6 shadow-2xl">
          <h2 className="mb-5 text-base font-semibold text-white">Connexion</h2>

          <form
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Email */}
            <div className="mb-4">
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-xs font-medium text-[#999]"
              >
                Adresse email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="utilisateur@example.com"
                className="w-full rounded-lg border border-[#333] bg-[#1e1e1e] px-3 py-2.5 text-sm text-white placeholder-[#555] outline-none transition-colors focus:border-[#0076F7] focus:ring-1 focus:ring-[#0076F7] disabled:opacity-50"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-xs font-medium text-[#999]"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#333] bg-[#1e1e1e] px-3 py-2.5 pr-10 text-sm text-white placeholder-[#555] outline-none transition-colors focus:border-[#0076F7] focus:ring-1 focus:ring-[#0076F7] disabled:opacity-50"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#999] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-[#ef444433] bg-[#ef444411] px-3 py-2.5 text-sm text-[#f87171]">
                <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0076F7] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0062d0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion en cours…
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[#444]">
          © {new Date().getFullYear()} PACS IA
        </p>
      </div>
    </div>
  );
}
