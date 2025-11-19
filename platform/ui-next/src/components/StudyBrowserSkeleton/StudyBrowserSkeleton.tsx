import React from 'react';

export const StudyBrowserSkeleton = () => {
  return (
    <div
      style={{
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        padding: '0.5rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-secondary-dark, #23272f)',
          display: 'flex',
          height: '50px',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '0.5rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <div
            style={{
              height: '1rem',
              width: '6rem',
              borderRadius: '0.25rem',
              backgroundColor: 'black',
            }}
          />
          <div
            style={{
              height: '1rem',
              width: '10rem',
              borderRadius: '0.25rem',
              backgroundColor: 'black',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.25rem',
          }}
        >
          <div
            style={{
              height: '0.75rem',
              width: '5rem',
              borderRadius: '0.25rem',
              backgroundColor: 'black',
            }}
          />
          <div
            style={{
              height: '0.75rem',
              width: '2rem',
              borderRadius: '0.25rem',
              backgroundColor: 'black',
            }}
          />
        </div>
      </div>
      <div
        style={{
          zIndex: 10,
          marginTop: '0.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '0.5rem',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: 'var(--color-secondary-dark, #23272f)',
              height: '6rem',
              width: '100%',
              borderRadius: '0.5rem',
            }}
          />
        ))}
      </div>
      {/* Add keyframes for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </div>
  );
};

export default StudyBrowserSkeleton;
