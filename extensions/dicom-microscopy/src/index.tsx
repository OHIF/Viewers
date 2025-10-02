import { id } from './id';
import React, { Suspense, useMemo } from 'react';
import getPanelModule from './getPanelModule';
import getCommandsModule from './getCommandsModule';
import getCustomizationModule from './getCustomizationModule';
import { Types } from '@ohif/core';

import { useViewportGrid } from '@ohif/ui-next';
import getDicomMicroscopySRSopClassHandler from './DicomMicroscopySRSopClassHandler';
import getDicomMicroscopyANNSopClassHandler from './DicomMicroscopyANNSopClassHandler';
import MicroscopyService from './services/MicroscopyService';
import { useResizeDetector } from 'react-resize-detector';
import debounce from 'lodash.debounce';

const Component = React.lazy(() => {
  return import('./DicomMicroscopyViewport');
});

const MicroscopyViewport = props => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </Suspense>
  );
};

/**
 * You can remove any of the following modules if you don't need them.
 */
const extension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   * You ID can be anything you want, but it should be unique.
   */
  id,

  async preRegistration({ servicesManager }) {
    servicesManager.registerService(MicroscopyService.REGISTRATION(servicesManager));
  },

  /**
   * ViewportModule should provide a list of viewports that will be available in OHIF
   * for Modes to consume and use in the viewports. Each viewport is defined by
   * {name, component} object. Example of a viewport module is the CornerstoneViewport
   * that is provided by the Cornerstone extension in OHIF.
   */
  getViewportModule({ servicesManager }) {
    /**
     *
     * @param props {*}
     * @param props.displaySets
     * @param props.viewportId
     * @param props.viewportLabel
     * @param props.dataSource
     * @param props.viewportOptions
     * @param props.displaySetOptions
     * @returns
     */
    const ExtendedMicroscopyViewport = props => {
      const { viewportOptions } = props;

      const [viewportGrid, viewportGridService] = useViewportGrid();
      const { activeViewportId } = viewportGrid;

      const displaySetsKey = useMemo(() => {
        return props.displaySets.map(ds => ds.displaySetInstanceUID).join('-');
      }, [props.displaySets]);

      const onResize = debounce(() => {
        const { microscopyService } = servicesManager.services;
        const managedViewer = microscopyService.getAllManagedViewers();

        if (managedViewer && managedViewer.length > 0) {
          managedViewer[0].viewer.resize();
        }
      }, 100);

      const { ref: resizeRef } = useResizeDetector({
        onResize,
        handleHeight: true,
        handleWidth: true,
      });

      return (
        <MicroscopyViewport
          key={displaySetsKey}
          activeViewportId={activeViewportId}
          setViewportActive={(viewportId: string) => {
            viewportGridService.setActiveViewportId(viewportId);
          }}
          viewportData={viewportOptions}
          resizeRef={resizeRef}
          {...props}
        />
      );
    };

    return [
      {
        name: 'microscopy-dicom',
        component: ExtendedMicroscopyViewport,
      },
    ];
  },

  getToolbarModule({ servicesManager }) {
    return [
      {
        name: 'evaluate.microscopyTool',
        evaluate: ({ button }) => {
          const { microscopyService } = servicesManager.services;

          const activeInteractions = microscopyService.getActiveInteractions();
          if (!activeInteractions) {
            return false;
          }
          const isPrimaryActive = activeInteractions.find(interactions => {
            const sameMouseButton = interactions[1].bindings.mouseButtons.includes('left');

            if (!sameMouseButton) {
              return false;
            }

            const notDraw = interactions[0] !== 'draw';

            // there seems to be a custom logic for draw tool for some reason
            return notDraw
              ? interactions[0] === button.id
              : interactions[1].geometryType === button.id;
          });

          return {
            disabled: false,
            className: isPrimaryActive
              ? '!text-black bg-primary-light'
              : '!text-common-bright hover:!bg-primary-dark hover:!text-primary-light',
            // Todo: isActive right now is used for nested buttons where the primary
            // button needs to be fully rounded (vs partial rounded) when active
            // otherwise it does not have any other use
            isActive: isPrimaryActive,
          };
        },
      },
    ];
  },

  /**
   * SopClassHandlerModule should provide a list of sop class handlers that will be
   * available in OHIF for Modes to consume and use to create displaySets from Series.
   * Each sop class handler is defined by a { name, sopClassUids, getDisplaySetsFromSeries}.
   * Examples include the default sop class handler provided by the default extension
   */
  getSopClassHandlerModule(params) {
    return [
      getDicomMicroscopySRSopClassHandler(params),
      getDicomMicroscopyANNSopClassHandler(params),
    ];
  },

  getPanelModule,

  getCommandsModule,

  getCustomizationModule,
};

export default extension;
