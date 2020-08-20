import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon } from '../';

const SegmentationTable = ({ title, amount, data }) => {
  const [activeItem, setActiveItem] = useState(null);

  // TODO: colorLUT should be defined in the application
  const colorLUT = [
    '#932a13',
    '#821393',
    '#2b7fc4',
    '#12c457',
    '#7f7d2e',
    '#7f2e4a',
    '#866943',
    '#65ae7f',
    '#334b5f',
    '#3cb0dc',
    '#292ac9',
    '#629753',
  ];

  return (
    <div>
      <div className="flex justify-between px-2 py-1 bg-secondary-main">
        <span className="text-base font-bold text-white tracking-widest uppercase">
          {title}
        </span>
        <div className="flex">
          <span className="text-base font-bold text-white">{amount}</span>
          <Icon
            name="eye-hidden"
            className="w-6 text-white ml-2 cursor-pointer transition duration-300 hover:opacity-80"
            onClick={() => alert('TBD')}
          />
        </div>
      </div>
      <div className="overflow-y-auto overflow-x-hidden ohif-scrollbar max-h-64">
        {!!data.length &&
          data.map((e, i) => {
            const itemKey = i;
            const currentItem = i + 1;
            const isActive = !!activeItem && activeItem[title] === i;

            const handleOnClick = () => {
              setActiveItem((s) => {
                return {
                  ...s,
                  [title]: s && s[title] === itemKey ? null : itemKey,
                };
              });
            };

            return (
              <div
                key={i}
                className={classnames(
                  'group flex cursor-default bg-black border border-transparent transition duration-300 rounded overflow-hidden',
                  {
                    'border-primary-light': isActive,
                  }
                )}
                onClick={handleOnClick}
                onKeyDown={handleOnClick}
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
                  {currentItem}
                </div>
                <div className="px-2 py-1 flex flex-1 items-center justify-between">
                  <span className="text-base text-primary-light mb-1 flex items-center flex-1">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: colorLUT[i] }}
                    ></div>
                    Label short description
                  </span>
                  <Icon
                    className={classnames(
                      'text-white w-6 cursor-pointer transition duration-300 hover:opacity-80'
                    )}
                    name="eye-visible"
                    onClick={(e) => {
                      // stopPropagation needed to avoid disable the current active item
                      e.stopPropagation();
                      alert('Toggle');
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

SegmentationTable.defaultProps = {
  amount: null,
  data: [],
};

SegmentationTable.propTypes = {
  title: PropTypes.string.isRequired,
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  data: PropTypes.array, // TODO: define better the array structure
};

export default SegmentationTable;
