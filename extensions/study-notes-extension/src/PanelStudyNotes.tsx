import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const PanelStudyNotes = ({ servicesManager, commandsManager }) => {
  const { userAuthenticationService, viewportGridService, displaySetService } = servicesManager.services;
  
  const [noteText, setNoteText] = useState('');
  const [status, setStatus] = useState(''); // '', 'Loading...', 'Saving...', 'Saved', 'Error'
  const [studyInstanceUID, setStudyInstanceUID] = useState(null);

  // Helper to get current study instance UID
  const getActiveStudyInstanceUID = () => {
    // Attempt to get from active viewport
    const { activeViewportId, viewports } = viewportGridService.getState();
    if (activeViewportId && viewports.get(activeViewportId)) {
        const viewport = viewports.get(activeViewportId);
        if (viewport.displaySetInstanceUIDs && viewport.displaySetInstanceUIDs.length > 0) {
            const displaySet = displaySetService.getDisplaySetByUID(viewport.displaySetInstanceUIDs[0]);
            return displaySet?.StudyInstanceUID;
        }
    }
    return null;
  };

  useEffect(() => {
    const updateStudy = () => {
        const uid = getActiveStudyInstanceUID();
        if (uid && uid !== studyInstanceUID) {
            setStudyInstanceUID(uid);
            fetchNote(uid);
        }
    };

    // Initial check
    updateStudy();

    // Subscribe to viewport changes (grid state changes)
    const subscription = viewportGridService.subscribe(
        viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
        updateStudy
    );
    
    // Also subscribe to layout changes which might affect viewports
    const subscription2 = viewportGridService.subscribe(
        viewportGridService.EVENTS.LAYOUT_CHANGED,
        updateStudy
    );

    return () => {
        subscription.unsubscribe();
        subscription2.unsubscribe();
    };
  }, [studyInstanceUID, viewportGridService, displaySetService]);


  const fetchNote = async (uid) => {
    if (!uid) return;
    setStatus('Loading...');
    try {
      const authHeader = userAuthenticationService.getAuthorizationHeader(); 
      // Handle potential object return from getAuthorizationHeader
      const tokenHeader = authHeader && typeof authHeader === 'object' ? authHeader.Authorization : authHeader;

      const response = await fetch(`https://api.imaging.smartcareplus.in/api/notes/${uid}`, {
        method: 'GET',
        headers: {
          'Authorization': tokenHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setNoteText(data.note_text || '');
      setStatus('');
    } catch (error) {
      console.error(error);
      setStatus('Error loading note');
    }
  };

  const saveNote = async () => {
    if (!studyInstanceUID) return;
    setStatus('Saving...');
    try {
      const authHeader = userAuthenticationService.getAuthorizationHeader();
      const tokenHeader = authHeader && typeof authHeader === 'object' ? authHeader.Authorization : authHeader;

      const response = await fetch(`https://api.imaging.smartcareplus.in/api/notes/${studyInstanceUID}`, {
        method: 'POST',
        headers: {
            'Authorization': tokenHeader,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note_text: noteText })
      });

      if (!response.ok) throw new Error('Failed to save');
      const data = await response.json();
      setNoteText(data.note_text);
      setStatus('Saved');
      
      // Clear saved status after 3 seconds
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error(error);
      setStatus('Error saving');
    }
  };

  if (!studyInstanceUID) {
      return <div className="p-4 text-white">Please select a viewport to view notes.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-black text-white p-4">
      <div className="mb-2 font-bold text-lg">Study Notes</div>
      
      <textarea
        className="flex-grow w-full bg-gray-800 text-white p-2 rounded border border-gray-700 resize-none focus:outline-none focus:border-blue-500"
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        placeholder="Enter notes here..."
      />
      
      <div className="mt-4 flex items-center justify-between">
        <span className={`text-sm ${status === 'Error saving' || status === 'Error loading note' ? 'text-red-500' : 'text-green-500'}`}>
            {status}
        </span>
        <button
          onClick={saveNote}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition-colors disabled:opacity-50"
          disabled={status === 'Saving...' || status === 'Loading...'}
        >
          Save Note
        </button>
      </div>
    </div>
  );
};

PanelStudyNotes.propTypes = {
  servicesManager: PropTypes.object.isRequired,
  commandsManager: PropTypes.object.isRequired,
};

export default PanelStudyNotes;
