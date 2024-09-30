import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { Icons } from '../Icons';
import { TooltipTrigger, TooltipContent, TooltipProvider, Tooltip } from '../Tooltip';
import { Separator } from '../Separator';

type StyleMap = {
  open: {
    left: { marginLeft: string };
    right: { marginRight: string };
  };
  closed: {
    left: { marginLeft: string };
    right: { marginRight: string };
  };
};
const borderSize = 4;
const collapsedWidth = 25;
const closeIconWidth = 30;
const gridHorizontalPadding = 10;
const tabSpacerWidth = 2;

const baseClasses =
  'transition-all duration-300 ease-in-out bg-black border-black justify-start box-content flex flex-col';

const classesMap = {
  open: {
    left: `mr-1`,
    right: `ml-1`,
  },
  closed: {
    left: `mr-2 items-end`,
    right: `ml-2 items-start`,
  },
};

const openStateIconName = {
  left: 'SidePanelCloseLeft',
  right: 'SidePanelCloseRight',
};

const getTabWidth = (numTabs: number) => {
  if (numTabs < 3) {
    return 68;
  } else {
    return 40;
  }
};

const getGridWidth = (numTabs: number, gridAvailableWidth: number) => {
  const spacersWidth = (numTabs - 1) * tabSpacerWidth;
  const tabsWidth = getTabWidth(numTabs) * numTabs;

  if (gridAvailableWidth > tabsWidth + spacersWidth) {
    return tabsWidth + spacersWidth;
  }

  return gridAvailableWidth;
};

const getNumGridColumns = (numTabs: number, gridWidth: number) => {
  if (numTabs === 1) {
    return 1;
  }

  // Start by calculating the number of tabs assuming each tab was accompanied by a spacer.
  const tabWidth = getTabWidth(numTabs);
  const numTabsWithOneSpacerEach = Math.floor(gridWidth / (tabWidth + tabSpacerWidth));

  // But there is always one less spacer than tabs, so now check if an extra tab with one less spacer fits.
  if (
    (numTabsWithOneSpacerEach + 1) * tabWidth + numTabsWithOneSpacerEach * tabSpacerWidth <=
    gridWidth
  ) {
    return numTabsWithOneSpacerEach + 1;
  }

  return numTabsWithOneSpacerEach;
};

const getTabClassNames = (
  numColumns: number,
  numTabs: number,
  tabIndex: number,
  isActiveTab: boolean,
  isTabDisabled: boolean
) =>
  classnames('h-[28px] mb-[2px] cursor-pointer text-white bg-black', {
    'hover:text-primary-active': !isActiveTab && !isTabDisabled,
    'rounded-l': tabIndex % numColumns === 0,
    'rounded-r': (tabIndex + 1) % numColumns === 0 || tabIndex === numTabs - 1,
  });

const getTabStyle = (numTabs: number) => {
  return {
    width: `${getTabWidth(numTabs)}px`,
  };
};

const getTabIconClassNames = (numTabs: number, isActiveTab: boolean) => {
  return classnames('h-full w-full flex items-center justify-center', {
    'bg-customblue-40': isActiveTab,
    rounded: isActiveTab,
  });
};
const createStyleMap = (
  expandedWidth: number,
  borderSize: number,
  collapsedWidth: number
): StyleMap => {
  const collapsedHideWidth = expandedWidth - collapsedWidth - borderSize;

  return {
    open: {
      left: { marginLeft: '0px' },
      right: { marginRight: '0px' },
    },
    closed: {
      left: { marginLeft: `-${collapsedHideWidth}px` },
      right: { marginRight: `-${collapsedHideWidth}px` },
    },
  };
};

const getToolTipContent = (label: string, disabled: boolean) => {
  return (
    <>
      <div>{label}</div>
      {disabled && <div className="text-white">{'Not available based on current context'}</div>}
    </>
  );
};

