import React from 'react';
import PropTypes from 'prop-types';
import { MeasurementTable } from '@ohif/ui';

const MeasurementsPanel = ({
  descriptionData,
  measurementTableData,
  actionButtons,
}) => {
  const { date, modality, description } = descriptionData;
  console.log(measurementTableData);
  return (
    <>
      <div className="overflow-y-auto overflow-x-hidden invisible-scrollbar">
        <div className="p-2">
          <div className="leading-none">
            <span className="text-white text-base mr-2">{date}</span>
            <span className="px-1 text-black bg-common-bright text-base rounded-sm font-bold">
              {modality}
            </span>
          </div>
          <div className="leading-none">
            <span className="text-base text-primary-light">{description}</span>
          </div>
        </div>
        <MeasurementTable
          data={measurementTableData.data}
          title={measurementTableData.title}
          amount={measurementTableData.amount}
          onClick={measurementTableData.onClick}
          onEdit={measurementTableData.onEdit}
        />
      </div>
      <div className="p-4 flex justify-center">{actionButtons}</div>
    </>
  );
};

MeasurementsPanel.defaultProps = {
  actionButtons: null,
};

MeasurementsPanel.propTypes = {
  descriptionData: PropTypes.shape({
    date: PropTypes.string,
    modality: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  measurementTableData: PropTypes.shape({
    title: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    data: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string,
        displayText: PropTypes.string,
        isActive: PropTypes.bool,
      })
    ),
    onClick: PropTypes.func,
    onEdit: PropTypes.func,
  }).isRequired,
  actionButtons: PropTypes.node,
};

export default MeasurementsPanel;
