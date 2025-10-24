import React from 'react';
import { Summary } from './panel-summary';

export function PanelDefault() {
  return (
    <Summary>
      <Summary.Patient />
      <Summary.Workflows />
    </Summary>
  );
}
