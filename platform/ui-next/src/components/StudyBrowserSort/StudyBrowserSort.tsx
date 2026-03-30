import React, { useEffect, useState } from 'react';
import { Icons } from '../Icons';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../DropdownMenu/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';

export function StudyBrowserSort({ servicesManager }: withAppTypes) {
  // Todo: this should not be here, no servicesManager should be in ui-next, only
  // customization service
  const { customizationService, displaySetService } = servicesManager.services;
  const sortFunctions = customizationService.getCustomization('studyBrowser.sortFunctions');

  const [selectedSort, setSelectedSort] = useState(sortFunctions[0]);
  const [sortDirection, setSortDirection] = useState('ascending');

  const handleSortChange = sortFunction => {
    setSelectedSort(sortFunction);
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
    <div className="contents">
      <div className="min-w-0 flex-1 basis-0 overflow-hidden">
        <div className="w-full min-w-0">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger className="w-full overflow-hidden focus:outline-none focus:ring-0 focus-visible:outline-none">
                <DropdownMenuTrigger className="relative flex h-[28px] w-full items-center justify-start overflow-hidden whitespace-nowrap rounded border-0 bg-[#3a3a3a] px-3 text-sm text-white focus:outline-none data-[state=open]:outline-none data-[state=open]:ring-0">
                  <span className="overflow-hidden text-ellipsis">{selectedSort.label}</span>
                  <Icons.ChevronOpen className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 opacity-70" />
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{selectedSort.label}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent className="bg-[#3a3a3a]">
              {sortFunctions.map(sort => (
                <DropdownMenuItem
                  key={sort.label}
                  className="text-sm text-white hover:bg-[#4a4a4a]"
                  onClick={() => handleSortChange(sort)}
                >
                  {sort.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="shrink-0">
        <Tooltip>
          <TooltipTrigger className="focus:outline-none focus:ring-0 focus-visible:outline-none">
            <button
              onClick={toggleSortDirection}
              className="flex h-[28px] w-[28px] items-center justify-center rounded bg-[#3a3a3a] focus:outline-none"
            >
              {sortDirection === 'ascending' ? (
                <Icons.SortAZ className="h-4 w-4 text-white" />
              ) : (
                <Icons.SortZA className="h-4 w-4 text-white" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Sort direction</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
