import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { Icons } from '../Icons';
import { TooltipTrigger, TooltipContent, Tooltip } from '../Tooltip';
import { Separator } from '../Separator';

type StyleMap = {
  open: {
    left: { marginLeft: string; marginRight: string };
    right: { marginLeft: string; marginRight: string };
  };
  closed: {
    left: { marginLeft: string; marginRight: string; alignItems: string };
    right: { marginLeft: string; marginRight: string; alignItems: string };
  };
};
const closeIconWidth = 30;
const gridHorizontalPadding = 10;
const tabSpacerWidth = 2;

const baseClasses = 'bg-black border-black justify-start box-content flex flex-col';

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
  expandedInsideBorderSize: number,
  collapsedWidth: number,
  collapsedInsideBorderSize: number,
  collapsedOutsideBorderSize: number
): StyleMap => {
  const collapsedHideWidth = expandedWidth - collapsedWidth - collapsedInsideBorderSize;

  return {
    open: {
      left: { marginLeft: '0px', marginRight: `${expandedInsideBorderSize}px` },
      right: { marginLeft: `${expandedInsideBorderSize}px`, marginRight: '0px' },
    },
    closed: {
      left: {
        marginLeft: `-${collapsedHideWidth}px`,
        marginRight: `${collapsedOutsideBorderSize}px`,
        alignItems: `flex-end`,
      },
      right: {
        marginLeft: `${collapsedOutsideBorderSize}px`,
        marginRight: `-${collapsedHideWidth}px`,
        alignItems: `flex-start`,
      },
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
  activeTabIndex: activeTabIndexProp,
  isExpanded,
  tabs,
  onOpen,
  onClose,
  onActiveTabIndexChange,
  expandedWidth = 280,
  collapsedWidth = 25,
  expandedInsideBorderSize = 4,
  collapsedInsideBorderSize = 8,
  collapsedOutsideBorderSize = 4,
}) => {
  const [panelOpen, setPanelOpen] = useState(isExpanded);
  const [activeTabIndex, setActiveTabIndex] = useState(activeTabIndexProp ?? 0);

  const [styleMap, setStyleMap] = useState(
    createStyleMap(
      expandedWidth,
      expandedInsideBorderSize,
      collapsedWidth,
      collapsedInsideBorderSize,
      collapsedOutsideBorderSize
    )
  );

  const [baseStyle, setBaseStyle] = useState(createBaseStyle(expandedWidth));

  const [gridAvailableWidth, setGridAvailableWidth] = useState(
    expandedWidth - closeIconWidth - gridHorizontalPadding
  );

  const [gridWidth, setGridWidth] = useState(getGridWidth(tabs.length, gridAvailableWidth));
  const openStatus = panelOpen ? 'open' : 'closed';
  const style = Object.assign({}, styleMap[openStatus][side], baseStyle);

  const updatePanelOpen = useCallback(
    (isOpen: boolean) => {
      setPanelOpen(isOpen);
      if (isOpen !== panelOpen) {
        // only fire events for changes
        if (isOpen && onOpen) {
          onOpen();
        } else if (onClose && !isOpen) {
          onClose();
        }
      }
    },
    [panelOpen, onOpen, onClose]
  );

  const updateActiveTabIndex = useCallback(
    (activeTabIndex: number, forceOpen: boolean = false) => {
      if (forceOpen) {
        updatePanelOpen(true);
      }

      setActiveTabIndex(activeTabIndex);

      if (onActiveTabIndexChange) {
        onActiveTabIndexChange({ activeTabIndex });
      }
    },
    [onActiveTabIndexChange, updatePanelOpen]
  );

  useEffect(() => {
    updatePanelOpen(isExpanded);
  }, [isExpanded, updatePanelOpen]);

  useEffect(() => {
    setStyleMap(
      createStyleMap(
        expandedWidth,
        expandedInsideBorderSize,
        collapsedWidth,
        collapsedInsideBorderSize,
        collapsedOutsideBorderSize
      )
    );
    setBaseStyle(createBaseStyle(expandedWidth));

    const gridAvailableWidth = expandedWidth - closeIconWidth - gridHorizontalPadding;
    setGridAvailableWidth(gridAvailableWidth);
    setGridWidth(getGridWidth(tabs.length, gridAvailableWidth));
  }, [
    collapsedInsideBorderSize,
    collapsedWidth,
    expandedWidth,
    expandedInsideBorderSize,
    tabs.length,
    collapsedOutsideBorderSize,
  ]);

  useEffect(() => {
    updateActiveTabIndex(activeTabIndexProp ?? 0);
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
          {_childComponents.map((childComponent, index) => (
            <Tooltip key={index}>
              <TooltipTrigger>
                <div
                  id={`${childComponent.name}-btn`}
                  data-cy={`${childComponent.name}-btn`}
                  className="text-primary-active hover:cursor-pointer"
                  onClick={() => {
                    return childComponent.disabled ? null : updateActiveTabIndex(index, true);
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
        </div>
      </>
    );
  };

  const getCloseIcon = () => {
    return (
      <div
        className={classnames(
          'absolute flex cursor-pointer items-center justify-center',
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
                          className={getTabIconClassNames(tabs.length, tabIndex === activeTabIndex)}
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
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  const getOneTabComponent = () => {
    return (
      <div
        className={classnames(
          'text-primary-active flex grow cursor-pointer select-none justify-center self-center text-[13px]'
        )}
        data-cy={`${tabs[0].name}-btn`}
        onClick={() => updatePanelOpen(!panelOpen)}
      >
        {getCloseIcon()}
        <span>{tabs[0].label}</span>
      </div>
    );
  };

  const getOpenStateComponent = () => {
    return (
      <>
        <div className="bg-bkg-med flex h-[40px] flex-shrink-0 select-none rounded-t p-2">
          {tabs.length === 1 ? getOneTabComponent() : getTabGridComponent()}
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
      className={classnames(className, baseClasses)}
      style={style}
    >
      {panelOpen ? (
        <>
          {getOpenStateComponent()}
          {tabs.map((tab, tabIndex) => {
            if (tabIndex === activeTabIndex) {
              return <tab.content key={tabIndex} />;
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
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  onActiveTabIndexChange: PropTypes.func,
  isExpanded: PropTypes.bool,
  expandedWidth: PropTypes.number,
  collapsedWidth: PropTypes.number,
  expandedInsideBorderSize: PropTypes.number,
  collapsedInsideBorderSize: PropTypes.number,
  collapsedOutsideBorderSize: PropTypes.number,
  tabs: PropTypes.any,
};

export { SidePanel };
