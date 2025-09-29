import React from 'react';

export type StudyRow = {
  patient: string;
  mrn: string;
  studyDateTime: string;
  modalities: string;
  description: string;
  accession: string;
  instances: number;
};

export function PanelContent({
  study,
  layout,
}: {
  study: StudyRow;
  layout: 'right' | 'bottom';
}) {
  // Full layout can diverge per layout; for now text only
  return <div>Study Data Preview here</div>;
}

