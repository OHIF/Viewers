import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../Accordion/Accordion';
import { cn } from '../../lib/utils';
import { Icons } from '../Icons/Icons';

interface PanelSectionProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

interface PanelSectionHeaderProps {
  children: React.ReactNode;
  className?: string;
  showChevron?: boolean;
}

interface PanelSectionContentProps {
  children: React.ReactNode;
  className?: string;
}

export const PanelSection: React.FC<PanelSectionProps> & {
  Header: React.FC<PanelSectionHeaderProps>;
  Content: React.FC<PanelSectionContentProps>;
} = ({ children, defaultOpen = true, className, ...props }) => {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? 'item' : undefined}
      className={cn('flex-shrink-0 overflow-hidden', className)}
      {...props}
    >
      <AccordionItem
        value="item"
        className="border-none"
      >
        {children}
      </AccordionItem>
    </Accordion>
  );
};

PanelSection.Header = ({ children, className }) => (
  <AccordionTrigger
    className={cn(
      'bg-secondary-dark hover:bg-accent text-aqua-pale',
      'my-0.5 flex h-7 w-full items-center justify-between rounded py-2 pr-1 pl-2.5 text-[13px]',
      className
    )}
  >
    {children}
  </AccordionTrigger>
);

PanelSection.Header.displayName = 'PanelSection.Header';

PanelSection.Content = ({ children, className }) => (
  <AccordionContent className={cn('overflow-hidden p-0', className)}>
    <div className="rounded-b">{children}</div>
  </AccordionContent>
);

PanelSection.Content.displayName = 'PanelSection.Content';
