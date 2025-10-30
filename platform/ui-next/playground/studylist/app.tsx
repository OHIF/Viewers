import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeWrapper } from '../../src/components/ThemeWrapper';
import data from './patient-studies.json';
import { StudyList, type StudyRow, type WorkflowId } from '../../StudyList';

export function App() {
  const handleLaunch = React.useCallback((study: StudyRow, workflow: WorkflowId) => {
    try {
      // eslint-disable-next-line no-console
      console.log('Launch workflow:', workflow, { study });
    } catch {}
  }, []);

  return (
    <ThemeWrapper>
      <div className="h-screen w-screen overflow-hidden bg-black">
        <StudyList data={data as unknown as StudyRow[]} onLaunch={handleLaunch} />
      </div>
    </ThemeWrapper>
  );
}

// In case this file is mounted directly (dev convenience)
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
