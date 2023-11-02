import React, { useCallback, useState } from 'react';

import './switchButton.css';

export enum SwitchLabelLocation {
  left,
  right,
}

export type SwitchButtonProps = {
  isSwitchOn?: boolean;
  label?: string;
  labelLocation?: SwitchLabelLocation;
  onSwitchChange?: (isSwitchOn: boolean) => void;
};

const SwitchButton = ({
  label,
  isSwitchOn,
  onSwitchChange,
  labelLocation = SwitchLabelLocation.left,
}: SwitchButtonProps) => {
  const [isChecked, setIsChecked] = useState(isSwitchOn);

  const onChange = useCallback(
    event => {
      setIsChecked(event.target.checked);
      onSwitchChange?.(event.target.checked);
    },
    [onSwitchChange]
  );

  return (
    <label className="switch-button flex w-full cursor-pointer items-center justify-between text-[14px]">
      {label && labelLocation === SwitchLabelLocation.left && <div>{label}</div>}
      <div className="relative">
        <input
          className="absolute hidden"
          type="checkbox"
          onChange={onChange}
          checked={isChecked}
        />
        <div className="switch-button-outer border-common-bright bg-primary-dark block h-[16px] w-[30px] rounded-full border"></div>
        <div className="switch-button-dot bg-common-bright absolute left-[4px] top-[3px] h-[10px] w-[10px] rounded-full transition duration-150 ease-in-out"></div>
      </div>
      {label && labelLocation === SwitchLabelLocation.right && <div>{label}</div>}
    </label>
  );
};

export default SwitchButton;
