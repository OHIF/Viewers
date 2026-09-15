import React, { useEffect, useState } from 'react';
import './RemoteCursorOverlay.css';

const RemoteCursorOverlay = ({ viewportId, servicesManager }) => {
  const [cursors, setCursors] = useState<{ [userId: string]: any }>({});
  
  useEffect(() => {
    const { collaborationService } = servicesManager.services;
    if (!collaborationService) return;

    const { unsubscribe } = collaborationService.subscribe(
      'event::collaboration_remote_cursor',
      ({ cursor }) => {
        if (cursor.viewportId !== viewportId) return;

        setCursors((prev) => ({
          ...prev,
          [cursor.userId]: cursor,
        }));
        
        // Optionally map fade out
        if (cursor.fadeTimeoutMap) {
           clearTimeout(cursor.fadeTimeoutMap);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [viewportId, servicesManager]);

  return (
    <div className="remote-cursor-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 999, overflow: 'hidden' }}>
      {Object.values(cursors).map((cursor) => (
        <div
          key={cursor.userId}
          className="remote-cursor"
          style={{
            position: 'absolute',
            left: `${cursor.x * 100}%`,
            top: `${cursor.y * 100}%`,
            transition: 'left 0.05s linear, top 0.05s linear'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.5 3.5L18.5 10.5L11.5 12.5L9.5 19.5L5.5 3.5Z" fill="#FF0044" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <div className="remote-cursor-label" style={{ backgroundColor: '#FF0044', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', marginLeft: '12px', marginTop: '-4px', whiteSpace: 'nowrap', width: 'max-content' }}>
            {cursor.name || cursor.userId}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RemoteCursorOverlay;
