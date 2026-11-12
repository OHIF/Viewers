import React, { ReactElement } from 'react';
import classnames from 'classnames';
import { ProgressDropdownOption } from './types';

const ProgressDiscreteBar = ({ options }: { options: ProgressDropdownOption[] }): ReactElement<any> => {
  return (
    <div className="flex">
      {options.map((option, i) => (
        <div
          key={i}
          className={classnames('mr-1 h-1 grow first:rounded-l-sm last:mr-0 last:rounded-r-sm', {
            'bg-background': !option.activated && !option.completed,
            'bg-primary/40': option.activated && !option.completed,
            'bg-highlight': option.completed,
          })}
        />
      ))}
    </div>
  );
};



export default ProgressDiscreteBar;
