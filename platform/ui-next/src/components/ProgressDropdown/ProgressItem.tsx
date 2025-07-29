import React, { ReactElement } from 'react';
import ProgressItemDetail from './ProgressItemDetail';
import { ProgressDropdownOption, ProgressDropdownOptionPropType } from './types';

interface ProgressItemProps {
  option: unknown;
  onSelect?(...args: unknown[]): unknown;
}

const ProgressItem = ({
  option,
  onSelect
}: ProgressItemProps): ReactElement<any> => {
  const { value } = option;

  return (
    <div
      key={value}
      className={'hover:bg-secondary-main flex cursor-pointer py-1 transition duration-1000'}
      onClick={() => onSelect(option)}
    >
      <ProgressItemDetail option={option} />
    </div>
  );
};

export default ProgressItem;
