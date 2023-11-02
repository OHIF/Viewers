import React, { ReactNode, useCallback, useContext } from 'react';
import { AllInOneMenuContext } from './AllInOneMenu';

type AllInOneMenuItemProps = {
  label: string;
  alternateLabel?: string;
  icon: ReactNode;
  onItemClick?: () => void;
};

const AllInOneMenuItem = ({ label, alternateLabel, icon, onItemClick }: AllInOneMenuItemProps) => {
  const { hideMenu } = useContext(AllInOneMenuContext);

  const onClickHandler = useCallback(() => {
    hideMenu();
    onItemClick?.();
  }, [hideMenu, onItemClick]);

  return (
    <div
      className="all-in-one-menu-item all-in-one-menu-item-effects"
      onClick={onClickHandler}
    >
      {icon && (
        <>
          {icon}
          <div className="w-2"></div>
        </>
      )}
      <span>{label}</span>
      {alternateLabel != null && (
        <span className="text-aqua-pale ml-[1ch]">{`${alternateLabel}`}</span>
      )}
    </div>
  );
};

export default AllInOneMenuItem;
