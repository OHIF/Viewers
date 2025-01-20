import PropTypes from 'prop-types';
import React, {
  MouseEventHandler,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useResizeObserver } from '../../hooks';
import useOnClickOutside from '../../utils/useOnClickOutside';

import PatientInfo from '../PatientInfo';
import Icon from '../Icon';

export type ViewportActionBarProps = {
  studyData: any;
  onArrowsClick: (arrow: string) => void;
  onDoubleClick: MouseEventHandler;
  getStatusComponent: () => ReactElement;
};

const ViewportActionBar = ({
  studyData,
  onArrowsClick,
  onDoubleClick,
  getStatusComponent,
}: ViewportActionBarProps): JSX.Element => {
  const { label, studyDate, seriesDescription, patientInformation } = studyData;
  const { patientName, patientSex, patientAge, MRN, thickness, thicknessUnits, spacing, scanner } =
    patientInformation;

  // The minimum width that the viewport must be to show the next/prev arrows.
  const arrowsPresentViewportMinWidth = 300;

  // The space left between the study date and the patient info icon when the series description text is zero width.
  // With a zero width series description what we have left is:
  // - a separator (17px)
  // - patient info icon left padding (4px)
  // - series description right margin (4px)
  const zeroWidthSeriesDescriptionSpace = 25;

  const separatorClasses = 'border-l py-2 mx-2 border-secondary-light';
  const textEllipsisClasses = 'overflow-hidden shrink text-ellipsis';
  const arrowClasses = 'cursor-pointer shrink-0 mr-2 text-white hover:text-primary-light';

  const componentRootElemRef = (elem: HTMLElement) => {
    setComponentRootElem(elem);
  };
  const studyDateElemRef = useRef<HTMLElement>(null);
  const seriesDescElemRef = useRef<HTMLElement>(null);
  const showPatientInfoElemRef = useRef<HTMLElement>(null);

  const onPatientInfoClick = () => setShowPatientInfo(!showPatientInfo);
  const closePatientInfo = () => setShowPatientInfo(false);

  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const [showSeriesDesc, setShowSeriesDesc] = useState(true);
  const [showArrows, setShowArrows] = useState(true);
  const [componentRootElem, setComponentRootElem] = useState(null);

  const studyDateClasses = () =>
    `text-white ${showSeriesDesc ? '' : `mr-1 ${textEllipsisClasses}`}`;

  const patientInfoClasses = () => (showArrows ? '' : 'pl-1 ml-auto');

  const clickOutsideListener = useOnClickOutside(showPatientInfoElemRef, closePatientInfo);

  useEffect(() => {
    if (showPatientInfo) {
      clickOutsideListener.add();
    } else {
      clickOutsideListener.remove();
    }

    return () => clickOutsideListener.remove();
  }, [clickOutsideListener, showPatientInfo]);

  /**
   * Handles what gets hidden and what gets shown during a resize of the viewport.
   */
  const resizeCallback = useCallback(() => {
    if (!componentRootElem) {
      return;
    }

    const componentRootElemBBox = componentRootElem.getBoundingClientRect();

    // Show or hide the arrows based on the viewport/root element width.
    if (componentRootElemBBox.width < arrowsPresentViewportMinWidth) {
      setShowArrows(false);
    } else {
      setShowArrows(true);
    }

    const studyDateElemBBox = studyDateElemRef.current.getBoundingClientRect();
    const showPatientInfoElemBBox = showPatientInfoElemRef.current.getBoundingClientRect();

    if (showPatientInfoElemBBox.left - studyDateElemBBox.right <= zeroWidthSeriesDescriptionSpace) {
      // The area to display the series description is zero, so don't show the series description element.
      setShowSeriesDesc(false);
    } else {
      setShowSeriesDesc(true);
    }
  }, [componentRootElem]);

  useResizeObserver(componentRootElem, resizeCallback);

  return (
    <div
      ref={componentRootElemRef}
      className="pointer-events-auto flex h-8 shrink-0 select-none items-center overflow-visible whitespace-nowrap px-2 text-base"
      onDoubleClick={onDoubleClick}
    >
      {getStatusComponent()}
      {!!label?.length && <span className="text-aqua-pale text-large ml-1">{label}</span>}
      <div className={separatorClasses}></div>
      <span
        data-cy="studyDate"
        ref={studyDateElemRef}
        className={studyDateClasses()}
      >
        {studyDate}
      </span>
      {showSeriesDesc && (
        <>
          <div className={separatorClasses}></div>
          <span
            ref={seriesDescElemRef}
            className={`text-aqua-pale mr-1 ${textEllipsisClasses}`}
          >
            {seriesDescription}
          </span>
        </>
      )}
      {showArrows && (
        <>
          <Icon
            className={`ml-auto ${arrowClasses}`}
            name="chevron-prev"
            onClick={() => onArrowsClick('left')}
          />
          <Icon
            className={arrowClasses}
            name="chevron-next"
            onClick={() => onArrowsClick('right')}
          />
        </>
      )}
      <div
        className={patientInfoClasses()}
        onClick={onPatientInfoClick}
      >
        <PatientInfo
          showPatientInfoRef={showPatientInfoElemRef}
          isOpen={showPatientInfo}
          patientName={patientName}
          patientSex={patientSex}
          patientAge={patientAge}
          MRN={MRN}
          thickness={thickness}
          thicknessUnits={thicknessUnits}
          spacing={spacing}
          scanner={scanner}
        />
      </div>
    </div>
  );
};

ViewportActionBar.propTypes = {
  onArrowsClick: PropTypes.func.isRequired,
  studyData: PropTypes.shape({
    //
    useAltStyling: PropTypes.bool,
    //
    label: PropTypes.string.isRequired,
    studyDate: PropTypes.string.isRequired,
    seriesDescription: PropTypes.string.isRequired,
    patientInformation: PropTypes.shape({
      patientName: PropTypes.string.isRequired,
      patientSex: PropTypes.string.isRequired,
      patientAge: PropTypes.string.isRequired,
      MRN: PropTypes.string.isRequired,
      thickness: PropTypes.string.isRequired,
      thicknessUnits: PropTypes.string,
      spacing: PropTypes.string.isRequired,
      scanner: PropTypes.string.isRequired,
    }),
  }).isRequired,
  getStatusComponent: PropTypes.func.isRequired,
};

export default ViewportActionBar;
