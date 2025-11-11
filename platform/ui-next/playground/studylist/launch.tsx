import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeWrapper } from '../../src/components/ThemeWrapper';
import { Button } from '../../src/components/Button';

function useWorkflowName() {
  const params = new URLSearchParams(window.location.search);
  const wf = params.get('wf') || '';
  return wf;
}

function LaunchPage() {
  const wf = useWorkflowName();
  const label = (wf || 'unknown').toString();
  const display = label.toLowerCase();

  return (
    <ThemeWrapper>
      <div className="h-screen w-screen overflow-hidden bg-black">
        <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-foreground m-0 text-2xl font-medium">{display}</h1>
            <Button
              variant="ghost"
              onClick={() => {
                window.location.assign('/studylist');
              }}
            >
              Back to Study List
            </Button>
          </div>
          <div className="text-muted-foreground">This is a placeholder page for the Viewer.</div>
        </div>
      </div>
    </ThemeWrapper>
  );
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}
createRoot(container).render(<LaunchPage />);
