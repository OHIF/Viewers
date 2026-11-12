import { CustomDropdownMenuContent } from './CustomDropdownMenuContent';
import { CustomSegmentStatisticsHeader } from './CustomSegmentStatisticsHeader';
import SegmentationToolConfig from '../components/SegmentationToolConfig';
import React from 'react';
import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';

export default function getSegmentationPanelCustomization({ commandsManager, servicesManager }) {
  const { segmentationService } = servicesManager.services;

  let contourRenderFillChangedGlobally = false;

  // Listen to when the global CONTOUR type renderFill style property is changed.
  const { unsubscribe } = segmentationService.subscribe(
    segmentationService.EVENTS.SEGMENTATION_STYLE_MODIFIED,
    ({ specifier, style }) => {
      if (
        specifier.type === SegmentationRepresentations.Contour &&
        specifier.segmentationId == null &&
        specifier.viewportId == null &&
        style.renderFill != null
      ) {
        unsubscribe();
        contourRenderFillChangedGlobally = true;
      }
    }
  );

  return {
    'panelSegmentation.customDropdownMenuContent': CustomDropdownMenuContent,
    'panelSegmentation.customSegmentStatisticsHeader': CustomSegmentStatisticsHeader,
    'panelSegmentation.disableEditing': false,
    'panelSegmentation.showAddSegment': true,
    'panelSegmentation.onSegmentationAdd': async ({
      segmentationRepresentationType = SegmentationRepresentations.Labelmap,
    }) => {
      const { viewportGridService } = servicesManager.services;
      const viewportId = viewportGridService.getState().activeViewportId;
      if (segmentationRepresentationType === SegmentationRepresentations.Labelmap) {
        commandsManager.run('createLabelmapForViewport', { viewportId });
      } else if (segmentationRepresentationType === SegmentationRepresentations.Contour) {
        const segmentationId = await commandsManager.run('createContourForViewport', {
          viewportId,
        });
        // Override the default (i.e. hydrated RTSTRUCT) style for contours if the global CONTOUR type
        // renderFill style property has not been changed.
        if (!contourRenderFillChangedGlobally) {
          segmentationService.setStyle(
            { segmentationId, type: SegmentationRepresentations.Contour },
            {
              renderFill: true,
              renderFillInactive: true,
            },
            // Do not merge so that these created contours inherit other type-specific style properties like the fill alpha.
            // Merging would otherwise permanently inherit the fill alpha and any inheritance from the type level would be lost.
            false
          );
        }

        // If the global CONTOUR type renderFill style property is already set, do not subscribe to the SEGMENTATION_STYLE_MODIFIED event.
        if (contourRenderFillChangedGlobally) {
          return;
        }

        // Subscribe to the SEGMENTATION_STYLE_MODIFIED event to listen for changes to the CONTOUR type renderFill style property.
        const { unsubscribe } = segmentationService.subscribe(
          segmentationService.EVENTS.SEGMENTATION_STYLE_MODIFIED,
          ({ specifier, style }) => {
            if (
              specifier.type === SegmentationRepresentations.Contour &&
              specifier.segmentationId == null &&
              specifier.viewportId == null &&
              style.renderFill != null
            ) {
              // We are here because the renderFill style property is globally being changed for ALL contours.
              // When this occurs, the desire is for ALL contours to inherit the property. To make this happen,
              // we have to clear the style property that was set for this specific segmentation
              // when it was created above.
              // We can now also unsubscribe because this change only needs to be made when the global CONTOUR type
              // renderFill style property is first changed.

              contourRenderFillChangedGlobally = true;
              unsubscribe();
              segmentationService.setStyle(
                { segmentationId, type: SegmentationRepresentations.Contour },
                {},
                false
              );
            }
          }
        );
      }
    },
    'panelSegmentation.tableMode': 'collapsed',
    'panelSegmentation.readableText': {
      // the values will appear in this order
      min: 'Min Value',
      minLPS: 'Min Coord',
      max: 'Max Value',
      maxLPS: 'Max Coord',
      mean: 'Mean Value',
      stdDev: 'Standard Deviation',
      count: 'Voxel Count',
      median: 'Median',
      skewness: 'Skewness',
      kurtosis: 'Kurtosis',
      peakValue: 'Peak Value',
      peakLPS: 'Peak Coord',
      volume: 'Volume',
      lesionGlycolysis: 'Lesion Glycolysis',
      center: 'Center',
    },
    'labelMapSegmentationToolbox.config': () => {
      return <SegmentationToolConfig />;
    },
    'contourSegmentationToolbox.config': () => {
      return <SegmentationToolConfig />;
    },
  };
}
