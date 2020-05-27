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
        <div className="relative flex p-1 border rounded border-primary-light">
          <span className="text-sm font-bold leading-none text-primary-light">
            SR
          </span>
          {isLocked && (
            <Icon
              name="lock"
              className="absolute w-3 text-white"
              style={{ top: -6, right: -6 }}
            />
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        {!isTracked ? (
          <Icon name="dotted-circle" className="w-6 text-primary-light" />
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
                    <span className="font-bold text-white"> tracked</span> and
                    can be viewed <br /> in the measurement panel
                  </span>
                </div>
              </div>
            }
          >
            <Icon name="tracked" className="w-6 text-primary-light" />
          </Tooltip>
        )}
      </div>
    );
  };
  return (
    <div className="flex items-center p-2 border-b border-primary-light">
      <div className="flex flex-grow">
        <div className="flex items-center">
          {renderIconStatus()}
          <span className="ml-2 text-white text-large">{label}</span>
        </div>
        <div className="flex flex-col justify-start ml-4">
          <div className="flex">
            <span className="text-base text-white">{studyDate}</span>
            <span className="pl-2 ml-2 text-base border-l border-primary-light text-primary-light">
              S: {currentSeries}
            </span>
          </div>
          <div className="flex">
            {/* TODO:
                This is tricky. Our "no-wrap" in truncate means this has a hard
                length. The overflow forces ellipse. If we don't set max width
                appropriately, this causes the ActionBar to overflow.
                Can clean up by setting percentage widths + calc on parent
                containers
             */}
            <p className="text-base truncate max-w-40 text-primary-light">
              {seriesDescription}
            </p>
          </div>
        </div>
      </div>
      <div className="ml-2">
        <ButtonGroup>
          <Button
            size="initial"
            className="px-2 py-1"
            onClick={() => onSeriesChange('left')}
          >
            <Icon name="chevron-left" className="w-4 text-white" />
          </Button>
          <Button
            size="initial"
            className="px-2 py-1"
            onClick={() => onSeriesChange('right')}
          >
            <Icon name="chevron-right" className="w-4 text-white" />
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
                <div className="flex pb-4 mt-4 mb-4 border-b border-secondary-main">
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
          <div className="relative flex justify-end showTooltipOnHover">
            <div className="relative">
              <Icon name="profile" className="w-5 text-white" />
              <Icon
                name="info-link"
                className="absolute w-5 text-white bg-black"
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
