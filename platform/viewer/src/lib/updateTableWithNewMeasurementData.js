import OHIF from "@ohif/core";
import cornerstone from "cornerstone-core";

export default function updateTableWithNewMeasurementData({
  toolType,
  measurementNumber,
  location,
  description
}) {
  // Update all measurements by measurement number
  const measurementApi = OHIF.measurements.MeasurementApi.Instance;
  const measurements = measurementApi.tools[toolType].filter(
    m => m.measurementNumber === measurementNumber
  );

  measurements.forEach(measurement => {
    measurement.location = location;
    measurement.description = description;

    measurementApi.updateMeasurement(measurement.toolType, measurement);
  });

  measurementApi.syncMeasurementsAndToolData();

  // Update images in all active viewports
  cornerstone.getEnabledElements().forEach(enabledElement => {
    cornerstone.updateImage(enabledElement.element);
  });
}
