import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeWrapper } from '../src/components/ThemeWrapper';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../src/components/Resizable';
import { ScrollArea } from '../src/components/ScrollArea';

const App = () => (
  <ThemeWrapper>
    <div className="h-screen w-screen overflow-hidden bg-black">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full w-full"
      >
        {/* Main Area */}
        <ResizablePanel defaultSize={70}>
          <div className="flex h-full w-full items-center justify-center text-white">
            Main Content
          </div>
        </ResizablePanel>

        {/* Drag Handle */}
        <ResizableHandle />

        {/* Right Resizable Panel */}
        <ResizablePanel
          defaultSize={30}
          minSize={15}
        >
          <div className="bg-bkg-low flex h-full w-full flex-col">
            <div className="bg-bkg-med text-primary flex h-10 items-center px-3 text-sm">
              Right Panel
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 text-sm text-white/80">Placeholder content</div>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  </ThemeWrapper>
);

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);
