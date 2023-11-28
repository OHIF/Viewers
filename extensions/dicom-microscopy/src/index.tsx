import { id } from './id';
import React, { Suspense, useMemo } from 'react';
import getPanelModule from './getPanelModule';
import getCommandsModule from './getCommandsModule';

import { useViewportGrid } from '@ohif/ui';
import getDicomMicroscopySopClassHandler from './DicomMicroscopySopClassHandler';
import getDicomMicroscopySRSopClassHandler from './DicomMicroscopySRSopClassHandler';
import MicroscopyService from './services/MicroscopyService';

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
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   * You ID can be anything you want, but it should be unique.
   */
  id,

  async preRegistration({ servicesManager, commandsManager, configuration = {}, appConfig }) {
    servicesManager.registerService(MicroscopyService.REGISTRATION(servicesManager));
  },

  /**
   * ViewportModule should provide a list of viewports that will be available in OHIF
   * for Modes to consume and use in the viewports. Each viewport is defined by
   * {name, component} object. Example of a viewport module is the CornerstoneViewport
   * that is provided by the Cornerstone extension in OHIF.
   */
  getViewportModule({ servicesManager, extensionManager, commandsManager }) {
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

      // a unique identifier based on the contents of displaySets.
      // since we changed our rendering pipeline and if there is no
      // element size change nor viewportId change we won't re-render
      // we need a way to force re-rendering when displaySets change.
      const displaySetsKey = useMemo(() => {
        return props.displaySets.map(ds => ds.displaySetInstanceUID).join('-');
      }, [props.displaySets]);

      return (
        <MicroscopyViewport
          key={displaySetsKey}
          servicesManager={servicesManager}
          extensionManager={extensionManager}
          commandsManager={commandsManager}
          activeViewportId={activeViewportId}
          setViewportActive={(viewportId: string) => {
            viewportGridService.setActiveViewportId(viewportId);
          }}
          viewportData={viewportOptions}
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

  /**
   * SopClassHandlerModule should provide a list of sop class handlers that will be
   * available in OHIF for Modes to consume and use to create displaySets from Series.
   * Each sop class handler is defined by a { name, sopClassUids, getDisplaySetsFromSeries}.
   * Examples include the default sop class handler provided by the default extension
   */
  getSopClassHandlerModule({ servicesManager, commandsManager, extensionManager }) {
    return [
      getDicomMicroscopySopClassHandler({
        servicesManager,
        extensionManager,
      }),
      getDicomMicroscopySRSopClassHandler({
        servicesManager,
        extensionManager,
      }),
    ];
  },

  getPanelModule,

  getCommandsModule,
};
