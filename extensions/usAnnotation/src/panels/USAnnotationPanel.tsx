import React from 'react';
import { useMeasurements } from '@ohif/extension-cornerstone';
import { Button } from '@ohif/ui-next';
import { UltrasoundAnnotationTool } from '@cornerstonejs/tools';

export function USAnnotationPanel(props) {
  const { commandsManager } = props;
  const measurementFilter = measurements => measurements.someFilter;

  const measurements = useMeasurements({
    measurementFilter,
  });

  const handlers = {
    addNewBLineAnnotation: () => {
      commandsManager.runCommand('switchUSAnnotation', {
        annotationType: UltrasoundAnnotationTool.USAnnotationType.BLINE,
      });
    },
    addNewPleuraAnnotation: () => {
      commandsManager.runCommand('switchUSAnnotation', {
        annotationType: UltrasoundAnnotationTool.USAnnotationType.PLEURA,
      });
    },
    deleteLastPleuraAnnotation: () => {
      commandsManager.runCommand('deleteLastAnnotation', {
        annotationType: UltrasoundAnnotationTool.USAnnotationType.PLEURA,
      });
    },
    deleteLastBLineAnnotation: () => {
      commandsManager.runCommand('deleteLastAnnotation', {
        annotationType: UltrasoundAnnotationTool.USAnnotationType.BLINE,
      });
    },
  };

  return (
    <div>
      <Button variant="ghost" onClick={handlers.addNewBLineAnnotation} style={{ width: '100%' }}>
        {' '}
        Add new b-line Annotation{' '}
      </Button>
      <Button variant="ghost" onClick={handlers.addNewPleuraAnnotation} style={{ width: '100%' }}>
        {' '}
        Add new pleura Annotation{' '}
      </Button>
      <Button
        variant="ghost"
        onClick={handlers.deleteLastPleuraAnnotation}
        style={{ width: '100%' }}
      >
        Delete last pleura annotation
      </Button>
      <Button
        variant="ghost"
        onClick={handlers.deleteLastBLineAnnotation}
        style={{ width: '100%' }}
      >
        Delete last b-line Annotation
      </Button>
      {measurements.map(measurement => (
        <div key={measurement.uid}>
          <span>{measurement.label}</span>
          <div>
            {measurement.displayText.primary.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
