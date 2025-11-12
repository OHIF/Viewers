import * as React from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../../Resizable';
import { Button } from '../../Button';
import { Icons } from '../../Icons';

type LayoutContextValue = {
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
};

const LayoutContext = React.createContext<LayoutContextValue | undefined>(undefined);

export function useStudyListLayout() {
  const ctx = React.useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useStudyListLayout must be used within <StudyListLayout>');
  }
  return ctx;
}

type RootProps = {
  isPanelOpen: boolean;
  onIsPanelOpenChange: (open: boolean) => void;
  defaultPreviewSizePercent: number;
  minPreviewSizePercent?: number;
  table?: React.ReactNode;
  preview?: React.ReactNode;
  className?: string;
};

function StudyListLayoutComponent({
  isPanelOpen,
  onIsPanelOpenChange,
  defaultPreviewSizePercent,
  minPreviewSizePercent = 15,
  table,
  preview,
  className,
}: RootProps) {
  const openPanel = React.useCallback(() => onIsPanelOpenChange(true), [onIsPanelOpenChange]);
  const closePanel = React.useCallback(() => onIsPanelOpenChange(false), [onIsPanelOpenChange]);

  const value = React.useMemo<LayoutContextValue>(
    () => ({ isPanelOpen, openPanel, closePanel }),
    [isPanelOpen, openPanel, closePanel]
  );

  return (
    <LayoutContext.Provider value={value}>
      <ResizablePanelGroup direction="horizontal" className={className ?? 'h-full w-full'}>
        <ResizablePanel defaultSize={100 - defaultPreviewSizePercent}>
          {table ?? null}
        </ResizablePanel>
        {isPanelOpen ? (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={defaultPreviewSizePercent} minSize={minPreviewSizePercent}>
              {preview ?? null}
            </ResizablePanel>
          </>
        ) : null}
      </ResizablePanelGroup>
    </LayoutContext.Provider>
  );
}

function OpenPreviewButton({
  className,
  'aria-label': ariaLabel = 'Open preview panel',
}: React.HTMLAttributes<HTMLButtonElement> & { 'aria-label'?: string }) {
  const { isPanelOpen, openPanel } = useStudyListLayout();
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

StudyListLayoutComponent.displayName = 'StudyListLayout';
export const StudyListLayout = Object.assign(StudyListLayoutComponent, { OpenPreviewButton });
