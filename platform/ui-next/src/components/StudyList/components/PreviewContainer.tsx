import * as React from 'react';
import { ScrollArea } from '../../ScrollArea';
import { PreviewContent } from './PreviewContent';
import { PreviewHeader } from './PreviewHeader';

type PreviewContainerProps = {
  children: React.ReactNode;
};

function PreviewContainerRoot({ children }: PreviewContainerProps) {
  let header: React.ReactNode = null;
  let content: React.ReactNode = null;

  React.Children.forEach(children, child => {
    if (React.isValidElement(child)) {
      const childType = child.type;

      if (childType === PreviewHeader) {
        header = child;
      } else if (childType === PreviewContent) {
        if (content) {
          throw new Error('PreviewContainer can only contain one PreviewContent.');
        }
        content = child;
      } else {
        throw new Error('PreviewContainer can only contain PreviewHeader and PreviewContent.');
      }
    }
  });

  if (!content) {
    throw new Error('PreviewContainer must contain PreviewContent.');
  }

  return (
    <div className="bg-background relative flex h-full w-full flex-col">
      {header}
      <ScrollArea className="flex-1">
        <div
          className="px-3 pb-3"
          style={{ paddingTop: 'var(--panel-right-top-pad, 59px)' }}
        >
          {content}
        </div>
      </ScrollArea>
    </div>
  );
}

PreviewContainerRoot.displayName = 'PreviewContainer';

export const PreviewContainer = PreviewContainerRoot;
