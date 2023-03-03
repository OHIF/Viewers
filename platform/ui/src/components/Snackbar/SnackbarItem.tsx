import React, { useEffect } from 'react';
import classNames from 'classnames';
import Icon from '../Icon';

import SnackbarTypes from './SnackbarTypes';

const iconClasses = {
  [SnackbarTypes.INFO]: 'notifications-info',
  [SnackbarTypes.WARNING]: 'notifications-warning',
  [SnackbarTypes.SUCCESS]: 'notifications-success',
  [SnackbarTypes.ERROR]: 'notifications-error',
};

const SnackbarItem = ({ options, onClose }) => {
  const handleClose = () => onClose(options.id);

  useEffect(() => {
    if (options.autoClose) {
      setTimeout(() => handleClose(), options.duration);
    }
  }, []);

  const typeClasses = {
    [SnackbarTypes.INFO]: 'bg-[#bed1db]',
    [SnackbarTypes.WARNING]: 'bg-[#ebe5c4]',
    [SnackbarTypes.SUCCESS]: 'bg-[#c6d9bf]',
    [SnackbarTypes.ERROR]: 'bg-[#dabdbe]',
  };

  const hidden =
    'duration-300 transition-all ease-in-out h-0 opacity-0 pt-0 mb-0 pb-0';

  return (
    <div
      className={classNames(
        `${options.visible ? '' : hidden} sb-item`,
        typeClasses[options.type]
      )}
    >
      <div className="flex ">
        <div
          onClick={handleClose}
          className="w-5 h-5 rounded-full absolute flex items-center justify-center right-0 top-0 mr-2 mt-2 text-[#0944b3]"
        >
          <Icon name="close" className="w-5 h-5 text-black" />
        </div>
        <Icon name={iconClasses[options.type]} className="w-5 h-5 mt-[1px]" />
        <div className="flex-col ml-2">
          {/* </span> */}
          {options.title && (
            <div className="break-normal text-lg font-bold text-black">
              {options.title}
            </div>
          )}
          {options.message && (
            <div className="break-normal text-base text-black">
              {options.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SnackbarItem;
