import React, { ReactElement } from 'react';
import classnames from 'classnames';
import { ProgressDropdownOption, ProgressDropdownOptionPropType } from './types';

interface ProgressDiscreteBarProps {
  options: unknown[];
}

const ProgressDiscreteBar = ({
  options
}: ProgressDiscreteBarProps): ReactElement => {
  return (
    <div className="flex">
      {options.map((option, i) => (
        <div
          key={i}
          className={classnames('mr-1 h-1 grow first:rounded-l-sm last:mr-0 last:rounded-r-sm', {
            'bg-black': !option.activated && !option.completed,
            'bg-primary-main': option.activated && !option.completed,
            'bg-primary-light': option.completed,
          })}
        />
      ))}
    </div>
  );
};

export default ProgressDiscreteBar;
