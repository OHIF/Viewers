import * as React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../../Resizable';
import { Button } from '../../Button';
import { Icons } from '../../Icons';

type LayoutContextValue = {
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  defaultPreviewSizePercent: number;
  minPreviewSizePercent: number;
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
  className?: string;
  children?: React.ReactNode;
};

function StudyListLayoutComponent({
  isPanelOpen,
  onIsPanelOpenChange,
  defaultPreviewSizePercent,
  minPreviewSizePercent = 15,
  className,
  children,
}: RootProps) {
  const openPanel = React.useCallback(() => onIsPanelOpenChange(true), [onIsPanelOpenChange]);
  const closePanel = React.useCallback(() => onIsPanelOpenChange(false), [onIsPanelOpenChange]);

  const value = React.useMemo<LayoutContextValue>(
    () => ({
      isPanelOpen,
      openPanel,
      closePanel,
      defaultPreviewSizePercent,
      minPreviewSizePercent,
    }),
    [isPanelOpen, openPanel, closePanel, defaultPreviewSizePercent, minPreviewSizePercent]
  );

  return (
    <LayoutContext.Provider value={value}>
      <ResizablePanelGroup
        direction="horizontal"
        className={className ?? 'h-full w-full'}
      >
        {children}
      </ResizablePanelGroup>
    </LayoutContext.Provider>
  );
}

function Table({ children }: { children?: React.ReactNode }) {
  const { defaultPreviewSizePercent } = useStudyListLayout();
  return <ResizablePanel defaultSize={100 - defaultPreviewSizePercent}>{children}</ResizablePanel>;
}

function Handle() {
  return <ResizableHandle />;
}

function Preview({
  minSizePercent,
  defaultSizePercent,
  children,
}: {
  minSizePercent?: number;
  defaultSizePercent?: number;
  children?: React.ReactNode;
}) {
  const { isPanelOpen, defaultPreviewSizePercent, minPreviewSizePercent } = useStudyListLayout();
  if (!isPanelOpen) {
    return null;
  }
  return (
    <>
      <Handle />
      <ResizablePanel
        defaultSize={defaultSizePercent ?? defaultPreviewSizePercent}
        minSize={minSizePercent ?? minPreviewSizePercent}
      >
        {children}
      </ResizablePanel>
    </>
  );
}

function OpenPreviewButton({
  className,
  'aria-label': ariaLabel = 'Open preview panel',
}: React.HTMLAttributes<HTMLButtonElement> & { 'aria-label'?: string }) {
  const { isPanelOpen, openPanel } = useStudyListLayout();
  if (isPanelOpen) {
    return null;
  }
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

function ClosePreviewButton({
  className,
  'aria-label': ariaLabel = 'Close preview panel',
}: React.HTMLAttributes<HTMLButtonElement> & { 'aria-label'?: string }) {
  const { isPanelOpen, closePanel } = useStudyListLayout();
  if (!isPanelOpen) {
    return null;
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={ariaLabel}
      onClick={closePanel}
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
export const StudyListLayout = Object.assign(StudyListLayoutComponent, {
  Table,
  Preview,
  OpenPreviewButton,
  ClosePreviewButton,
  Handle,
});
