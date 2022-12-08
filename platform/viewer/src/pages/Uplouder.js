import React, { useEffect } from 'react';
import { Link as RouterLink, useLocation, matchPath } from 'react-router-dom';

function UplouderPage() {
  const state = window.store.getState();

  const url = `http://localhost:3001?id_token=${state.oidc.user.id_token}`;

  return (
    <div
      style={{
        position: 'relative',
        height: '0',
        overflow: 'hidden',
        maxWidth: '100%',
        paddingBottom: '56.25%',
      }}
    >
      <iframe
        target="_blank"
        src={url}
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
        }}
        frameborder="0"
        allowfullscreen
      ></iframe>
    </div>
  );
}

export default UplouderPage;
