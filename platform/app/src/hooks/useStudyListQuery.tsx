import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { Enums, log } from '@ohif/core';
import { Button } from '@ohif/ui-next';
import { shallowEqualIgnoringArrayOrder } from '../utils/shallowEqualIgnoringArrayOrder';
import { URL_KEYS, getUrlParam } from '../utils/studyListFilterContract';

const DEFAULT_DATA = {
  studies: [],
  queryFilterValues: null,
};

/**
 * Queries the data source for the study list and manages the result lifecycle:
 * refetch-on-filter-change, loading / first-fetch flags, and surfacing
 * connection errors (a modal with a Retry action). Pagination changes do not
 * trigger refetches — the study list paginates client-side.
 *
 * `refresh` invalidates the cached result and re-arms the first-fetch gate,
 * causing the next render to re-query. It also clears the loading flag, so the
 * caller can use it as the single reset when the active data source changes.
 */
export function useStudyListQuery({
  dataSource,
  isDataSourceInitialized,
  servicesManager,
}: {
  dataSource: any;
  isDataSourceInitialized: boolean;
  servicesManager: AppTypes.ServicesManager;
}): {
  studies: any[];
  isLoading: boolean;
  hasFetchedOnce: boolean;
  refresh: () => void;
} {
  const location = useLocation();
  const params = useParams();

  const [data, setData] = useState(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const refresh = useCallback(() => {
    setIsLoading(false);
    setHasFetchedOnce(false);
    setData(DEFAULT_DATA);
  }, []);

  useEffect(() => {
    if (!isDataSourceInitialized) {
      return;
    }

    // Per-data-source result cap, passed to servers that honor the `limit`
    // query parameter. Defaults to 101 when the data source doesn't set it.
    const studiesLimit = dataSource.getConfig?.()?.queryLimit ?? 101;
    const queryFilterValues = _getQueryFilterValues(location.search, studiesLimit);

    // 204: no content
    async function getData() {
      setIsLoading(true);
      log.time(Enums.TimingEnum.SEARCH_TO_LIST);
      try {
        const studies = await dataSource.query.studies.search(queryFilterValues);
        setData({
          studies: studies || [],
          queryFilterValues,
        });
        log.timeEnd(Enums.TimingEnum.SCRIPT_TO_VIEW);
        log.timeEnd(Enums.TimingEnum.SEARCH_TO_LIST);
      } catch (e) {
        console.error(e);
        // Record that we attempted these filter values even though the fetch
        // failed. Without this, the effect's `filtersChanged` check would
        // remain true on the next render and immediately retry the same
        // failing query in a tight loop.
        setData(prev => ({ ...prev, queryFilterValues }));

        // If there is a data source configuration API, the Worklist will pop
        // up its own dialog to attempt to configure it. Otherwise surface the
        // failure via a modal with a Retry action.
        const { configurationAPI, friendlyName } = dataSource.getConfig();
        if (!configurationAPI) {
          const { uiModalService } = servicesManager.services;
          uiModalService.show({
            title: 'Data Source Connection Error',
            content: () => (
              <div className="text-foreground">
                <p className="text-red-600">Error: {(e as Error).message}</p>
                <p>
                  Please ensure the following data source is configured correctly or is running:
                </p>
                <div className="mt-2 font-bold">{friendlyName}</div>
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => {
                      uiModalService.hide();
                      refresh();
                    }}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ),
          });
        }
      } finally {
        setIsLoading(false);
        setHasFetchedOnce(true);
      }
    }

    // Refetch when the filter set has actually changed. Filters can include
    // array-valued fields like `modalitiesInStudy` whose element order
    // doesn't matter, so we compare with an unordered-array shallow equal
    // rather than reference equality — otherwise a re-render that
    // re-creates the array with the same contents would force a refetch.
    // Pagination changes alone don't invalidate the data (we paginate
    // client-side).
    const filtersChanged = !shallowEqualIgnoringArrayOrder(
      data.queryFilterValues,
      queryFilterValues
    );
    const isDataInvalid = !isLoading && filtersChanged;

    if (isDataInvalid) {
      getData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, location, params, isLoading, dataSource, isDataSourceInitialized]);

  return {
    studies: data.studies,
    isLoading,
    hasFetchedOnce,
    refresh,
  };
}

/**
 * Translates the URL query string into the filter shape expected by the
 * data source (`patientId`, `patientName`, `modalitiesInStudy`, …).
 *
 * URL keys come from the centralized contract in `studyListFilterContract.ts`,
 * which is also what WorkList's URL serializer writes — so the read/write
 * sides can't drift.
 *
 * @param {*} query - URL search string or `URLSearchParams`
 */
function _getQueryFilterValues(query, queryLimit) {
  const params = new URLSearchParams(query);
  const modalities = getUrlParam(params, URL_KEYS.modalities);

  const queryFilterValues = {
    // DCM
    patientId: getUrlParam(params, URL_KEYS.mrn),
    patientName: getUrlParam(params, URL_KEYS.patientName),
    studyDescription: getUrlParam(params, URL_KEYS.description),
    modalitiesInStudy: modalities ? modalities.split(',') : null,
    accessionNumber: getUrlParam(params, URL_KEYS.accession),
    //
    startDate: getUrlParam(params, URL_KEYS.startDate),
    endDate: getUrlParam(params, URL_KEYS.endDate),
    // Rarely supported server-side
    sortBy: getUrlParam(params, URL_KEYS.sortBy),
    sortDirection: getUrlParam(params, URL_KEYS.sortDirection),
    // So many different servers out there that we can't rely on them to support offset/limit.
    // So we just query for everything up to the queryLimit for those that support it.
    // For those that don't we will just assume we get everything back.
    offset: 0,
    limit: queryLimit,
  };

  // Delete null/undefined keys
  Object.keys(queryFilterValues).forEach(
    key => queryFilterValues[key] == null && delete queryFilterValues[key]
  );

  return queryFilterValues;
}
