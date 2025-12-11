import * as React from 'react';
import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { SortingState, PaginationState, ColumnFiltersState } from '@tanstack/react-table';
import qs from 'query-string';
import useSearchParams from './useSearchParams';
import useDebounce from './useDebounce';
import { useSessionStorage, COLUMN_IDS, TEXT_FILTER_COLUMN_IDS } from '@ohif/ui-next';
import { preserveQueryStrings } from '../utils/preserveQueryParameters';

export type StudyListState = {
  sorting: SortingState;
  pagination: PaginationState;
  filters: ColumnFiltersState;
  dataSources?: string;
};

/**
 * Hook that syncs study list table state (sorting, pagination, filters) between:
 * - URL query parameters (source of truth, takes precedence)
 * - Session storage (fallback/persistence)
 * - Component state (for reactivity)
 */
export function useStudyListStateSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useSearchParams({ lowerCaseKeys: true });

  const [sessionState, updateSessionState] = useSessionStorage({
    key: 'studyList.tableState',
    defaultValue: {},
    clearOnUnload: true,
  });

  const [pagination, setPagination] = useState<PaginationState>(
    sessionState.pagination || parsePaginationFromURL(searchParams)
  );
  const [filters, setFilters] = useState<ColumnFiltersState>(
    sessionState.filters || parseFiltersFromURL(searchParams)
  );
  const [sorting, setSorting] = useState<SortingState>(
    sessionState.sorting || parseSortingFromURL(searchParams)
  );

  const dataSources = sessionState.dataSources || searchParams.get('datasources');

  const state = useMemo(
    () => ({ sorting, pagination, filters, dataSources }),
    [sorting, pagination, filters, dataSources]
  );

  // Debounce state for URL updates
  const debouncedState = useDebounce(state, 200);

  // Sync to sessionStorage on state change
  React.useEffect(() => {
    updateSessionState(state);
  }, [state, updateSessionState]);

  // Sync to URL on debounced state change
  React.useEffect(() => {
    const query = buildQueryFromState(debouncedState);
    const newSearch = query ? `?${query}` : '';

    // Only navigate if the search string actually changed
    if (newSearch !== location.search) {
      navigate(
        {
          pathname: location.pathname,
          search: newSearch,
        },
        { replace: true }
      );
    }
  }, [debouncedState, navigate, location.pathname, location.search]);

  return {
    sorting,
    pagination,
    filters,
    setSorting,
    setPagination,
    setFilters,
  };
}

/**
 * Parse sorting state from URL query parameters
 */
function parseSortingFromURL(params: URLSearchParams): SortingState {
  const sortBy = params.get('sortby');
  const sortDirection = params.get('sortdirection');

  if (!sortBy) {
    return [];
  }

  return [
    {
      id: sortBy,
      desc: sortDirection === 'desc' || sortDirection === 'descending',
    },
  ];
}

/**
 * Parse pagination state from URL query parameters
 */
function parsePaginationFromURL(params: URLSearchParams): PaginationState {
  const page = params.get('pagenumber');
  const perPage = params.get('resultsperpage');

  return {
    pageIndex: page ? parseInt(page, 10) - 1 : 0,
    pageSize: perPage ? parseInt(perPage, 10) : 50,
  };
}

/**
 * Parse filters from URL query parameters
 * Note: This is a simplified version. You may need to extend this based on your filter structure.
 */
function parseFiltersFromURL(params: URLSearchParams): ColumnFiltersState {
  const filters: ColumnFiltersState = [];

  // Example: Parse modality filter
  const modalities = params.get(COLUMN_IDS.MODALITIES);
  if (modalities) {
    const modalityList = modalities.split(',').filter(Boolean);
    if (modalityList.length > 0) {
      filters.push({
        id: COLUMN_IDS.MODALITIES,
        value: modalityList,
      });
    }
  }

  // Add other filter parsing as needed
  // For text filters like patientName, mrn, etc.
  TEXT_FILTER_COLUMN_IDS.forEach(key => {
    const value = params.get(key);
    if (value) {
      filters.push({
        id: key,
        value,
      });
    }
  });

  return filters;
}

/**
 * Build URL query string from study list state preserving key query parameters.
 */
function buildQueryFromState(state: StudyListState): string {
  const query: Record<string, string> = {};

  // Sorting
  if (state.sorting.length > 0) {
    const sort = state.sorting[0];
    query.sortBy = sort.id;
    query.sortDirection = sort.desc ? 'desc' : 'asc';
  }

  // Pagination
  if (state.pagination.pageIndex > 0) {
    query.pageNumber = String(state.pagination.pageIndex + 1);
  }
  if (state.pagination.pageSize !== 50) {
    query.resultsPerPage = String(state.pagination.pageSize);
  }

  // Filters
  state.filters.forEach(filter => {
    if (filter.id === COLUMN_IDS.MODALITIES && Array.isArray(filter.value)) {
      query.modalities = filter.value.join(',');
    } else if (typeof filter.value === 'string' && filter.value) {
      // Map column IDs to URL keys (lowercase)
      const urlKey = filter.id.toLowerCase();
      query[urlKey] = filter.value;
    }
  });

  if (state.dataSources) {
    query.dataSources = state.dataSources;
  }

  preserveQueryStrings(query);

  return qs.stringify(query, { skipNull: true, skipEmptyString: true });
}
