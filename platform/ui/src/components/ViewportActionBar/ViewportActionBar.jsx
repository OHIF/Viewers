import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon, ButtonGroup, Button, Tooltip } from '@ohif/ui';

const classes = {
  infoHeader: 'text-base text-primary-light',
  infoText: 'text-base text-white',
  firstRow: 'flex flex-col',
  row: 'flex flex-col ml-4',
};

const ViewportActionBar = ({ studyData, onSeriesChange }) => {
  const {
    label,
    isTracked,
    isLocked,
    modality,
    studyDate,
    currentSeries,
    seriesDescription,
    patientInformation,
  } = studyData;

  const {
    patientName,
    patientSex,
    patientAge,
    MRN,
    thickness,
    spacing,
    scanner,
  } = patientInformation;

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
      <div className="relative">
        {!isTracked ? (
          <Icon name="dotted-circle" className="text-primary-light w-6" />
        ) : (
          <Tooltip
            position="bottom-left"
            content={
              <div className="flex py-2">
                <div className="flex pt-1">
                  <Icon name="info-link" className="w-4 text-primary-main" />
                </div>
                <div className="flex ml-4">
                  <span className="text-base text-common-light">
                    Series is
                    <span className="text-white font-bold"> tracked</span> and
                    can be viewed <br /> in the measurement panel
                  </span>
                </div>
              </div>
            }
          >
            <Icon name="tracked" className="text-primary-light w-6" />
          </Tooltip>
        )}
      </div>
    );
  };
  return (
    <div className="flex items-center mx-2 mt-2 pb-2 border-b border-primary-light">
      <div className="flex flex-grow">
        <div className="flex items-center">
          {renderIconStatus()}
          <span className="text-large text-white ml-2">{label}</span>
        </div>
        <div className="flex flex-col justify-start ml-4">
          <div className="flex">
            <span className="text-base text-white">{studyDate}</span>
            <span className="border-l border-primary-light ml-2 pl-2 text-base text-primary-light">
              S: {currentSeries}
            </span>
          </div>
          <div className="flex">
            <p className="text-base truncate max-w-sm text-primary-light">
              {seriesDescription}
            </p>
          </div>
        </div>
      </div>
      <div className="ml-2">
        <ButtonGroup>
          <Button
            size="initial"
            className="py-1 px-2"
            onClick={() => onSeriesChange('left')}
          >
            <Icon name="chevron-left" className="text-white w-4" />
          </Button>
          <Button
            size="initial"
            className="py-1 px-2"
            onClick={() => onSeriesChange('right')}
          >
            <Icon name="chevron-right" className="text-white w-4" />
          </Button>
        </ButtonGroup>
      </div>
      <div className="flex ml-4 mr-2">
        <Tooltip
          position="bottom-right"
          content={
            <div className="flex py-2">
              <div className="flex pt-1">
                <Icon name="info-link" className="w-4 text-primary-main" />
              </div>
              <div className="flex flex-col ml-2">
                <span className="text-base font-bold text-white">
                  {patientName}
                </span>
                <div className="flex mt-4 pb-4 mb-4 border-b border-secondary-main">
                  <div className={classnames(classes.firstRow)}>
                    <span className={classnames(classes.infoHeader)}>Sex</span>
                    <span className={classnames(classes.infoText)}>
                      {patientSex}
                    </span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>Age</span>
                    <span className={classnames(classes.infoText)}>
                      {patientAge}
                    </span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>MRN</span>
                    <span className={classnames(classes.infoText)}>{MRN}</span>
                  </div>
                </div>
                <div className="flex">
                  <div className={classnames(classes.firstRow)}>
                    <span className={classnames(classes.infoHeader)}>
                      Thickness
                    </span>
                    <span className={classnames(classes.infoText)}>
                      {thickness}
                    </span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>
                      Spacing
                    </span>
                    <span className={classnames(classes.infoText)}>
                      {spacing}
                    </span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>
                      Scanner
                    </span>
                    <span className={classnames(classes.infoText)}>
                      {scanner}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <div className="showTooltipOnHover flex justify-end relative">
            <div className="relative">
              <Icon name="profile" className="text-white w-5" />
              <Icon
                name="info-link"
                className="bg-black text-white w-5 absolute"
                style={{ right: -7, bottom: -10 }}
              />
            </div>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

ViewportActionBar.propTypes = {
  onSeriesChange: PropTypes.func.isRequired,
  studyData: PropTypes.shape({
    label: PropTypes.string.isRequired,
    isTracked: PropTypes.bool.isRequired,
    isLocked: PropTypes.bool.isRequired,
    studyDate: PropTypes.string.isRequired,
    currentSeries: PropTypes.number.isRequired,
    seriesDescription: PropTypes.string.isRequired,
    modality: PropTypes.string.isRequired,
    patientInformation: PropTypes.shape({
      patientName: PropTypes.string.isRequired,
      patientSex: PropTypes.string.isRequired,
      patientAge: PropTypes.string.isRequired,
      MRN: PropTypes.string.isRequired,
      thickness: PropTypes.string.isRequired,
      spacing: PropTypes.string.isRequired,
      scanner: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

export default ViewportActionBar;
