import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon, ButtonGroup, Button, Tooltip } from '@ohif/ui';
import useOnClickOutside from '../../utils/useOnClickOutside';

const classes = {
  infoHeader: 'text-base text-primary-light',
  infoText: 'text-base text-white',
  firstRow: 'flex flex-col',
  row: 'flex flex-col ml-4',
};

const ViewportActionBar = ({
  studyData,
  showNavArrows,
  showPatientInfo: patientInfoVisibility,
  onSeriesChange,
  onHydrationClick,
  onDoubleClick,
}) => {
  const [showPatientInfo, setShowPatientInfo] = useState(patientInfoVisibility);

  // TODO -> Remake this component with a bunch of generic slots that can be filled,
  // Its not generic at all, isTracked etc shouldn't be parts of this component.
  // It shouldn't care that a tracking mode or SR exists.
  // Things like the right/left buttons should be made into smaller
  // Components you can compose.
  // OHIF-200 ticket.

  const {
    label,
    isTracked,
    isLocked,
    isHydrated,
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

  const onPatientInfoClick = () => setShowPatientInfo(!showPatientInfo);
  const closePatientInfo = () => setShowPatientInfo(false);

  const showPatientInfoRef = useRef(null);
  const clickOutsideListener = useOnClickOutside(
    showPatientInfoRef,
    closePatientInfo
  );

  useEffect(() => {
    if (showPatientInfo) {
      clickOutsideListener.add();
    } else {
      clickOutsideListener.remove();
    }

    return () => clickOutsideListener.remove();
  }, [clickOutsideListener, showPatientInfo]);

  const renderIconStatus = () => {
    if (modality === 'SR') {
      const TooltipMessage = isLocked
        ? () => (
            <div>
              This SR is locked. <br />
              Measurements cannot be duplicated.
            </div>
          )
        : () => (
            <div>
              This SR is unlocked. <br />
              You can duplicate measurements on your current report <br /> by
              clicking &apos;Edit&apos;.
            </div>
          );
      return (
        <>
          <Tooltip content={<TooltipMessage />} position="bottom-left">
            <div className="relative flex p-1 border rounded cursor-default border-primary-light">
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
          </Tooltip>
          {!isLocked && !isHydrated && (
            <div className="relative flex p-1 ml-1 border rounded cursor-pointer border-primary-light">
              <span
                className="text-sm font-bold leading-none text-primary-light"
                onClick={onHydrationClick}
              >
                Edit
              </span>
            </div>
          )}
        </>
      );
    }

    const trackedIcon = isTracked ? 'tracked' : 'dotted-circle';

    return (
      <div className="relative">
        <Tooltip
          position="bottom-left"
          content={
            <div className="flex py-2">
              <div className="flex pt-1">
                <Icon name="info-link" className="w-4 text-primary-main" />
              </div>
              <div className="flex ml-4">
                <span className="text-base text-common-light">
                  {isTracked ? (
                    <>
                      Series is
                      <span className="font-bold text-white"> tracked</span> and
                      can be viewed <br /> in the measurement panel
                    </>
                  ) : (
                    <>
                      Measurements for
                      <span className="font-bold text-white"> untracked </span>
                      series <br /> will not be shown in the <br /> measurements
                      panel
                    </>
                  )}
                </span>
              </div>
            </div>
          }
        >
          <Icon name={trackedIcon} className="w-6 text-primary-light" />
        </Tooltip>
      </div>
    );
  };

  return (
    <div
      className="flex items-center p-2 border-b select-none border-primary-light min-h-12"
      onDoubleClick={onDoubleClick}
    >
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
      {showNavArrows && (
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
      )}
      <div className="flex ml-4 mr-2" onClick={onPatientInfoClick}>
        <PatientInfo
          showPatientInfoRef={showPatientInfoRef}
          isOpen={showPatientInfo}
          patientName={patientName}
          patientSex={patientSex}
          patientAge={patientAge}
          MRN={MRN}
          thickness={thickness}
          spacing={spacing}
          scanner={scanner}
        />
      </div>
    </div>
  );
};

ViewportActionBar.propTypes = {
  onSeriesChange: PropTypes.func.isRequired,
  showNavArrows: PropTypes.bool,
  showPatientInfo: PropTypes.bool,
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

ViewportActionBar.defaultProps = {
  showNavArrows: true,
  showPatientInfo: false,
};

function PatientInfo({
  patientName,
  patientSex,
  patientAge,
  MRN,
  thickness,
  spacing,
  scanner,
  isOpen,
  showPatientInfoRef,
}) {
  return (
    <div ref={showPatientInfoRef}>
      <Tooltip
        isSticky
        isDisabled={!isOpen}
        position="bottom-right"
        content={
          isOpen && (
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
                      {thickness ? thickness : 'N/A'}
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
          )
        }
      >
        <div className="relative flex justify-end cursor-pointer">
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
  );
}

export default ViewportActionBar;
