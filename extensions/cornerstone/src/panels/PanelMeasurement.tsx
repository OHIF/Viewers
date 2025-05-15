import React from 'react';

import { useMeasurements } from '../hooks/useMeasurements';
import StudyMeasurements from '../components/StudyMeasurements';
/**
 * The PanelMeasurement is a fairly simple wrapper that gets the filtered
 * measurements and then passes it on to the children component, default to
 * the StudyMeasurements sub-component if no children are specified.
 * Some example customizations that could work:
 *
 *
 * Creates a default study measurements panel with default children:
 * ```
 * <PanelMeasurement>
 *   <StudyMeasurements />
 * </PanelMeasurement>
 * ```
 *
 * A study measurements with body replacement
 * ```
 * <StudyMeasurements>
 *   <SeriesMeasurements />
 * </StudyMeasurements>
 * ```
 *
 * A study measurements replacing just the trigger, leaving the default body
 * ```
 * <StudyMeasurements>
 *    <AccordionGroup.Trigger>
 *        This is a new custom trigger
 *    </AccordionGroup.Trigger>
 *</StudyMeasurements>
 * ```
 *
 * A study measurements with the trigger and body replaced
 * ```
 * <StudyMeasurements>
 *    <AccordionGroup.Trigger>
 *        This is a new custom trigger
 *    </AccordionGroup.Trigger>
 *    <SeriesMeasurements />
 * </StudyMeasurements>
 * ```
 *
 * A study measurements with a custom header for the additional findings
 * ```
 * <StudyMeasurements>
 *    <MeasurementOrAdditionalFindings>
 *        <AccordionGroup.Trigger groupName="additionalFindings">
 *            <CustomAdditionalFindingsHeader />
 *        </AccordionGroup.Trigger>
 *        <AccordionGroup.Trigger groupName="measurements">
 *            <CustomMeasurementsHeader />
 *        </AccordionGroup.Trigger>
 *    </MeasurementOrAdditionalFindings>
 * </StudyMeasurements>
 *```
 */
export default function PanelMeasurement(props): React.ReactNode {
  const { measurementFilter, emptyComponent: EmptyComponent, children } = props;

  const displayMeasurements = useMeasurements({ measurementFilter });

  if (!displayMeasurements.length) {
    return EmptyComponent ? (
      <EmptyComponent items={displayMeasurements} />
    ) : (
      <span className="text-white">No Measurements</span>
    );
  }

  if (children) {
    const cloned = React.Children.map(children, child =>
      React.cloneElement(child, {
        items: displayMeasurements,
        filter: measurementFilter,
      })
    );
    return cloned;
  }
  // Need to merge defaults on the content props to ensure they get passed to children
  return <StudyMeasurements items={displayMeasurements} />;
}
