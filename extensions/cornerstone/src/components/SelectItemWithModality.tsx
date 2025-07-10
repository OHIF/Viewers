import React from 'react';

// should be used in a Select component
const SelectItemWithModality = ({
  displaySet,
  showModality = true,
  dataCY = `${displaySet.label}-${displaySet.Modality}`,
}: {
  displaySet: AppTypes.DisplaySet;
  showModality?: boolean;
  dataCY?: string;
}): JSX.Element => (
  <div
    className="flex w-[90%] items-center justify-between"
    data-cy={dataCY}
  >
    <span className="text-foreground truncate text-base">{displaySet.label}</span>
    {showModality && displaySet.Modality && (
      <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap text-xs">
        {displaySet.Modality}
      </span>
    )}
  </div>
);

export default SelectItemWithModality;
