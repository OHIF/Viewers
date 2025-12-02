import * as React from 'react';
import { PatientSummary } from './PatientSummary';

export function PreviewPanelEmpty() {
  return (
    <PatientSummary>
      <PatientSummary.Patient />
      <PatientSummary.Workflows />
    </PatientSummary>
  );
}
