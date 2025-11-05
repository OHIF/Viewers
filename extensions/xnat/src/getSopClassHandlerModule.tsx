/**
 * SOP Class Handler Module for XNAT
 * Refactored to use extracted modules for better maintainability
 */

import { id } from './id';
import getDisplaySetsFromUnsupportedSeries from './getDisplaySetsFromUnsupportedSeries';

import type { AppContextType } from './SopClassHandler/Types';
import { sopClassUids, sopClassHandlerName } from './SopClassHandler/Constants';
import { getDisplaySetsFromSeries } from './SopClassHandler/DisplaySetProcessor';

// Global app context - maintained for backward compatibility
let appContext: AppContextType = {};

export default function getSopClassHandlerModule(appContextParam: AppContextType) {
  appContext = appContextParam;

  return [{
      name: sopClassHandlerName,
      sopClassUids,
      getDisplaySetsFromSeries: (instances) => getDisplaySetsFromSeries(instances, appContext),
    },
    {
      name: 'not-supported-display-sets-handler',
      sopClassUids: [],
      getDisplaySetsFromSeries: getDisplaySetsFromUnsupportedSeries,
    },
  ];
} 