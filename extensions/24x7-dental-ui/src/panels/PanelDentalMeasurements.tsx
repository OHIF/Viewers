import React, { useCallback } from 'react';
import { useSystem } from '@ohif/core';
import { MeasurementTable, ScrollArea } from '@ohif/ui-next';
import {
  PanelMeasurement,
  StudyMeasurements,
  StudySummaryFromMetadata,
  AccordionGroup,
  StudyMeasurementsActions,
  MeasurementsOrAdditionalFindings,
} from '@ohif/extension-cornerstone';
import { AccordionTrigger } from '@ohif/ui-next';

/** Tool names that belong to the Dental Tools set */
export const DENTAL_TOOL_NAMES = new Set(['PALength', 'CanalAngle', 'CrownWidth', 'RootLength']);

// ── Main panel ─────────────────────────────────────────────────────────────────

function PanelDentalMeasurements(props: any) {
  const { servicesManager } = useSystem();
  const { measurementService } = servicesManager.services;

  const measurementFilter = useCallback(
    (measurement: any) => DENTAL_TOOL_NAMES.has(measurement.toolName),
    []
  );

  const EmptyComponent = () => (
    <div data-cy="dentalMeasurements-panel">
      <MeasurementTable title="Dental Measurements" isExpanded={false}>
        <MeasurementTable.Body />
      </MeasurementTable>
    </div>
  );

  const actions = {
    createSR: undefined,
    onDelete: () => {
      if (measurementService) {
        measurementService
          .getMeasurements()
          .filter(m => DENTAL_TOOL_NAMES.has(m.toolName))
          .forEach(m => measurementService.remove(m.uid));
      }
    },
  };

  const Header = (headerProps: any) => (
    <AccordionTrigger asChild={true} className="px-0">
      <div data-cy="DentalMeasurementsHeader">
        <StudySummaryFromMetadata {...headerProps} actions={actions} />
      </div>
    </AccordionTrigger>
  );

  return (
    <ScrollArea className="h-full">
      <div data-cy="dentalMeasurements-panel">
        <PanelMeasurement
          measurementFilter={measurementFilter}
          emptyComponent={EmptyComponent}
          sourceChildren={props.children}
        >
          <StudyMeasurements grouping={props.grouping}>
            <AccordionGroup.Trigger key="dentalMeasurementsHeader" asChild={true}>
              <Header key="dentalHeadChild" />
            </AccordionGroup.Trigger>
            <MeasurementsOrAdditionalFindings
              key="dentalMeasurementsOrAdditionalFindings"
              measurementFilter={measurementFilter}
              customHeader={StudyMeasurementsActions}
              actions={actions}
            />
          </StudyMeasurements>
        </PanelMeasurement>
      </div>
    </ScrollArea>
  );
}

export default PanelDentalMeasurements;
