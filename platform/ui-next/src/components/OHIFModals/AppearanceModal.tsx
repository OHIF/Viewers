import * as React from 'react';
import { cn } from '../../lib/utils';

interface AppearanceModalProps {
  children: React.ReactNode;
  className?: string;
}

export function AppearanceModal({ children, className }: AppearanceModalProps) {
  return (
    <div className={cn('flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden', className)}>
      {children}
    </div>
  );
}

interface BodyProps {
  children: React.ReactNode;
  className?: string;
}
function Body({ children, className }: BodyProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto', className)}>
      <div className={cn('mt-1 mb-4 flex flex-col space-y-4', className)}>{children}</div>
    </div>
  );
}

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}
function SectionLabel({ children, className }: SectionLabelProps) {
  return <span className={cn('text-muted-foreground text-lg', className)}>{children}</span>;
}

AppearanceModal.Body = Body;
AppearanceModal.SectionLabel = SectionLabel;
