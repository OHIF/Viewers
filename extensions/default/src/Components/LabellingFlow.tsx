import React, { ReactElement } from 'react';
import SelectTree from '@ohif/ui/src/components/SelectTree';

export type LabellingFlowProps = {
  columns: number;
  onSelected: () => void;
  closePopup: () => void;
  label: string;
  measurementData: any;
  items: any[];
  exclusive: boolean;
  selectTreeFirstTitle: string;
};
/**
 * A React component that renders a loading progress bar.
 * If progress is not provided, it will render an infinite loading bar
 * If progress is provided, it will render a progress bar
 * The progress text can be optionally displayed to the left of the bar.
 */
function LabellingFlow({
  items,
  columns,
  onSelected,
  closePopup,
  selectTreeFirstTitle,
  exclusive,
  label,
}: LabellingFlowProps): ReactElement {
  return (
    <SelectTree
      items={items}
      columns={columns}
      onSelected={onSelected}
      closePopup={closePopup}
      selectTreeFirstTitle={selectTreeFirstTitle}
      exclusive={exclusive}
      label={label}
    />
  );
}

export default LabellingFlow;
