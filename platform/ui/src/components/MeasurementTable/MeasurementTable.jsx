import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import MeasurementItem from './MeasurementItem';

const MeasurementTable = ({ data, title, amount, onClick, onEdit }) => {
  return (
    <div>
      <div className="flex justify-between px-2 py-1 bg-secondary-main">
        <span className="text-base font-bold text-white tracking-widest uppercase">
          {title}
        </span>
        <span className="text-base font-bold text-white">{amount}</span>
      </div>
      <div className="overflow-y-auto overflow-x-hidden ohif-scrollbar max-h-112">
        {data.length && data.map((measurementItem, index) => (
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
        {!data.length && (
          <div
            className={classnames(
              'group flex cursor-default bg-black border border-transparent transition duration-300 '
            )}
          >
            <div
              className={classnames(
                'text-center w-6 py-1 text-base transition duration-300 bg-primary-dark text-primary-light group-hover:bg-secondary-main'
              )}
            ></div>
            <div className="px-2 py-4 flex flex-1 items-center justify-between">
              <span className="text-base text-primary-light mb-1 flex items-center flex-1">
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
  onClick: () => { },
  onEdit: () => { },
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
