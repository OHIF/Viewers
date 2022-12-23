import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, {
  A11y,
  Controller,
  Pagination,
  Scrollbar,
  Navigation,
} from 'swiper';

import { Button, Icon, IconButton, Tooltip } from '../';

import 'swiper/css';
import 'swiper/css/navigation';
import './style.css';

const borderSize = 4;
const expandedWidth = 248;
const collapsedWidth = 25;

const baseStyle = {
  maxWidth: `${expandedWidth}px`,
  width: `${expandedWidth}px`,
};

const collapsedHideWidth = expandedWidth - collapsedWidth - borderSize;
const styleMap = {
  open: {
    left: { marginLeft: '0px' },
    right: { marginRight: '0px' },
  },
  closed: {
    left: { marginLeft: `-${collapsedHideWidth}px` },
    right: { marginRight: `-${collapsedHideWidth}px` },
  },
};

const baseClasses =
  'transition-all duration-300 ease-in-out h-100 bg-black border-black justify-start box-content flex flex-col';

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
  left: 'push-left',
  right: 'push-right',
};

const position = {
  left: {
    right: 5,
  },
  right: {
    left: 5,
  },
};

const SidePanel = ({
  side,
  className,
  activeTabIndex: activeTabIndexProp,
  tabs,
}) => {
  const { t } = useTranslation('SidePanel');

  const [panelOpen, setPanelOpen] = useState(activeTabIndexProp !== null);
  const [activeTabIndex, setActiveTabIndex] = useState(activeTabIndexProp || 0);
  const swiperRef = useRef() as any;
  const [swiper, setSwiper] = useState<any>();

  const prevRef = React.useRef();
  const nextRef = React.useRef();

  const openStatus = panelOpen ? 'open' : 'closed';
  const style = Object.assign({}, styleMap[openStatus][side], baseStyle);

  const ActiveComponent = tabs[activeTabIndex].content;

  useEffect(() => {
    if (panelOpen && swiper) {
      swiper.slideTo(activeTabIndex, 500);
    }
  }, [panelOpen, swiper]);

  useEffect(() => {
    if (swiper) {
      swiper.params.navigation.prevEl = prevRef.current;
      swiper.params.navigation.nextEl = nextRef.current;
      swiper.navigation.init();
      swiper.navigation.update();
    }
  }, [swiper]);

  const getCloseStateComponent = () => {
    const _childComponents = Array.isArray(tabs) ? tabs : [tabs];
    return (
      <>
        <div
          className={classnames(
            'bg-secondary-dark h-[28px] flex items-center w-full rounded-md cursor-pointer',
            side === 'left' ? 'pr-2 justify-end' : 'pl-2 justify-start'
          )}
          onClick={() => {
            setPanelOpen(prev => !prev);
          }}
          data-cy={`side-panel-header-${side}`}
        >
          <Icon
            name={'navigation-panel-right-reveal'}
            className={classnames(
              'text-primary-active',
              side === 'left' && 'transform rotate-180'
            )}
          />
        </div>
        <div className={classnames('flex flex-col space-y-3 mt-3')}>
          {_childComponents.map((childComponent, index) => (
            <Tooltip
              position={side === 'left' ? 'right' : 'left'}
              key={index}
              content={`${childComponent.label}`}
              className={classnames(
                'flex items-center',
                side === 'left' ? 'justify-end ' : 'justify-start '
              )}
            >
              <IconButton
                id={`${childComponent.name}-btn`}
                variant="text"
                color="inherit"
                size="initial"
                className="text-primary-active"
                onClick={() => {
                  setActiveTabIndex(index);
                  setPanelOpen(true);
                }}
              >
                <Icon
                  name={childComponent.iconName}
                  className="text-primary-active"
                  style={{
                    width: '22px',
                    height: '22px',
                  }}
                />
              </IconButton>
            </Tooltip>
          ))}
        </div>
      </>
    );
  };

  return (
    <div
      className={classnames(
        className,
        baseClasses,
        classesMap[openStatus][side]
      )}
      style={style}
    >
      {panelOpen ? (
        <React.Fragment>
          {/** Panel Header with Arrow and Close Actions */}
          <div
            className={classnames(
              'px-[10px] bg-primary-dark h-9 cursor-pointer flex shrink-0',
              tabs.length === 1 && 'mb-1'
            )}
            onClick={() => {
              setPanelOpen(prev => !prev);
              // slideToActivePanel();
            }}
            data-cy={`side-panel-header-${side}`}
          >
            <Button
              variant="text"
              color="inherit"
              border="none"
              rounded="none"
              className="flex flex-row items-center px-3 relative w-full"
              name={tabs.length === 1 ? `${tabs[activeTabIndex].name}` : ''}
            >
              <Icon
                name={openStateIconName[side]}
                className={classnames(
                  'text-primary-active absolute',
                  side === 'left' && 'order-last'
                )}
                style={{ ...position[side] }}
              />
              {/* Todo: ass secondary label here */}
              <span className="text-primary-active">
                {tabs.length === 1 && tabs[activeTabIndex].label}
              </span>
            </Button>
          </div>
          {tabs.length > 1 &&
            _getMoreThanOneTabLayout(
              swiperRef,
              setSwiper,
              prevRef,
              nextRef,
              tabs,
              activeTabIndex,
              setActiveTabIndex,
              setPanelOpen
            )}
          {/** carousel navigation with the arrows */}
          {/** only show carousel nav if tabs are more than 3 tabs */}
          {tabs.length > 3 && (
            <div className="text-primary-active w-full flex justify-end gap-2 bg-primary-dark py-1 px-2">
              <button ref={prevRef} className="swiper-button-prev-custom">
                <Icon
                  name={'icon-prev'}
                  className={classnames('text-primary-active')}
                />
              </button>
              <button ref={nextRef} className="swiper-button-next-custom">
                <Icon
                  name={'icon-next'}
                  className={classnames('text-primary-active')}
                />
              </button>
            </div>
          )}
          <ActiveComponent />
        </React.Fragment>
      ) : (
        <React.Fragment>{getCloseStateComponent()}</React.Fragment>
      )}
    </div>
  );
};

