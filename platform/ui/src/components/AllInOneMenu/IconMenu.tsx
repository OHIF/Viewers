import React, { useCallback, useState } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import { MenuProps } from './Menu';
import getIcon from '../Icon/getIcon';
import classNames from 'classnames';
import { AllInOneMenu } from '..';

export interface IconMenuProps extends MenuProps {
  icon: string;
  iconClassName?: string;
  horizontalDirection?: AllInOneMenu.HorizontalDirection;
  verticalDirection?: AllInOneMenu.VerticalDirection;
}

/**
 * An IconMenu allows for div wrapped icon to be clicked to show and hide
 * an AllInOneMenu.Menu. Based on the direction(s) specified the menu is
 * positioned relative to the icon.
 *
 * HorizontalDirection.LeftToRight - the left edges of the icon and menu are aligned
 * HorizontalDirection.RightRoLeft - the right edges of the icon and menu are aligned
 * VerticalDirection.TopToBottom - the top edge of the menu appears directly below the bottom edge of the icon
 * VerticalDirection.BottomToTop - the bottom edge of the menu appears directly above the top edge of the icon
 */
export default function IconMenu({
  icon,
  iconClassName,
  horizontalDirection = AllInOneMenu.HorizontalDirection.LeftToRight,
  verticalDirection = AllInOneMenu.VerticalDirection.TopToBottom,
  children,
  backLabel,
  menuClassName,
  menuStyle,
  onVisibilityChange,
}: IconMenuProps) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const toggleMenuVisibility = useCallback(() => setIsMenuVisible(isVisible => !isVisible), []);

  return (
    <OutsideClickHandler
      onOutsideClick={toggleMenuVisibility}
      disabled={!isMenuVisible}
    >
      <div className="relative">
        <div
          className={iconClassName}
          onClick={toggleMenuVisibility}
        >
          {getIcon(icon)}
        </div>
        <AllInOneMenu.Menu
          isVisible={isMenuVisible}
          backLabel={backLabel}
          menuClassName={classNames(
            menuClassName,
            'absolute',
            verticalDirection === AllInOneMenu.VerticalDirection.TopToBottom
              ? 'top-[100%]'
              : 'bottom-[100%]',
            horizontalDirection === AllInOneMenu.HorizontalDirection.LeftToRight
              ? 'left-0'
              : 'right-0'
          )}
          menuStyle={menuStyle}
          onVisibilityChange={isVis => {
            setIsMenuVisible(isVis);
            onVisibilityChange?.(isVis);
          }}
          horizontalDirection={horizontalDirection}
        >
          {children}
        </AllInOneMenu.Menu>
      </div>
    </OutsideClickHandler>
  );
}
