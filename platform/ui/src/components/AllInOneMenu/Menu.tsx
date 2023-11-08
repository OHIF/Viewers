import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import './allInOneMenu.css';
import DividerItem from './DividerItem';
import PanelSelector from './PanelSelector';
import classNames from 'classnames';
import Icon from '../Icon';

export interface MenuProps {
  className?: string;
  isVisible?: boolean;
  preventHideMenu?: boolean;
  backLabel: string;
  headerComponent?: ReactNode;
  showHeaderDivider?: boolean;
  activePanelIndex?: number;
  onMenuVisibilityChange?: (isVisible: boolean) => void;
  children: unknown;
}

type MenuContextProps = {
  showSubMenu: (subMenuProps: MenuProps) => void;
  hideMenu: () => void;
  addItemPanel: (index: number, label: string) => void;
  activePanelIndex: number;
};

type MenuPathState = {
  props: MenuProps;
  activePanelIndex: number;
};

export const MenuContext = createContext<MenuContextProps>(null);

const Menu = (props: MenuProps) => {
  const { isVisible, onMenuVisibilityChange, activePanelIndex, preventHideMenu, className } = props;

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPath, setMenuPath] = useState<Array<MenuPathState>>([
    { props, activePanelIndex: activePanelIndex || 0 },
  ]);
  const [itemPanelLabels, setItemPanelLabels] = useState<Array<string>>([]);

  useEffect(() => {
    setIsMenuVisible(isVisible);
    onMenuVisibilityChange?.(isVisible);
  }, [isVisible, onMenuVisibilityChange]);

  const showSubMenu = useCallback((subMenuProps: MenuProps) => {
    setMenuPath(path => {
      return [
        ...path,
        { props: subMenuProps, activePanelIndex: subMenuProps.activePanelIndex || 0 },
      ];
    });
    setItemPanelLabels([]);
  }, []);

  const hideMenu = useCallback(() => {
    if (preventHideMenu) {
      return;
    }

    setMenuPath(path => [path[0]]);
    setItemPanelLabels([]);
    setIsMenuVisible(false);
    onMenuVisibilityChange(false);
  }, [preventHideMenu, onMenuVisibilityChange]);

  const addItemPanel = useCallback((index, label) => {
    setItemPanelLabels(labels => {
      labels.splice(index, 0, label);
      return [...labels];
    });
  }, []);

  const onActivePanelIndexChange = useCallback(index => {
    setMenuPath(path => {
      path[path.length - 1].activePanelIndex = index;
      return [...path];
    });
  }, []);

  const onBackClick = useCallback(() => {
    setMenuPath(path => [...path.slice(0, path.length - 1)]);
    setItemPanelLabels([]);
  }, []);

  const BackItem = ({ backLabel }) => {
    return (
      <>
        <div
          className="all-in-one-menu-item all-in-one-menu-item-effects"
          onClick={onBackClick}
        >
          <Icon name="content-prev"></Icon>
          <div className="pl-2">{backLabel}</div>
        </div>
        <DividerItem></DividerItem>
      </>
    );
  };

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
        }}
      >
        {isMenuVisible && (
          <div
            className={classNames(
              'bg-secondary-dark flex select-none flex-col rounded px-1 py-1.5 text-white opacity-90',
              className
            )}
          >
            {menuPath.length > 1 && (
              <BackItem backLabel={menuPath[menuPath.length - 2].props.backLabel} />
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
