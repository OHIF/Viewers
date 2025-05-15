import React from 'react';

// should be used in a Select component
const SelectItemWithModality = ({
  displaySet,
  showModality = true,
}: {
  displaySet: AppTypes.DisplaySet;
  showModality?: boolean;
}): JSX.Element => (
  <div className="flex w-[90%] items-center justify-between">
    <span className="text-foreground truncate text-base">{displaySet.label}</span>
    {showModality && displaySet.Modality && (
      <span className="text-muted-foreground flex-shrink-0 whitespace-nowrap text-xs">
        {displaySet.Modality}
      </span>
    )}
  </div>
);

export default SelectItemWithModality;
