import React, { useState, useEffect } from 'react';

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
    <div
      className={`${options.visible ? '' : 'sb-hidden'} sb-${
        options.type
      } sb-item`}
    >
      <span className="sb-closeBtn" onClick={handleClose}>
        <span className="sb-closeIcon">x</span>
      </span>
      {options.title && <div className="sb-title">{options.title}</div>}
      {options.message && <div className="sb-message">{options.message}</div>}
    </div>
  );
};

export default SnackbarItem;
