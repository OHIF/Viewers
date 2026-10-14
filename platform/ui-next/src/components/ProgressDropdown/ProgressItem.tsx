import React, { ReactElement } from 'react';
import ProgressItemDetail from './ProgressItemDetail';
import { ProgressDropdownOption } from './types';

const ProgressItem = ({
  option,
  onSelect,
}: {
  option: ProgressDropdownOption;
  onSelect: (option: ProgressDropdownOption) => void;
}): ReactElement<any> => {
  const { value } = option;

  return (
    <div
      key={value}
      className={'hover:bg-accent mx-1 flex cursor-pointer rounded-sm py-1'}
      onClick={() => onSelect(option)}
    >
      <ProgressItemDetail option={option} />
    </div>
  );
};



export default ProgressItem;
