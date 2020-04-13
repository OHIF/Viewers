import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon, ButtonGroup, Button } from '@ohif/ui';

const classes = {
  infoHeader: 'text-base text-primary-light',
  infoText: 'text-base text-white',
  firstRow: 'flex flex-col',
  row: 'flex flex-col ml-4',
};

const ViewportActionBar = ({ isTracked, isLocked, modality }) => {
  const renderIconStatus = () => {
    if (modality === 'SR') {
      return (
        <div className="flex p-1 border-primary-light border rounded relative">
          <span className="leading-none text-sm font-bold text-primary-light">
            SR
          </span>
          {isLocked && (
            <Icon
              name="lock"
              className="w-3 text-white absolute"
              style={{ top: -6, right: -6 }}
            />
          )}
        </div>
      );
    }

    return (
      <div className="showTooltipOnHover relative">
        <Icon
          name={isTracked ? 'tracked' : 'dotted-circle'}
          className="text-primary-light w-6"
        />
        {isTracked && (
          <div
            className={classnames(
              'tooltip tooltip-top-left absolute bg-primary-dark border border-secondary-main text-white text-base rounded py-1 px-4 inset-x-auto top-full mt-2 w-max-content'
            )}
          >
            <div className="flex py-2">
              <div className="flex pt-1">
                <Icon name="info-link" className="w-4 text-primary-main" />
              </div>
              <div className="flex ml-4">
                <span className="text-base text-common-light">
                  Series is
                  <span className="text-white font-bold"> tracked</span> and can
                  be viewed <br /> in the measurement panel
                </span>
              </div>
            </div>
            <svg
              className="absolute text-primary-dark h-4 left-0 stroke-secondary-main"
              style={{ top: -15 }}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path fill="currentColor" d="M24 22h-24l12-20z" />
            </svg>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="flex items-center mx-2 mt-2 pb-2 border-b border-primary-light">
      <div className="flex flex-grow">
        <div className="flex items-center">
          {renderIconStatus()}
          <span className="text-large text-white ml-2">A</span>
        </div>
        <div className="flex flex-col justify-start ml-4">
          <div className="flex">
            <span className="text-base text-white">07-Sep-2010</span>
            <span className="border-l border-primary-light ml-2 pl-2 text-base text-primary-light">
              S: 1
            </span>
          </div>
          <div className="flex">
            <span className="text-base text-primary-light">
              Series description lorem ipsum dolor sit...
            </span>
          </div>
        </div>
      </div>
      <div className="ml-2">
        <ButtonGroup>
          <Button size="initial" className="py-1 px-2">
            <Icon name="chevron-left" className="text-white w-4" />
          </Button>
          <Button size="initial" className="py-1 px-2">
            <Icon name="chevron-right" className="text-white w-4" />
          </Button>
        </ButtonGroup>
      </div>
      <div className="flex ml-4 mr-2">
        <div className="showTooltipOnHover flex justify-end relative">
          <div className="relative">
            <Icon name="profile" className="text-white w-5" />
            <Icon
              name="info-link"
              className="bg-black text-white w-5 absolute"
              style={{ right: -7, bottom: -10 }}
            />
          </div>
          <div
            className={classnames(
              'tooltip tooltip-top-right absolute bg-primary-dark border border-secondary-main text-white text-base rounded py-1 px-4 inset-x-auto top-full mt-2 w-max-content ml-1'
            )}
          >
            <div className="flex py-2">
              <div className="flex pt-1">
                <Icon name="info-link" className="w-4 text-primary-main" />
              </div>
              <div className="flex flex-col ml-2">
                <span className="text-base font-bold text-white">
                  Smith, Jane
                </span>
                <div className="flex mt-4 pb-4 mb-4 border-b border-secondary-main">
                  <div className={classnames(classes.firstRow)}>
                    <span className={classnames(classes.infoHeader)}>Sex</span>
                    <span className={classnames(classes.infoText)}>F</span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>Age</span>
                    <span className={classnames(classes.infoText)}>59</span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>MRN</span>
                    <span className={classnames(classes.infoText)}>
                      10000001
                    </span>
                  </div>
                </div>
                <div className="flex">
                  <div className={classnames(classes.firstRow)}>
                    <span className={classnames(classes.infoHeader)}>
                      Thickness
                    </span>
                    <span className={classnames(classes.infoText)}>5.00mm</span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>
                      Spacing
                    </span>
                    <span className={classnames(classes.infoText)}>
                      1.25 mm
                    </span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>
                      Scanner
                    </span>
                    <span className={classnames(classes.infoText)}>
                      Aquilion
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <svg
              className="absolute text-primary-dark h-4 right-0 stroke-secondary-main"
              style={{ top: -15 }}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path fill="currentColor" d="M24 22h-24l12-20z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

ViewportActionBar.defaultProps = {
  isLocked: false,
};

ViewportActionBar.propTypes = {
  isTracked: PropTypes.bool.isRequired,
  isLocked: PropTypes.bool,
  modality: PropTypes.string.isRequired,
};

export default ViewportActionBar;
