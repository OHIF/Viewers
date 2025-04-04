import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Icons, Tooltip, TooltipTrigger, TooltipContent } from '../../components';

const classes = {
  infoHeader: 'text-base text-primary-light',
  infoText: 'text-base text-white max-w-24 truncate',
  firstRow: 'flex flex-col',
  row: 'flex flex-col ml-4',
};

/**
 * A small info icon that, when clicked, can reveal additional patient details in a tooltip overlay.
 */
function PatientInfo({
  patientName,
  patientSex,
  patientAge,
  MRN,
  thickness,
  thicknessUnits,
  spacing,
  scanner,
  isOpen,
  showPatientInfoRef,
}) {
  const { t } = useTranslation('PatientInfo');

  // strip leading '0' from age if present
  while (patientAge.charAt(0) === '0') {
    patientAge = patientAge.substr(1);
  }

  return (
    <div ref={showPatientInfoRef}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Icons.Info className="hover:text-primary-light cursor-pointer text-white" />
        </TooltipTrigger>
        {isOpen && (
          <TooltipContent
            side="bottom"
            align="end"
          >
            <div className="flex py-2">
              <div className="flex pt-1">
                <Icons.InfoLink className="text-primary-main w-4" />
              </div>
              <div className="ml-2 flex flex-col">
                <span
                  className="text-base font-bold text-white"
                  title={patientName}
                >
                  {patientName}
                </span>
                <div className="border-secondary-main mt-4 mb-4 flex border-b pb-4">
                  <div className={classnames(classes.firstRow)}>
                    <span className={classnames(classes.infoHeader)}>{t('Sex')}</span>
                    <span
                      className={classnames(classes.infoText)}
                      title={patientSex}
                    >
                      {patientSex}
                    </span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>{t('Age')}</span>
                    <span
                      className={classnames(classes.infoText)}
                      title={patientAge}
                    >
                      {patientAge}
                    </span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>{t('MRN')}</span>
                    <span
                      className={classnames(classes.infoText)}
                      title={MRN}
                    >
                      {MRN}
                    </span>
                  </div>
                </div>
                <div className="flex">
                  <div className={classnames(classes.firstRow)}>
                    <span className={classnames(classes.infoHeader)}>{t('Thickness')}</span>
                    <span
                      className={classnames(classes.infoText)}
                      title={thickness}
                    >
                      {thicknessUnits ? `${thickness}${thicknessUnits}` : `${thickness}`}
                    </span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>{t('Spacing')}</span>
                    <span
                      className={classnames(classes.infoText)}
                      title={spacing}
                    >
                      {spacing}
                    </span>
                  </div>
                  <div className={classnames(classes.row)}>
                    <span className={classnames(classes.infoHeader)}>{t('Scanner')}</span>
                    <span
                      className={classnames(classes.infoText)}
                      title={scanner}
                    >
                      {scanner}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}

PatientInfo.propTypes = {
  patientName: PropTypes.string,
  patientSex: PropTypes.string,
  patientAge: PropTypes.string,
  MRN: PropTypes.string,
  thickness: PropTypes.string,
  thicknessUnits: PropTypes.string,
  spacing: PropTypes.string,
  scanner: PropTypes.string,
  isOpen: PropTypes.bool,
  showPatientInfoRef: PropTypes.object,
};

export { PatientInfo };
