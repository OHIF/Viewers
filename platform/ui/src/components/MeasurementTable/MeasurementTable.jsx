import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon } from '@ohif/ui';

const MeasurementItem = ({ id, label, displayText, isActive, onClick, onEdit }) => {
  const onEditHandler = event => {
    /* Stop propagation to avoid disable the current active item */
    event.stopPropagation();
    onEdit(id);
  };

  const onClickHandler = event => {
    onClick(id);
  };

  return (
    <div
      className={classnames(
        'group flex cursor-default bg-black border outline-none border-transparent transition duration-300 ',
        {
          'rounded overflow-hidden border-primary-light': isActive,
        }
      )}
      onClick={onClickHandler}
      onKeyDown={onClickHandler}
      role="button"
      tabIndex="0"
    >
      <div
        className={classnames(
          'text-center w-6 py-1 text-base transition duration-300',
          {
            'bg-primary-light text-black': isActive,
            'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
          }
        )}
      >
        {id}
      </div>
      <div className="px-2 py-1 flex flex-1 flex-col relative">
        <span className="text-base text-primary-light mb-1">
          {label}
        </span>
        {displayText.map(line => (
          <span className="pl-2 border-l border-primary-light text-base text-white">
            {line}
          </span>
        ))}
        <Icon
          className={classnames(
            'text-white w-4 absolute cursor-pointer transition duration-300',
            {
              'invisible opacity-0 mr-2': !isActive,
            }
          )}
          name="pencil"
          style={{
            top: 4,
            right: 4,
            transform: isActive ? '' : 'translateX(100%)',
          }}
          onClick={onEditHandler}
        />
      </div>
    </div>
  );
};

const MeasurementTable = ({ data, title, amount, onClick, onEdit }) => {
  console.log(data);
  return (
    <div>
      <div className="flex justify-between px-2 py-1 bg-secondary-main">
        <span className="text-base font-bold text-white tracking-widest uppercase">
          {title}
        </span>
        <span className="text-base font-bold text-white">{amount}</span>
      </div>
      <div className="overflow-y-auto overflow-x-hidden ohif-scrollbar max-h-112">
        {data.length && data.map(measurementItem => (
          <MeasurementItem
            key={measurementItem.id}
            {...measurementItem}
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
