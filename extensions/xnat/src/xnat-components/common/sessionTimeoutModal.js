import React from 'react';
import showModal from './showModal';

const modalContent = () => {
  const xnatPath =
    window.location.origin + window.location.pathname.split('VIEWER')[0];

  return (
    <div style={{ marginBottom: 10, padding: '20px 0' }}>
      <h3 style={{ color: 'var(--text-secondary-color)' }}>
        Your XNAT session has timed out
      </h3>
      <a href={xnatPath} style={{ color: 'var(--active-color)' }}>
        XNAT login page
      </a>
    </div>
  );
};

export function showSessionTimeoutModal() {
  return showModal(modalContent);
}