const createBaseStyle = (expandedWidth: number) => {
  return {
    maxWidth: `${expandedWidth}px`,
    width: `${expandedWidth}px`,
    // To align the top of the side panel with the top of the viewport grid, use position relative and offset the
    // top by the same top offset as the viewport grid. Also adjust the height so that there is no overflow.
    position: 'relative',
    top: '0.2%',
    height: '99.8%',
  };
};
const SidePanel = ({
  side,
  className,
  activeTabIndex: activeTabIndexProp = null,
  tabs,
  onOpen,
  expandedWidth = 280,
  onActiveTabIndexChange,
}) => {
  const [panelOpen, setPanelOpen] = useState(activeTabIndexProp !== null);
  const [renderHeader, setRenderHeader] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const styleMap = createStyleMap(expandedWidth, borderSize, collapsedWidth);
  const baseStyle = createBaseStyle(expandedWidth);
  const gridAvailableWidth = expandedWidth - closeIconWidth - gridHorizontalPadding;
  const gridWidth = getGridWidth(tabs.length, gridAvailableWidth);
  const openStatus = panelOpen ? 'open' : 'closed';
  const style = Object.assign({}, styleMap[openStatus][side], baseStyle);

  const updatePanelOpen = useCallback(
    (panelOpen: boolean) => {
      setPanelOpen(panelOpen);
      if (panelOpen && onOpen) {
        onOpen();
      }
    },
    [onOpen]
  );

  const updateActiveTabIndex = useCallback(
    (activeTabIndex: number) => {
      if (activeTabIndex === null) {
        updatePanelOpen(false);
        return;
      }

      setActiveTabIndex(activeTabIndex);
      updatePanelOpen(true);

      if (onActiveTabIndexChange) {
        onActiveTabIndexChange({ activeTabIndex });
      }
    },
    [onActiveTabIndexChange, updatePanelOpen]
  );

  useEffect(() => {
    setRenderHeader(tabs.length === 1);
  }, [tabs]);
  useEffect(() => {
    updateActiveTabIndex(activeTabIndexProp);
  }, [activeTabIndexProp, updateActiveTabIndex]);

  const getCloseStateComponent = () => {
    const _childComponents = Array.isArray(tabs) ? tabs : [tabs];
    return (
      <>
        <div
          className={classnames(
            'bg-secondary-dark flex h-[28px] w-full cursor-pointer items-center rounded-md',
            side === 'left' ? 'justify-end pr-2' : 'justify-start pl-2'
          )}
          onClick={() => {
            updatePanelOpen(!panelOpen);
          }}
          data-cy={`side-panel-header-${side}`}
        >
          <Icons.NavigationPanelReveal
            className={classnames('text-primary-active', side === 'left' && 'rotate-180 transform')}
          />
        </div>
        <div className={classnames('mt-3 flex flex-col space-y-3')}>
          <TooltipProvider>
            {_childComponents.map((childComponent, index) => (
              <Tooltip key={index}>
                <TooltipTrigger>
                  <div
                    id={`${childComponent.name}-btn`}
                    data-cy={`${childComponent.name}-btn`}
                    className="text-primary-active hover:cursor-pointer"
                    onClick={() => {
                      return childComponent.disabled ? null : updateActiveTabIndex(index);
                    }}
                  >
                    {React.createElement(Icons[childComponent.iconName] || Icons.MissingIcon, {
                      className: classnames({
                        'text-primary-active': true,
                        'ohif-disabled': childComponent.disabled,
                      }),
                      style: {
                        width: '22px',
                        height: '22px',
                      },
                    })}
                  </div>
                </TooltipTrigger>
                <TooltipContent side={side === 'left' ? 'right' : 'left'}>
                  <div
                    className={classnames(
                      'flex items-center',
                      side === 'left' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {getToolTipContent(childComponent.label, childComponent.disabled)}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </>
    );
  };

  const getCloseIcon = () => {
    return (
      <div
        className={classnames(
          'absolute flex h-[24px] cursor-pointer items-center justify-center',
          side === 'left' ? 'right-0' : 'left-0'
        )}
        style={{ width: `${closeIconWidth}px` }}
        onClick={() => {
          updatePanelOpen(!panelOpen);
        }}
        data-cy={`side-panel-header-${side}`}
      >
        {React.createElement(Icons[openStateIconName[side]] || Icons.MissingIcon, {
          className: 'text-primary-active',
        })}
      </div>
    );
  };

  const getTabGridComponent = () => {
    const numCols = getNumGridColumns(tabs.length, gridWidth);

    return (
      <>
        {getCloseIcon()}

        <div className={classnames('flex grow justify-center')}>
          <div className={classnames('bg-primary-dark text-primary-active flex flex-wrap')}>
            {tabs.map((tab, tabIndex) => {
              const { disabled } = tab;
              return (
                <React.Fragment key={tabIndex}>
                  {tabIndex % numCols !== 0 && (
                    <div
                      className={classnames(
                        'flex h-[28px] w-[2px] items-center bg-black',
                        tabSpacerWidth
                      )}
                    >
                      <div className="bg-primary-dark h-[20px] w-full"></div>
                    </div>
                  )}
                  <TooltipProvider>
                    <Tooltip key={tabIndex}>
                      <TooltipTrigger>
                        <div
                          className={getTabClassNames(
                            numCols,
                            tabs.length,
                            tabIndex,
                            tabIndex === activeTabIndex,
                            disabled
                          )}
                          style={getTabStyle(tabs.length)}
                          onClick={() => {
                            return disabled ? null : updateActiveTabIndex(tabIndex);
                          }}
                          data-cy={`${tab.name}-btn`}
                        >
                          <div
                            className={getTabIconClassNames(
                              tabs.length,
                              tabIndex === activeTabIndex
                            )}
                          >
                            {React.createElement(Icons[tab.iconName] || Icons.MissingIcon, {
                              className: classnames({
                                'text-primary-active': true,
                                'ohif-disabled': disabled,
                              }),
                              style: {
                                width: '22px',
                                height: '22px',
                              },
                            })}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {getToolTipContent(tab.label, disabled)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  const getOpenStateComponent = () => {
    if (tabs.length === 1) {
      return null;
    }

    return (
      <>
        <div className="bg-bkg-med flex h-[40px] select-none rounded-t p-2">
          {getTabGridComponent()}
        </div>
        <Separator
          orientation="horizontal"
          className="bg-black"
          thickness="2px"
        />
      </>
    );
  };

  return (
    <div
      className={classnames(className, baseClasses, classesMap[openStatus][side])}
      style={style}
    >
      {panelOpen ? (
        <>
          {getOpenStateComponent()}
          {tabs.map((tab, tabIndex) => {
            if (tabIndex === activeTabIndex) {
              return (
                <tab.content
                  key={tabIndex}
                  getCloseIcon={getCloseIcon}
                  tab={tab}
                  renderHeader={renderHeader}
                />
              );
            }
            return null;
          })}
        </>
      ) : (
        <React.Fragment>{getCloseStateComponent()}</React.Fragment>
      )}
    </div>
  );
};

SidePanel.propTypes = {
  side: PropTypes.oneOf(['left', 'right']).isRequired,
  className: PropTypes.string,
  activeTabIndex: PropTypes.number,
  tabs: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.shape({
        iconName: PropTypes.string.isRequired,
        iconLabel: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        content: PropTypes.func, // TODO: Should be node, but it keeps complaining?
      })
    ),
  ]),
  onOpen: PropTypes.func,
  onActiveTabIndexChange: PropTypes.func,
  expandedWidth: PropTypes.number,
};

export { SidePanel };
