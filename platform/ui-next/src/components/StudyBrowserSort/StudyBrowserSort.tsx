import React, { useEffect, useState } from 'react';
import { Icons } from '../Icons';

export function StudyBrowserSort({ servicesManager }: withAppTypes) {
  const { customizationService, displaySetService } = servicesManager.services;
  const { values: sortFunctions } = customizationService.get('studyBrowser.sortFunctions');

  const [selectedSort, setSelectedSort] = useState(sortFunctions[0]);
  const [sortDirection, setSortDirection] = useState('ascending');

  const handleSortChange = event => {
    const selectedSortFunction = sortFunctions.find(sort => sort.label === event.target.value);
    setSelectedSort(selectedSortFunction);
  };

  const toggleSortDirection = e => {
    e.stopPropagation();
    setSortDirection(prevDirection => (prevDirection === 'ascending' ? 'descending' : 'ascending'));
  };

  useEffect(() => {
    displaySetService.sortDisplaySets(selectedSort.sortFunction, sortDirection);
  }, [displaySetService, selectedSort, sortDirection]);

  useEffect(() => {
    const SubscriptionDisplaySetsChanged = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
      () => {
        displaySetService.sortDisplaySets(selectedSort.sortFunction, sortDirection, true);
      }
    );
    const SubscriptionDisplaySetMetaDataInvalidated = displaySetService.subscribe(
      displaySetService.EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED,
      () => {
        displaySetService.sortDisplaySets(selectedSort.sortFunction, sortDirection, true);
      }
    );

    return () => {
      SubscriptionDisplaySetsChanged.unsubscribe();
      SubscriptionDisplaySetMetaDataInvalidated.unsubscribe();
    };
  }, [displaySetService, selectedSort, sortDirection]);

  return (
    <div className="border-inputfield-main focus:border-inputfield-main flex h-[26px] w-[125px] items-center justify-center rounded border bg-black p-2">
      <select
        onChange={handleSortChange}
        value={selectedSort.label}
        onClick={e => e.stopPropagation()}
        className="w-full appearance-none bg-transparent text-sm leading-tight text-white shadow transition duration-300 focus:outline-none"
      >
        {sortFunctions.map(sort => (
          <option
            className="appearance-none bg-black text-white"
            value={sort.label}
            key={sort.label}
          >
            {sort.label}
          </option>
        ))}
      </select>
      <button
        onClick={toggleSortDirection}
        className="flex items-center justify-center"
      >
        {sortDirection === 'ascending' ? (
          <Icons.SortingAscending className="text-primary-main w-2" />
        ) : (
          <Icons.SortingDescending className="text-primary-main w-2" />
        )}
      </button>
    </div>
  );
}
