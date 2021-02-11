import React from 'react';
import PropTypes from 'prop-types';

import MeasurementItem from './MeasurementItem';

const MeasurementTable = ({ data, title, amount, onClick, onEdit }) => {
  return (
    <div>
      <div className="flex justify-between px-2 py-1 bg-secondary-main">
        <span className="text-base font-bold tracking-widest text-white uppercase">
          {title}
        </span>
        <span className="text-base font-bold text-white">{amount}</span>
      </div>
      <div className="overflow-x-hidden overflow-y-auto ohif-scrollbar max-h-112">
        {data.length !== 0 &&
          data.map((measurementItem, index) => (
            <MeasurementItem
              key={measurementItem.id}
              id={measurementItem.id}
              index={index + 1}
              label={measurementItem.label}
              isActive={measurementItem.isActive}
              displayText={measurementItem.displayText}
              onClick={onClick}
              onEdit={onEdit}
            />
          ))}
        {data.length === 0 && (
          <div className="flex transition duration-300 bg-black border border-transparent cursor-default group">
            <div className="w-6 py-1 text-base text-center transition duration-300 bg-primary-dark text-primary-light group-hover:bg-secondary-main"></div>
            <div className="flex items-center justify-between flex-1 px-2 py-4">
              <span className="flex items-center flex-1 mb-1 text-base text-primary-light">
                No tracked measurements
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

MeasurementTable.defaultProps = {
  amount: null,
  data: [],
  onClick: () => {},
  onEdit: () => {},
};

MeasurementTable.propTypes = {
  title: PropTypes.string.isRequired,
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      displayText: PropTypes.arrayOf(PropTypes.string),
      isActive: PropTypes.bool,
    })
  ),
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
};

export default MeasurementTable;
