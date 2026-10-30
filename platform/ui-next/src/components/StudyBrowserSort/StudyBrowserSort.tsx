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

  // The picker unmounts whenever the settings row is closed, so it starts from
  // the sort the display set service last applied rather than from the first
  // entry, which would show a choice the thumbnails are not in.
  const appliedSort = displaySetService.getDisplaySetSort();
  const [selectedSort, setSelectedSort] = useState(
    () => sortFunctions.find(sort => sort.sortFunction === appliedSort?.sortFn) ?? sortFunctions[0]
  );
  const [sortDirection, setSortDirection] = useState(appliedSort?.direction ?? 'ascending');
  // Opening the settings row leaves the thumbnails in their default order until
  // the user picks a sort or a direction.
  const [sortChosen, setSortChosen] = useState(appliedSort !== null);

  const handleSortChange = sortFunction => {
    setSortChosen(true);
    setSelectedSort(sortFunction);
  };

  const toggleSortDirection = e => {
    e.stopPropagation();
    setSortChosen(true);
    setSortDirection(prevDirection => (prevDirection === 'ascending' ? 'descending' : 'ascending'));
  };

  useEffect(() => {
    if (!sortChosen) {
      return;
    }
    displaySetService.sortDisplaySets(selectedSort.sortFunction, sortDirection);
  }, [displaySetService, selectedSort, sortDirection, sortChosen]);

  useEffect(() => {
    if (!sortChosen) {
      return;
    }
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
  }, [displaySetService, selectedSort, sortDirection, sortChosen]);

  return (
    <div className="flex w-[50%] items-center gap-1">
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger className="w-full overflow-hidden">
            <DropdownMenuTrigger className="border-input focus:border-input text-foreground bg-background flex h-[26px] w-full items-center justify-start overflow-hidden whitespace-nowrap rounded border p-2 text-base">
              {selectedSort.label}
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>{selectedSort.label}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent className="bg-background">
          {sortFunctions.map(sort => (
            <DropdownMenuItem
              key={sort.label}
              className="text-foreground"
              onClick={() => handleSortChange(sort)}
            >
              {sort.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Tooltip>
        <TooltipTrigger>
          <button
            onClick={toggleSortDirection}
            className="bg-background flex h-[26px] items-center justify-center"
          >
            {sortDirection === 'ascending' ? (
              <Icons.SortingAscending className="text-primary w-2" />
            ) : (
              <Icons.SortingDescending className="text-primary w-2" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>Sort direction</TooltipContent>
      </Tooltip>
    </div>
  );
}
