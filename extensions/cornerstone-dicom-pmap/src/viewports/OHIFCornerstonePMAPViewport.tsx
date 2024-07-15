import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import { useViewportGrid } from '@ohif/ui';
import createPMAPToolGroupAndAddTools from '../utils/initPMAPToolGroup';

const PMAP_TOOLGROUP_BASE_NAME = 'PMAPToolGroup';

function OHIFCornerstonePMAPViewport(props: withAppTypes) {
  const { displaySets, viewportOptions, displaySetOptions, servicesManager, extensionManager } =
    props;
  const viewportId = viewportOptions.viewportId;
  const { displaySetService, toolGroupService, customizationService } = servicesManager.services;
  const toolGroupId = `${PMAP_TOOLGROUP_BASE_NAME}-${viewportId}`;

  // PMAP viewport will always have a single display set
  if (displaySets.length !== 1) {
    throw new Error('PMAP viewport must have a single display set');
  }

  const pmapDisplaySet = displaySets[0];
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const referencedDisplaySetRef = useRef(null);
  const { viewports, activeViewportId } = viewportGrid;
  const referencedDisplaySet = pmapDisplaySet.getReferenceDisplaySet();
  const referencedDisplaySetMetadata = _getReferencedDisplaySetMetadata(
    referencedDisplaySet,
    pmapDisplaySet
  );

  referencedDisplaySetRef.current = {
    displaySet: referencedDisplaySet,
    metadata: referencedDisplaySetMetadata,
  };

  const getCornerstoneViewport = useCallback(() => {
    const { displaySet: referencedDisplaySet } = referencedDisplaySetRef.current;
    const { component: Component } = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    );

    displaySetOptions.unshift({});
    const [pmapDisplaySetOptions] = displaySetOptions;

    // Make sure `options` exists
    pmapDisplaySetOptions.options = pmapDisplaySetOptions.options ?? {};

    Object.assign(pmapDisplaySetOptions.options, {
      colormap: {
        name: 'rainbow',
        opacity: [
          { value: 0, opacity: 0.5 },
          { value: 1, opacity: 1 },
        ],
      },
    });

    return (
      <Component
        {...props}
        // Referenced + PMAP displaySets must be passed as parameter in this order
        displaySets={[referencedDisplaySet, pmapDisplaySet]}
        viewportOptions={{
          viewportType: 'volume',
          toolGroupId: toolGroupId,
          orientation: viewportOptions.orientation,
          viewportId: viewportOptions.viewportId,
        }}
        displaySetOptions={[{}, pmapDisplaySetOptions]}
      ></Component>
    );
  }, [
    extensionManager,
    displaySetOptions,
    props,
    pmapDisplaySet,
    toolGroupId,
    viewportOptions.orientation,
    viewportOptions.viewportId,
  ]);

  // Cleanup the PMAP viewport when the viewport is destroyed
  useEffect(() => {
    const onDisplaySetsRemovedSubscription = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_REMOVED,
      ({ displaySetInstanceUIDs }) => {
        const activeViewport = viewports.get(activeViewportId);
        if (displaySetInstanceUIDs.includes(activeViewport.displaySetInstanceUID)) {
          viewportGridService.setDisplaySetsForViewport({
            viewportId: activeViewportId,
            displaySetInstanceUIDs: [],
          });
        }
      }
    );

    return () => {
      onDisplaySetsRemovedSubscription.unsubscribe();
    };
  }, [activeViewportId, displaySetService, viewportGridService, viewports]);

  useEffect(() => {
    let toolGroup = toolGroupService.getToolGroup(toolGroupId);

    if (toolGroup) {
      return;
    }

    // This creates a custom tool group which has the lifetime of this view only
    toolGroup = createPMAPToolGroupAndAddTools(toolGroupService, customizationService, toolGroupId);

    return () => toolGroupService.destroyToolGroup(toolGroupId);
  }, [customizationService, toolGroupId, toolGroupService]);

  return (
    <>
      <div className="relative flex h-full w-full flex-row overflow-hidden">
        {getCornerstoneViewport()}
      </div>
    </>
  );
}

OHIFCornerstonePMAPViewport.propTypes = {
  displaySets: PropTypes.arrayOf(PropTypes.object),
  viewportId: PropTypes.string.isRequired,
  dataSource: PropTypes.object,
  children: PropTypes.node,
};

function _getReferencedDisplaySetMetadata(referencedDisplaySet, pmapDisplaySet) {
  const { SharedFunctionalGroupsSequence } = pmapDisplaySet.instance;

  const SharedFunctionalGroup = Array.isArray(SharedFunctionalGroupsSequence)
    ? SharedFunctionalGroupsSequence[0]
    : SharedFunctionalGroupsSequence;

  const { PixelMeasuresSequence } = SharedFunctionalGroup;

  const PixelMeasures = Array.isArray(PixelMeasuresSequence)
    ? PixelMeasuresSequence[0]
    : PixelMeasuresSequence;

  const { SpacingBetweenSlices, SliceThickness } = PixelMeasures;

  const image0 = referencedDisplaySet.images[0];
  const referencedDisplaySetMetadata = {
    PatientID: image0.PatientID,
    PatientName: image0.PatientName,
    PatientSex: image0.PatientSex,
    PatientAge: image0.PatientAge,
    SliceThickness: image0.SliceThickness || SliceThickness,
    StudyDate: image0.StudyDate,
    SeriesDescription: image0.SeriesDescription,
    SeriesInstanceUID: image0.SeriesInstanceUID,
    SeriesNumber: image0.SeriesNumber,
    ManufacturerModelName: image0.ManufacturerModelName,
    SpacingBetweenSlices: image0.SpacingBetweenSlices || SpacingBetweenSlices,
  };

  return referencedDisplaySetMetadata;
}

export default OHIFCornerstonePMAPViewport;
