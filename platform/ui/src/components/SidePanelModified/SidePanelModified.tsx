import classnames from 'classnames';
import PropTypes from 'prop-types';
import React, { CSSProperties, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import Icon from '../Icon';
import Tooltip from '../Tooltip';

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
  left: 'side-panel-close-left',
  right: 'side-panel-close-right',
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

const getGridStyle = (
  side: string,
  numTabs: number = 0,
  gridWidth: number,
  expandedWidth: number
): CSSProperties => {
  const relativePosition = Math.max(0, Math.floor(expandedWidth - gridWidth) / 2 - closeIconWidth);
  return {
    position: 'relative',
    ...(side === 'left' ? { right: `${relativePosition}px` } : { left: `${relativePosition}px` }),
    width: `${gridWidth}px`,
  };
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
const SidePanelModified = ({
  side,
  className,
  activeTabIndex: activeTabIndexProp = null,
  tabs,
  onOpen,
  expandedWidth = 248,
  onActiveTabIndexChange,
}) => {
  const { t } = useTranslation('SidePanelModified');

  const [panelOpen, setPanelOpen] = useState(activeTabIndexProp !== null);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const styleMap = createStyleMap(expandedWidth, borderSize, collapsedWidth);
  const baseStyle = createBaseStyle(expandedWidth);
  const gridAvailableWidth = expandedWidth - closeIconWidth - gridHorizontalPadding;
  const gridWidth = getGridWidth(tabs.length, gridAvailableWidth);
  const openStatus = 'open';
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
          <Icon
            name={'navigation-panel-right-reveal'}
            className={classnames('text-primary-active', side === 'left' && 'rotate-180 transform')}
          />
        </div>
        <div className={classnames('mt-3 flex flex-col space-y-3')}>
          {_childComponents.map((childComponent, index) => (
            <Tooltip
              position={side === 'left' ? 'right' : 'left'}
              key={index}
              content={getToolTipContent(childComponent.label, childComponent.disabled)}
              className={classnames(
                'flex items-center',
                side === 'left' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                id={`${childComponent.name}-btn`}
                data-cy={`${childComponent.name}-btn`}
                className="text-primary-active hover:cursor-pointer"
                onClick={() => {
                  return childComponent.disabled ? null : updateActiveTabIndex(index);
                }}
              >
                <Icon
                  name={childComponent.iconName}
                  className={classnames({
                    'text-primary-active': true,
                    'ohif-disabled': childComponent.disabled,
                  })}
                  style={{
                    width: '22px',
                    height: '22px',
                  }}
                />
              </div>
            </Tooltip>
          ))}
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
        style={{
          ...(side === 'left'
            ? { marginLeft: `${closeIconWidth}px` }
            : { marginRight: `${closeIconWidth}px` }),
        }}
        data-cy={`${tabs[0].name}-btn`}
        onClick={() => updatePanelOpen(!panelOpen)}
      ></div>
    );
  };

  const getOpenStateComponent = () => {
    return (
      <div className="bg-primary-dark flex select-none rounded-t pt-1.5 pb-[2px]">
        {getOneTabComponent()}
      </div>
    );
  };

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      fontSize: 14,
      color: 'blue',
      backgroundColor: state.isSelected ? 'lightblue' : 'white',
    }),
    control: provided => ({
      ...provided,
      border: '2px solid #007BFF',
      borderRadius: '5px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#0056b3',
      },
    }),
  };
  const [selectedOption, setSelectedOption] = useState(null);

  const handleSelectChange = selected => {
    setSelectedOption(selected);
    switch (selected?.value) {
      case 'Mammo':
        updateActiveTabIndex(0);
        break;
      case 'GBC':
        updateActiveTabIndex(1);
        break;
      default:
        updateActiveTabIndex(2);
        break;
    }
    // const index = selected?.value === 'Mammo' ? 0 : 1;
  };

  return (
    <div
      className={classnames(className, baseClasses, classesMap[openStatus][side])}
      style={style}
    >
      {side === 'right' ? null : side === 'left' && panelOpen ? (
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

      {side === 'right' ? (
        <Select
          options={[
            { value: 'Mammo', label: 'Mammo' },
            { value: 'GBC', label: 'GBC' },
            { value: 'X-Ray', label: 'X-Ray' },
          ]}
          styles={customStyles}
          onChange={handleSelectChange} // Use the handler to update state
        />
      ) : null}
      {selectedOption ? (
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
        <React.Fragment></React.Fragment>
      )}
    </div>
  );
};

SidePanelModified.propTypes = {
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

export default SidePanelModified;