SidePanel.defaultProps = {
  defaultComponentOpen: null,
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
};

function _getMoreThanOneTabLayout(
  swiperRef: any,
  setSwiper: React.Dispatch<any>,
  prevRef: React.MutableRefObject<undefined>,
  nextRef: React.MutableRefObject<undefined>,
  tabs: any,
  activeTabIndex: any,
  setActiveTabIndex: React.Dispatch<any>,
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>
) {
  return (
    <div
      className="collapse-sidebar relative"
      style={{
        backgroundColor: '#06081f',
      }}
    >
      <div className="w-full">
        <Swiper
          onInit={(core: SwiperCore) => {
            swiperRef.current = core.el;
          }}
          simulateTouch={false}
          modules={[Navigation, Pagination, Scrollbar, A11y, Controller]}
          slidesPerView={3}
          spaceBetween={5}
          onSwiper={swiper => setSwiper(swiper)}
          navigation={{
            prevEl: prevRef?.current,
            nextEl: nextRef?.current,
          }}
        >
          {tabs.map((obj, index) => (
            <SwiperSlide key={index}>
              <div
                className={classnames(
                  index === activeTabIndex
                    ? 'bg-secondary-main text-white'
                    : 'text-aqua-pale',
                  'flex cursor-pointer px-4 py-1 rounded-[4px]  flex-col justify-center items-center text-center hover:text-white'
                )}
                key={index}
                onClick={() => {
                  setActiveTabIndex(index);
                  setPanelOpen(true);
                }}
                data-cy={`${obj.name}-btn`}
              >
                <span>
                  <Icon
                    name={obj.iconName}
                    className={classnames(
                      index === activeTabIndex
                        ? 'text-white'
                        : 'text-primary-active'
                    )}
                    style={{
                      width: '22px',
                      height: '22px',
                    }}
                  />
                </span>
                <span className="text-[10px] select-none font-medium whitespace-nowrap mt-[5px]">
                  {obj.label}
                </span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

export default SidePanel;
