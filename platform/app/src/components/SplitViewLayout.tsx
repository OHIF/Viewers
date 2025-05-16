import React, { useRef, useState } from 'react';

const MIN_WIDTH_PERCENT = 5;
const MAX_WIDTH_PERCENT = 50;
const DEFAULT_WIDTH_PERCENT = 20;

const theme = {
  panelBg: '#11214c', // dark blue
  panelBorder: '#1a2a5a', // slightly lighter blue
  panelShadow: '0 2px 16px rgba(0,0,0,0.18)',
  heading: '#fff',
  text: '#e0e6f0',
  subText: '#8bb6e6',
  accent: '#3fa9f5', // light blue accent
  buttonBg: '#3fa9f5',
  buttonBorder: 'transparent',
  buttonShadow: '0 2px 8px rgba(0,0,0,0.18)',
  buttonHover: '#63c1ff',
  icon: '#fff',
  dragHandle: '#3fa9f5',
};

const SplitViewLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aiPanelWidth, setAiPanelWidth] = useState<number>(DEFAULT_WIDTH_PERCENT);
  const [isClosed, setIsClosed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Handle mouse drag for resizing
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) {
      return;
    }
    const x = e.clientX;
    const windowWidth = window.innerWidth;
    let newWidth = ((windowWidth - x) / windowWidth) * 100;
    newWidth = Math.max(0, Math.min(newWidth, MAX_WIDTH_PERCENT));
    if (newWidth < MIN_WIDTH_PERCENT) {
      setIsClosed(true);
      setAiPanelWidth(DEFAULT_WIDTH_PERCENT); // Reset for next open
    } else {
      setAiPanelWidth(newWidth);
      setIsClosed(false);
    }
  };

  const onMouseUp = () => {
    setDragging(false);
    document.body.style.cursor = '';
  };

  React.useEffect(() => {
    if (!dragging) {
      return;
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging]);

  // Floating button to reopen
  const floatingButton = (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 32,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 32,
          height: 2,
          background: theme.panelBorder,
          marginBottom: 8,
          borderRadius: 1,
        }}
      />
      <button
        style={{
          background: theme.buttonBg,
          border: `1px solid ${theme.buttonBorder}`,
          borderRadius: '16px',
          boxShadow: theme.buttonShadow,
          padding: '10px 12px 10px 10px',
          cursor: 'pointer',
          fontSize: 22,
          color: theme.icon,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        title="Show AI Summary"
        onClick={() => setIsClosed(false)}
        onMouseOver={e => (e.currentTarget.style.background = theme.buttonHover)}
        onMouseOut={e => (e.currentTarget.style.background = theme.buttonBg)}
      >
        {/* Left-pointing chevron, white */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.5 19L9.5 12L15.5 5"
            stroke={theme.icon}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        position: 'relative',
        background: theme.panelBg,
      }}
    >
      <div
        style={{
          flex: isClosed ? '1 1 100%' : `0 0 calc(${100 - aiPanelWidth}% )`,
          height: '100%',
          overflow: 'hidden',
          transition: 'flex-basis 0.2s',
        }}
      >
        {children}
      </div>
      {!isClosed && (
        <>
          {/* Draggable Divider */}
          <div
            ref={dragHandleRef}
            style={{
              position: 'relative',
              width: 0,
              zIndex: 20,
            }}
          >
            <div
              onMouseDown={onMouseDown}
              style={{
                position: 'absolute',
                left: -6,
                top: 0,
                width: 12,
                height: '100vh',
                cursor: 'col-resize',
                background: dragging ? theme.panelBorder : 'transparent',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => {
                if (!dragging) {
                  e.currentTarget.style.background = theme.buttonHover;
                }
              }}
              onMouseLeave={e => {
                if (!dragging) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              title="Resize AI Summary Panel"
            >
              <div
                style={{
                  width: 2,
                  height: '40px',
                  background: theme.dragHandle,
                  borderRadius: 1,
                }}
              />
            </div>
          </div>
          {/* AI Panel */}
          <div
            style={{
              flex: `0 0 ${aiPanelWidth}%`,
              height: '100%',
              borderLeft: `1px solid ${theme.panelBorder}`,
              background: theme.panelBg,
              boxShadow: theme.panelShadow,
              padding: '32px 24px 24px 24px',
              boxSizing: 'border-box',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              minWidth: 0,
              transition: 'flex-basis 0.2s',
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
              margin: '12px 12px 12px 0',
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: theme.heading,
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: 0.2,
              }}
            >
              AI Summary
            </h2>
            <div
              style={{
                color: theme.subText,
                fontStyle: 'italic',
                marginTop: '20px',
                fontSize: 16,
                textAlign: 'center',
              }}
            >
              AI summary or diagnosis will appear here.
            </div>
          </div>
        </>
      )}
      {isClosed && floatingButton}
    </div>
  );
};

export default SplitViewLayout;
