import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ohif/ui-next';

export function PanelAccordion({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full flex-shrink-0 overflow-hidden"
      defaultValue="item"
    >
      <AccordionItem
        value="item"
        className="w-full border-none"
      >
        <AccordionTrigger className="bg-secondary-dark hover:bg-accent text-aqua-pale my-0.5 flex w-full items-center justify-between rounded py-2 pr-1 pl-2.5 text-[13px]">
          {header}
        </AccordionTrigger>
        <AccordionContent className={'overflow-hidden p-0'}>
          <div className="rounded-b">{children}</div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
