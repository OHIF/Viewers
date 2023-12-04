import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react';

import './allInOneMenu.css';
import DividerItem from './DividerItem';
import PanelSelector from './PanelSelector';
import classNames from 'classnames';
import BackItem from './BackItem';

export enum VerticalDirection {
  TopToBottom,
  BottomToTop,
}
export enum HorizontalDirection {
  LeftToRight,
  RightToLeft,
}

export interface MenuProps {
  menuStyle?: unknown;
  menuClassName?: string;
  isVisible?: boolean;
  preventHideMenu?: boolean;
  backLabel?: string;
  headerComponent?: ReactNode;
  showHeaderDivider?: boolean;
  activePanelIndex?: number;
  onVisibilityChange?: (isVisible: boolean) => void;
  horizontalDirection?: HorizontalDirection;
  children: ReactNode;
}
type MenuContextProps = {
  showSubMenu: (subMenuProps: MenuProps) => void;
  hideMenu: () => void;
  addItemPanel: (index: number, label: string) => void;
  horizontalDirection: HorizontalDirection;
  activePanelIndex: number;
};

type MenuPathState = {
  props: MenuProps;
  activePanelIndex: number;
};

export const MenuContext = createContext<MenuContextProps>(null);

const Menu = (props: MenuProps) => {
  const {
    isVisible,
    onVisibilityChange,
    activePanelIndex,
    preventHideMenu,
    menuClassName,
    menuStyle,
    horizontalDirection = HorizontalDirection.LeftToRight,
  } = props;

  const [isMenuVisible, setIsMenuVisible] = useState(isVisible);

  // The menuPath is an array consisting of this top Menu and every SubMenu
  // that has been traversed/opened by the user with the last item in the array
  // being the current (sub)menu that is currently visible. This allows for the previously
  // viewed menus to be returned to via the Back button at the top of the menu.
  const [menuPath, setMenuPath] = useState<Array<MenuPathState>>([
    { props, activePanelIndex: activePanelIndex || 0 },
  ]);
  const [itemPanelLabels, setItemPanelLabels] = useState<Array<string>>([]);

  const hideMenu = useCallback(() => {
    if (preventHideMenu) {
      return;
    }
    setMenuPath(path => [path[0]]);
    setItemPanelLabels([]);
    setIsMenuVisible(false);
    onVisibilityChange?.(false);
  }, [preventHideMenu, onVisibilityChange]);

  useEffect(() => {
    if (isVisible) {
      setIsMenuVisible(isVisible);
      onVisibilityChange?.(isVisible);
    } else {
      hideMenu();
    }
  }, [hideMenu, isVisible, onVisibilityChange]);

  const showSubMenu = useCallback((subMenuProps: MenuProps) => {
    setMenuPath(path => {
      return [
        ...path,
        { props: subMenuProps, activePanelIndex: subMenuProps.activePanelIndex || 0 },
      ];
    });
    setItemPanelLabels([]);
  }, []);

  const addItemPanel = useCallback((index, label) => {
    setItemPanelLabels(labels => {
      return [...labels.slice(0, index), label, ...labels.slice(index + 1, labels.length)];
    });
  }, []);

  const onActivePanelIndexChange = useCallback(index => {
    setMenuPath(path => {
      return [
        ...path.slice(0, path.length - 1),
        { ...path[path.length - 1], activePanelIndex: index },
      ];
    });
  }, []);

  const onBackClick = useCallback(() => {
    setMenuPath(path => [...path.slice(0, path.length - 1)]);
    setItemPanelLabels([]);
  }, []);

  const { props: currentMenuProps, activePanelIndex: currentMenuActivePanelIndex } =
    menuPath[menuPath.length - 1];

  return (
    <>
      <MenuContext.Provider
        value={{
          showSubMenu,
          hideMenu,
          addItemPanel,
          activePanelIndex: currentMenuActivePanelIndex,
          horizontalDirection,
        }}
      >
        {isMenuVisible && (
          <div
            className={classNames(
              'bg-secondary-dark flex select-none flex-col rounded px-1 py-1.5 text-white opacity-90',
              menuClassName
            )}
            style={menuStyle}
          >
            {menuPath.length > 1 && (
              <BackItem
                backLabel={menuPath[menuPath.length - 2].props.backLabel}
                onBackClick={onBackClick}
              />
            )}
            {itemPanelLabels.length > 1 && (
              <PanelSelector
                panelLabels={itemPanelLabels}
                activeIndex={currentMenuActivePanelIndex}
                onActiveIndexChange={onActivePanelIndexChange}
              ></PanelSelector>
            )}
            {currentMenuProps.headerComponent}
            {currentMenuProps.showHeaderDivider && <DividerItem />}
            {currentMenuProps.children}
          </div>
        )}
      </MenuContext.Provider>
    </>
  );
};

export default Menu;
