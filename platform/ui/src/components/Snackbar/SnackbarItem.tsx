import React, { useEffect } from 'react';
import classNames from 'classnames';
import Icon from '../Icon';
import IconButton from '../IconButton';

import SnackbarTypes from './SnackbarTypes';

const SnackbarItem = ({ options, onClose }) => {
  const handleClose = () => onClose(options.id);

  useEffect(() => {
    if (options.autoClose) {
      setTimeout(() => handleClose(), options.duration);
    }
  }, []);

  const typeClasses = {
    [SnackbarTypes.INFO]: 'bg-primary-active',
    [SnackbarTypes.WARNING]: 'bg-yellow-600',
    [SnackbarTypes.SUCCESS]: 'bg-green-600',
    [SnackbarTypes.ERROR]: 'bg-red-600',
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
      {/* <span className="sb-closeBtn" onClick={handleClose}> */}
      {/* <span className="sb-closeIcon">x</span> */}
      <div
        onClick={handleClose}
        className="w-5 h-5 rounded-full absolute bg-white flex items-center justify-center right-0 top-0 mr-2 mt-2"
      >
        <Icon name="close" className="w-4 text-black" />
      </div>
      {/* </span> */}
      {options.title && <div className="sb-title">{options.title}</div>}
      {options.message && <div className="sb-message">{options.message}</div>}
    </div>
  );
};

export default SnackbarItem;
