import * as React from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../../src/components/Resizable';
import { Button } from '../../src/components/Button';
import { Icons } from '../../src/components/Icons';

type LayoutContextValue = {
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
};

const LayoutContext = React.createContext<LayoutContextValue | undefined>(undefined);

export function useStudylistLayout() {
  const ctx = React.useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useStudylistLayout must be used within <StudylistLayout.Root>');
  }
  return ctx;
}

type RootProps = {
  isPanelOpen: boolean;
  onIsPanelOpenChange: (open: boolean) => void;
  defaultPreviewSizePercent: number;
  minPreviewSizePercent?: number;
  children: React.ReactNode;
  className?: string;
};

function Root({
  isPanelOpen,
  onIsPanelOpenChange,
  defaultPreviewSizePercent,
  minPreviewSizePercent = 15,
  children,
  className,
}: RootProps) {
  const openPanel = React.useCallback(() => onIsPanelOpenChange(true), [onIsPanelOpenChange]);
  const closePanel = React.useCallback(() => onIsPanelOpenChange(false), [onIsPanelOpenChange]);

  const value = React.useMemo<LayoutContextValue>(
    () => ({ isPanelOpen, openPanel, closePanel }),
    [isPanelOpen, openPanel, closePanel]
  );

  const kids = React.Children.toArray(children) as React.ReactElement[];
  const tableChild = kids.find(c => (c as any)?.type === TableArea) as React.ReactElement | undefined;
  const previewChild = kids.find(c => (c as any)?.type === PreviewArea) as React.ReactElement | undefined;

  return (
    <LayoutContext.Provider value={value}>
      <ResizablePanelGroup direction="horizontal" className={className ?? 'h-full w-full'}>
        <ResizablePanel defaultSize={100 - defaultPreviewSizePercent}>
          {tableChild ? tableChild.props.children : null}
        </ResizablePanel>
        {isPanelOpen ? (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={defaultPreviewSizePercent} minSize={minPreviewSizePercent}>
              {previewChild ? previewChild.props.children : null}
            </ResizablePanel>
          </>
        ) : null}
      </ResizablePanelGroup>
    </LayoutContext.Provider>
  );
}

function TableArea({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function PreviewArea({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function OpenPreviewButton({
  className,
  'aria-label': ariaLabel = 'Open preview panel',
}: React.HTMLAttributes<HTMLButtonElement> & { 'aria-label'?: string }) {
  const { isPanelOpen, openPanel } = useStudylistLayout();
  if (isPanelOpen) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      onClick={openPanel}
      className={className}
    >
      <Icons.PanelRight
        aria-hidden="true"
        className="h-4 w-4"
      />
    </Button>
  );
}

export const StudylistLayout = Object.assign(Root, {
  Root,
  TableArea,
  PreviewArea,
  OpenPreviewButton,
});