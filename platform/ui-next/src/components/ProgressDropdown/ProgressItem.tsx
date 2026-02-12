import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import ProgressItemDetail from './ProgressItemDetail';
import { ProgressDropdownOption, ProgressDropdownOptionPropType } from './types';

const ProgressItem = ({
  option,
  onSelect,
}: {
  option: ProgressDropdownOption;
  onSelect: (option: ProgressDropdownOption) => void;
}): ReactElement => {
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

ProgressItem.propTypes = {
  option: ProgressDropdownOptionPropType.isRequired,
  onSelect: PropTypes.func,
};

export default ProgressItem;
