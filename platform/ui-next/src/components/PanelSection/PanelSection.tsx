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
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  icon?: keyof typeof Icons;
}

export const PanelSection: React.FC<PanelSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  className,
  headerClassName,
  contentClassName,
  icon,
}) => {
  const IconComponent = icon ? Icons[icon] : null;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? 'item' : undefined}
      className={cn('overflow-hidden', className)}
    >
      <AccordionItem
        value="item"
        className="border-none"
      >
        <AccordionTrigger
          className={cn(
            'bg-secondary-dark hover:bg-accent text-aqua-pale',
            'my-0.5 flex h-7 w-full items-center justify-between rounded py-2 pr-1 pl-2.5 text-[13px]',
            headerClassName
          )}
        >
          <div className="flex items-center">
            {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
            <span>{title}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className={cn('overflow-hidden p-0', contentClassName)}>
          <div className="rounded-b">{children}</div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
