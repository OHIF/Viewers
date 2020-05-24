import React, { useEffect } from 'react';

const SnackbarItem = ({ options, onClose }) => {
  const handleClose = () => {
    onClose(options.id);
  };

  useEffect(() => {
    if (options.autoClose) {
      setTimeout(() => {
        handleClose();
      }, options.duration);
    }
  }, []);

  return (
    <div>
      <span onClick={handleClose}>
        <span>x</span>
      </span>
      {options.title && <div>{options.title}</div>}
      {options.message && <div>{options.message}</div>}
    </div>
  );
};

export default SnackbarItem;
