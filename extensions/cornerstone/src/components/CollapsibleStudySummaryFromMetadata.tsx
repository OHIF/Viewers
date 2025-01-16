import React from 'react';
import { DicomMetadataStore, utils } from '@ohif/core';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  StudySummary,
} from '@ohif/ui-next';

const { formatDate } = utils;

export function CollapsibleStudySummaryFromMetadata({
  StudyInstanceUID,
  children,
}: {
  StudyInstanceUID: string;
  children: React.ReactNode;
}) {
  if (!StudyInstanceUID) {
    return null;
  }
  const studyMeta = DicomMetadataStore.getStudy(StudyInstanceUID);
  if (!studyMeta?.series?.length) {
    return null;
  }

  const instanceMeta = studyMeta.series[0].instances[0];
  const { StudyDate, StudyDescription } = instanceMeta;

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
          <StudySummary
            date={formatDate(StudyDate)}
            description={StudyDescription}
          />
        </AccordionTrigger>
        <AccordionContent className={'overflow-hidden p-0'}>
          <div className="rounded-b">{children}</div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
