import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import useOnClickOutside from '../../utils/useOnClickOutside';
import { StringNumber } from '../../types';

import LegacyPatientInfo from '../LegacyPatientInfo';
import Icon from '../Icon';
import LegacyButtonGroup from '../LegacyButtonGroup';
import LegacyButton from '../LegacyButton';
import LegacyCinePlayer from '../LegacyCinePlayer';

const LegacyViewportActionBar = ({
  studyData,
  showNavArrows = true,
  showStatus = true,
  showCine = false,
  cineProps = {},
  showPatientInfo: patientInfoVisibility = false,
  onArrowsClick,
  onDoubleClick,
  getStatusComponent,
}) => {
  const [showPatientInfo, setShowPatientInfo] = useState(patientInfoVisibility);

  const { label, useAltStyling, studyDate, currentSeries, seriesDescription, patientInformation } =
    studyData;

  const { patientName, patientSex, patientAge, MRN, thickness, spacing, scanner } =
    patientInformation;

  const onPatientInfoClick = () => setShowPatientInfo(!showPatientInfo);
  const closePatientInfo = () => setShowPatientInfo(false);
  const showPatientInfoRef = useRef(null);
  const clickOutsideListener = useOnClickOutside(showPatientInfoRef, closePatientInfo);

  useEffect(() => {
    if (showPatientInfo) {
      clickOutsideListener.add();
    } else {
      clickOutsideListener.remove();
    }

    return () => clickOutsideListener.remove();
  }, [clickOutsideListener, showPatientInfo]);

  const borderColor = useAltStyling ? '#365A6A' : '#1D205A';

  let backgroundColor = '#020424';
  if (useAltStyling) {
    backgroundColor = '#031923';
  }

  return (
    <div
      className="-mt-2 flex select-none flex-wrap items-center border-b p-2"
      style={{
        borderColor: borderColor,
        backgroundColor: backgroundColor,
      }}
      onDoubleClick={onDoubleClick}
      onContextMenu={e => e.preventDefault()}
    >
      <div className="min-w-48 mt-2 flex flex-1 grow">
        <div className="flex items-center">
          <span className="text-large mr-2 text-white">{label}</span>
          {showStatus && getStatusComponent && getStatusComponent()}
        </div>
        <div className="ml-4 flex flex-col justify-start">
          <div className="flex">
            <span className="text-base text-white">{studyDate}</span>
            <span className="border-primary-light text-primary-light ml-2 border-l pl-2 text-base">
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
            <p className="max-w-40 text-primary-light truncate text-base">{seriesDescription}</p>
          </div>
        </div>
      </div>
      {showNavArrows && !showCine && (
        <div
          className="mt-2"
          style={{ pointerEvents: 'all' }}
        >
          {/* TODO Revisit design of LegacyButtonGroup later - for now use LegacyButton for its children.*/}
          <LegacyButtonGroup>
            <LegacyButton
              size="initial"
              className="bg-black px-2 py-1"
              border="light"
              onClick={() => onArrowsClick('left')}
            >
              <Icon
                name="chevron-left"
                className="w-4 text-white"
              />
            </LegacyButton>
            <LegacyButton
              size="initial"
              border="light"
              className="bg-black px-2 py-1"
              onClick={() => onArrowsClick('right')}
            >
              <Icon
                name="chevron-right"
                className="w-4 text-white"
              />
            </LegacyButton>
          </LegacyButtonGroup>
        </div>
      )}
      {showCine && !showNavArrows && (
        <div className="min-w-48 max-w-48 mt-2 mr-auto">
          <LegacyCinePlayer {...cineProps} />
        </div>
      )}
      <div
        className="mt-2 ml-4 mr-2 flex h-8"
        onClick={onPatientInfoClick}
      >
        <LegacyPatientInfo
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

LegacyViewportActionBar.propTypes = {
  onArrowsClick: PropTypes.func.isRequired,
  showNavArrows: PropTypes.bool,
  showCine: PropTypes.bool,
  cineProps: PropTypes.object,
  showPatientInfo: PropTypes.bool,
  studyData: PropTypes.shape({
    //
    useAltStyling: PropTypes.bool,
    //
    label: PropTypes.string.isRequired,
    studyDate: PropTypes.string.isRequired,
    currentSeries: StringNumber.isRequired,
    seriesDescription: PropTypes.string.isRequired,
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
  getStatusComponent: PropTypes.func.isRequired,
  onDoubleClick: PropTypes.func.isRequired,
  showStatus: PropTypes.bool,
};

export default LegacyViewportActionBar;
