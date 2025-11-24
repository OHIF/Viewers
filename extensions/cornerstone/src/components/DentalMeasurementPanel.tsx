import React from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import {
  PanelMeasurement,
  StudyMeasurements,
  MeasurementsOrAdditionalFindings,
  StudyMeasurementsActions,
  StudySummaryFromMetadata,
  AccordionGroup,
} from '@ohif/extension-cornerstone';

/**
 * DentalMeasurementPanel - Custom panel for dental mode with JSON export button
 * This wraps the standard measurement panel and adds a dedicated JSON export button below the measurements
 */
export function DentalMeasurementPanel(props) {
  const { commandsManager, servicesManager } = useSystem();
  const { measurementService } = servicesManager.services;

  // Since this is DentalMeasurementPanel, always show JSON export
  // This component is specifically used in dental mode context
  const isDentalMode = true;

  // Track measurements reactively
  const [hasExportableMeasurements, setHasExportableMeasurements] = React.useState(() => {
    const measurements = measurementService.getMeasurements();
    return measurements && measurements.length > 0;
  });

  React.useEffect(() => {
    const updateMeasurements = () => {
      const measurements = measurementService.getMeasurements();
      setHasExportableMeasurements(measurements && measurements.length > 0);
    };

    // Subscribe to measurement events
    const subscriptions = [
      measurementService.subscribe(measurementService.EVENTS.MEASUREMENT_ADDED, updateMeasurements),
      measurementService.subscribe(
        measurementService.EVENTS.MEASUREMENT_REMOVED,
        updateMeasurements
      ),
      measurementService.subscribe(
        measurementService.EVENTS.MEASUREMENTS_CLEARED,
        updateMeasurements
      ),
    ];

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [measurementService]);

  const handleJSONExport = () => {
    if (!hasExportableMeasurements) {
      return;
    }

    commandsManager.runCommand('downloadJSONMeasurementsReport', {
      measurementFilter: () => true, // Export all measurements in dental mode
    });
  };

  return (
    <div className="flex flex-col">
      {/* Standard Measurement Panel with Dropdown Actions */}
      <PanelMeasurement {...props}>
        <StudyMeasurements>
          <AccordionGroup.Trigger>
            <StudySummaryFromMetadata />
          </AccordionGroup.Trigger>
          <MeasurementsOrAdditionalFindings customHeader={StudyMeasurementsActions} />
        </StudyMeasurements>
      </PanelMeasurement>

      {/* JSON Export Section - Only for Dental Mode */}
      {isDentalMode && hasExportableMeasurements && (
        <div className="bg-secondary/50 border-secondary mt-3 rounded-lg border p-3">
          <div className="mb-3">
            <h4 className="text-foreground flex items-center text-sm font-semibold">
              <Icons.Export className="mr-2 h-4 w-4" />
              JSON Export
            </h4>
            <p className="text-muted-foreground text-xs">
              Export all measurements as structured JSON data for advanced dental analysis
            </p>
          </div>
          <Button
            size="sm"
            variant="default"
            className="w-full"
            onClick={handleJSONExport}
            disabled={!hasExportableMeasurements}
          >
            <Icons.Download className="mr-2 h-4 w-4" />
            Export JSON Report
          </Button>
          <p className="text-muted-foreground mt-2 text-xs">
            JSON format includes measurement metadata and full object data
          </p>
        </div>
      )}
    </div>
  );
}

export default DentalMeasurementPanel;
