import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DataSourceWrapper from '../DataSourceWrapper';
import StudyListNext2 from './StudyListNext2';

/**
 * Ensures preserved params (e.g., configUrl) are present in the URL
 * BEFORE mounting DataSourceWrapper, mirroring legacy WorkList behavior.
 *
 * This allows us to integrate directly with the legacy DataSourceWrapper
 * without modifying it.
 */
export default function StudyListNext2Entry(props: withAppTypes) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const search = new URLSearchParams(location.search);
    const next = new URLSearchParams(location.search);

    // Keep track of last known configUrl when present
    const currentCfg = search.get('configUrl');
    if (currentCfg) {
      try {
        localStorage.setItem('ohif.lastConfigUrl', currentCfg);
      } catch {}
    }

    // If missing, try to recover from sessionStorage (legacy WorkList) or localStorage (our fallback)
    if (!currentCfg) {
      let recovered: string | null = null;
      try {
        const raw = sessionStorage.getItem('queryFilterValues');
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved?.configUrl) recovered = saved.configUrl;
        }
      } catch {}
      if (!recovered) {
        try {
          recovered = localStorage.getItem('ohif.lastConfigUrl');
        } catch {}
      }
      if (recovered) {
        next.set('configUrl', recovered);
        navigate({ pathname: location.pathname, search: `?${next.toString()}` }, { replace: true });
        return; // wait for URL update; effect will run again
      }
    }
    setReady(true);
  }, [location.pathname, location.search, navigate]);

  if (!ready) return null;

  return <DataSourceWrapper {...props} children={StudyListNext2} />;
}
