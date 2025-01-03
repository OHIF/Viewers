// File: /ui-next/src/components/Viewport/LegacyViewportActionBar.tsx

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Icons } from '@ohif/ui-next';

import LegacyPatientInfo from './LegacyPatientInfo'; // If needed or inline code
import { Button, ButtonEnums } from '@ohif/ui-next';

/**
 * A legacy version of the viewport action bar, used for older display flows.
 *
 * We still replaced usage of old Icon with new Icons from ui-next.
 */
function LegacyViewportActionBar({
  studyData,
  showNavArrows = true,
  showStatus = true,
  showCine = false,
  cineProps = {},
  showPatientInfo: patientInfoVisibility = false,
  onArrowsClick,
  onDoubleClick,
  getStatusComponent,
}) {
  const [showPatientInfo, setShowPatientInfo] = useState(patientInfoVisibility);

  const { label, useAltStyling, studyDate, currentSeries, seriesDescription, patientInformation } =
    studyData;

  const { patientName, patientSex, patientAge, MRN, thickness, spacing, scanner } =
    patientInformation;

  const onPatientInfoClick = () => setShowPatientInfo(!showPatientInfo);

  const showPatientInfoRef = useRef(null);

  return (
    <div
      className="-mt-2 flex select-none flex-wrap items-center border-b p-2"
      style={{
        borderColor: useAltStyling ? '#365A6A' : '#1D205A',
        backgroundColor: useAltStyling ? '#031923' : '#020424',
      }}
      onDoubleClick={onDoubleClick}
      onContextMenu={e => e.preventDefault()}
    >
      <div className="min-w-48 mt-2 flex flex-1 grow">
        <div className="flex items-center">
          <span className="text-large mr-2 text-white">{label}</span>
          {showStatus && getStatusComponent && getStatusComponent()}
        </div>
        <div className="ml-4 flex flex-col">
          <div className="flex">
            <span className="text-base text-white">{studyDate}</span>
            <span className="border-primary-light text-primary-light ml-2 border-l pl-2 text-base">
              S: {currentSeries}
            </span>
          </div>
          <div className="flex">
            <p className="max-w-40 text-primary-light truncate text-base">{seriesDescription}</p>
          </div>
        </div>
      </div>
      {showNavArrows && !showCine && (
        <div
          className="mt-2"
          style={{ pointerEvents: 'all' }}
        >
          <div className="inline-flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArrowsClick('left')}
              className="bg-black px-2 py-1"
            >
              <Icons.ByName
                name="chevron-left"
                className="w-4 text-white"
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onArrowsClick('right')}
              className="ml-1 bg-black px-2 py-1"
            >
              <Icons.ByName
                name="chevron-right"
                className="w-4 text-white"
              />
            </Button>
          </div>
        </div>
      )}
      {/* Possibly show Cine controls if needed */}
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
}

LegacyViewportActionBar.propTypes = {
  onArrowsClick: PropTypes.func.isRequired,
  showNavArrows: PropTypes.bool,
  showCine: PropTypes.bool,
  cineProps: PropTypes.object,
  showPatientInfo: PropTypes.bool,
  studyData: PropTypes.shape({
    useAltStyling: PropTypes.bool,
    label: PropTypes.string.isRequired,
    studyDate: PropTypes.string.isRequired,
    currentSeries: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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

export { LegacyViewportActionBar };
