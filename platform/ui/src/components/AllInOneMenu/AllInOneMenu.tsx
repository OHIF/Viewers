import React, { createContext, ReactNode, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import './allInOneMenu.css';
import AllInOneMenuDividerItem from './AllInOneMenuDividerItem';
import AllInOneMenuItemPanelSelector from './AllInOneMenuItemPanelSelector';
import classNames from 'classnames';
import Icon from '../Icon';

export interface AllInOneMenuProps {
  className?: string;
  isVisible?: boolean;
  preventHideMenu?: boolean;
  menuLabel?: string;
  headerComponent?: ReactNode;
  isHeaderDividerVisible?: boolean;
  activePanelIndex?: number;
  onMenuVisibilityChange?: (isVisible: boolean) => void;
  children: unknown;
}

type AllInOneMenuContextProps = {
  showSubMenu: (subMenuProps: AllInOneMenuProps) => void;
  hideMenu: () => void;
  addItemPanel: (index: number, label: string) => void;
  activePanelIndex: number;
};

type AllInOneMenuPathState = {
  props: AllInOneMenuProps;
  activePanelIndex: number;
};

export const AllInOneMenuContext = createContext<AllInOneMenuContextProps>(null);

const AllInOneMenu = (props: AllInOneMenuProps) => {
  const { isVisible, onMenuVisibilityChange, activePanelIndex, preventHideMenu, className } = props;

  const { t } = useTranslation('Common');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPath, setMenuPath] = useState<Array<AllInOneMenuPathState>>([
    { props, activePanelIndex: activePanelIndex || 0 },
  ]);
  const [itemPanelLabels, setItemPanelLabels] = useState<Array<string>>([]);

  useEffect(() => {
    setIsMenuVisible(isVisible);
    onMenuVisibilityChange?.(isVisible);
  }, [isVisible, onMenuVisibilityChange]);

  const showSubMenu = useCallback((subMenuProps: AllInOneMenuProps) => {
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

  const BackItem = () => {
    return (
      <>
        <div
          className="all-in-one-menu-item all-in-one-menu-item-effects flex items-center"
          onClick={onBackClick}
        >
          <Icon name="content-prev"></Icon>
          <div className="pl-2">
            {t('Back to', { location: menuPath[menuPath.length - 2].props.menuLabel })}
          </div>
        </div>
        <AllInOneMenuDividerItem></AllInOneMenuDividerItem>
      </>
    );
  };

  const { props: currentMenuProps, activePanelIndex: currentMenuActivePanelIndex } =
    menuPath[menuPath.length - 1];

  return (
    <>
      <AllInOneMenuContext.Provider
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
              'bg-secondary-dark flex select-none flex-col rounded p-1 text-white opacity-90',
              className
            )}
          >
            {menuPath.length > 1 && <BackItem />}
            {itemPanelLabels.length > 1 && (
              <AllInOneMenuItemPanelSelector
                panelLabels={itemPanelLabels}
                activeIndex={currentMenuActivePanelIndex}
                onActiveIndexChange={onActivePanelIndexChange}
              ></AllInOneMenuItemPanelSelector>
            )}
            {currentMenuProps.headerComponent}
            {currentMenuProps.isHeaderDividerVisible && <AllInOneMenuDividerItem />}
            {currentMenuProps.children}
          </div>
        )}
      </AllInOneMenuContext.Provider>
    </>
  );
};

export default AllInOneMenu;
