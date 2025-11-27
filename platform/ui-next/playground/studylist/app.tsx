import React from 'react';
import { ThemeWrapper } from '../../src/components/ThemeWrapper';
import data from './patient-studies.json';
import { StudyList, type StudyRow, type WorkflowId } from '../../src/components/StudyList';

export function App() {
  const handleLaunch = React.useCallback((study: StudyRow, workflow: WorkflowId) => {
    try {
      const target = `/studylist/launch?wf=${encodeURIComponent(String(workflow))}`;
      window.location.assign(target);
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
