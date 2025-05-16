import React from 'react';

const SplitViewLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <div style={{ flex: '0 0 80%', height: '100%', overflow: 'hidden' }}>{children}</div>
      <div
        style={{
          flex: '0 0 20%',
          height: '100%',
          borderLeft: '1px solid #e0e0e0',
          background: '#fafbfc',
          padding: '24px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <h2 style={{ marginTop: 0 }}>AI Summary</h2>
        <div style={{ color: '#888', fontStyle: 'italic', marginTop: '16px' }}>
          AI summary or diagnosis will appear here.
        </div>
      </div>
    </div>
  );
};

export default SplitViewLayout;
