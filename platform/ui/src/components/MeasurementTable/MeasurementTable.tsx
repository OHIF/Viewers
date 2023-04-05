import React from 'react';
import { ServicesManager } from '@ohif/core';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import MeasurementItem from './MeasurementItem';

const MeasurementTable = ({
  data,
  title,
  onClick,
  onEdit,
  servicesManager,
}) => {
  servicesManager = servicesManager as ServicesManager;
  const { customizationService } = servicesManager.services;
  const { t } = useTranslation('MeasurementTable');
  const amount = data.length;

  const itemCustomization = customizationService.getCustomization(
    'MeasurementItem',
    {
      content: MeasurementItem,
      contentProps: {},
    }
  );
  const CustomMeasurementItem = itemCustomization.content;

  return (
    <div>
      <div className="flex justify-between px-2 py-1 bg-secondary-main">
        <span className="text-base font-bold tracking-widest text-white uppercase">
          {t(title)}
        </span>
        <span className="text-base font-bold text-white">{amount}</span>
      </div>
      <div className="overflow-hidden ohif-scrollbar max-h-112">
        {data.length !== 0 &&
          data.map((measurementItem, index) => (
            <CustomMeasurementItem
              key={measurementItem.uid}
              uid={measurementItem.uid}
              index={index + 1}
              label={measurementItem.label}
              isActive={measurementItem.isActive}
              displayText={measurementItem.displayText}
              item={measurementItem}
              onClick={onClick}
              onEdit={onEdit}
            />
          ))}
        {data.length === 0 && (
          <div className="flex transition duration-300 bg-black border border-transparent cursor-default group">
            <div className="w-6 py-1 text-base text-center transition duration-300 bg-primary-dark text-primary-light group-hover:bg-secondary-main"></div>
            <div className="flex items-center justify-between flex-1 px-2 py-4">
              <span className="flex items-center flex-1 mb-1 text-base text-primary-light">
                {t('No tracked measurements')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

MeasurementTable.defaultProps = {
  data: [],
  onClick: () => {},
  onEdit: () => {},
};

MeasurementTable.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      uid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      displayText: PropTypes.arrayOf(PropTypes.string),
      isActive: PropTypes.bool,
    })
  ),
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
};

export default MeasurementTable;
