import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeWrapper } from '../src/components/ThemeWrapper';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../src/components/Resizable';
import { ScrollArea } from '../src/components/ScrollArea';
import { Button } from '../src/components/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../src/components/Table';
import data from './patient-studies.json';

const App = () => {
  const [layout, setLayout] = React.useState<'right' | 'bottom'>('right');

  return (
    <ThemeWrapper>
      <div className="h-screen w-screen overflow-hidden bg-black">
        <ResizablePanelGroup
          direction={layout === 'right' ? 'horizontal' : 'vertical'}
          className="h-full w-full"
        >
          {/* Main Area */}
          <ResizablePanel defaultSize={70}>
            <div className="flex h-full w-full flex-col p-3">
              <h1 className="text-foreground mb-4 text-2xl font-medium">Study List</h1>
              {layout === 'bottom' ? (
                <ScrollArea className="flex-1">
                  <div className="bg-background rounded-md p-2">
                    <Table className="min-w-[1000px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>MRN</TableHead>
                          <TableHead>Study Date and Time</TableHead>
                          <TableHead>Modalities</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Accession Number</TableHead>
                          <TableHead className="text-right">Instances</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="whitespace-nowrap">{row.patient}</TableCell>
                            <TableCell className="whitespace-nowrap">{row.mrn}</TableCell>
                            <TableCell className="whitespace-nowrap">{row.studyDateTime}</TableCell>
                            <TableCell className="whitespace-nowrap">{row.modalities}</TableCell>
                            <TableCell>{row.description}</TableCell>
                            <TableCell className="whitespace-nowrap">{row.accession}</TableCell>
                            <TableCell className="text-right">{row.instances}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              ) : (
                <div className="bg-background rounded-md p-2">
                  <Table className="min-w-[1000px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>MRN</TableHead>
                        <TableHead>Study Date and Time</TableHead>
                        <TableHead>Modalities</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Accession Number</TableHead>
                        <TableHead className="text-right">Instances</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="whitespace-nowrap">{row.patient}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.mrn}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.studyDateTime}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.modalities}</TableCell>
                          <TableCell>{row.description}</TableCell>
                          <TableCell className="whitespace-nowrap">{row.accession}</TableCell>
                          <TableCell className="text-right">{row.instances}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </ResizablePanel>

          {/* Drag Handle */}
          <ResizableHandle />

          {/* Secondary Panel (Right or Bottom) */}
          <ResizablePanel defaultSize={30} minSize={15}>
            <div className="bg-background flex h-full w-full flex-col">
              <div className="bg-background text-primary flex h-10 items-center justify-between px-3 text-sm">
                <span>{layout === 'right' ? 'Right Panel' : 'Bottom Panel'}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLayout(layout === 'right' ? 'bottom' : 'right')}
                >
                  {layout === 'right' ? 'Move to Bottom' : 'Move to Right'}
                </Button>
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
};

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<App />);
