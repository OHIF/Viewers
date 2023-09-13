import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Icon from '../Icon';
import Tooltip from '../Tooltip';

const classes = {
  infoHeader: 'text-base text-primary-light',
  infoText: 'text-base text-white max-w-24 truncate',
  firstRow: 'flex flex-col',
  row: 'flex flex-col ml-4',
};

function LegacyPatientInfo({
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
  const { t } = useTranslation('PatientInfo');

  while (patientAge.charAt(0) === '0') {
    patientAge = patientAge.substr(1);
  }

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
                <Icon
                  name="info-link"
                  className="text-primary-main w-4"
                />
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
                      {thickness}
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
          )
        }
      >
        <div className="relative flex cursor-pointer justify-end">
          <div className="relative">
            <Icon
              name="profile"
              className="w-5 text-white"
            />
            <Icon
              name="info-link"
              className="absolute w-5 bg-black text-white"
              style={{ right: -7, bottom: -10 }}
            />
          </div>
        </div>
      </Tooltip>
    </div>
  );
}

LegacyPatientInfo.propTypes = {
  patientName: PropTypes.string,
  patientSex: PropTypes.string,
  patientAge: PropTypes.string,
  MRN: PropTypes.string,
  thickness: PropTypes.string,
  spacing: PropTypes.string,
  scanner: PropTypes.string,
  isOpen: PropTypes.bool,
  showPatientInfoRef: PropTypes.object,
};

export default LegacyPatientInfo;
