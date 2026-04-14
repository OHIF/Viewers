import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from '../routes/LoginPage';

export const JWT_TOKEN_KEY = 'ekko_jwt_token';

function getBaseUrl(): string {
  const appConfig = typeof window !== 'undefined' ? (window as any).config : {};
  const proxyPath = appConfig?.ekkoPacsApi?.proxyPath ?? '';
  const baseUrlConfig = appConfig?.ekkoPacsApi?.baseUrl ?? '';
  return (
    baseUrlConfig ||
    (proxyPath && typeof window !== 'undefined' ? window.location.origin + proxyPath : '')
  );
}

interface JwtAuthRoutesProps {
  userAuthenticationService: {
    set: (state: any) => void;
    setUser: (user: any) => void;
    setServiceImplementation: (impl: any) => void;
  };
}

/**
 * Configure le UserAuthenticationService pour le mode JWT email/password,
 * valide le token existant au montage, et enregistre la route /login.
 */
function JwtAuthRoutesInner({ userAuthenticationService }: JwtAuthRoutesProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const getAuthorizationHeader = () => {
      const token = localStorage.getItem(JWT_TOKEN_KEY);
      if (!token) return {};
      return { Authorization: `Bearer ${token}` };
    };

    const handleUnauthenticated = () => {
      navigate('/login');
      return null;
    };

    userAuthenticationService.setServiceImplementation({
      getAuthorizationHeader,
      handleUnauthenticated,
    });

    const token = localStorage.getItem(JWT_TOKEN_KEY);

    if (!token) {
      userAuthenticationService.set({ enabled: true });
      return;
    }

    // Token présent : activer l'auth ET poser un user provisoire en une seule
    // mise à jour d'état pour éviter que PrivateRoute ne redirige vers /login
    // pendant la validation asynchrone du token.
    userAuthenticationService.set({ enabled: true, user: { token } });

    const baseUrl = getBaseUrl();
    if (!baseUrl) return;

    fetch(`${baseUrl}/api/auth/is-logged`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        if (data?.logged && data?.user) {
          userAuthenticationService.setUser(data.user);
        } else {
          localStorage.removeItem(JWT_TOKEN_KEY);
          userAuthenticationService.set({ user: null });
        }
      })
      .catch(() => {
        // En cas d'erreur réseau, on garde le token et le user provisoire.
      });
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />
    </Routes>
  );
}

export default function JwtAuthRoutes({ userAuthenticationService }: JwtAuthRoutesProps) {
  return <JwtAuthRoutesInner userAuthenticationService={userAuthenticationService} />;
}
