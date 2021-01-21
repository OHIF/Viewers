import React, { useEffect } from 'react';

const SnackbarItem = ({ options, onClose }) => {
  const handleClose = () => {
    onClose(options.id);
  };

  const handleClick = () => {
    options.action.onClick({ ...options, close: handleClose });
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
      {options.action && (
        <button className="sb-action" onClick={handleClick}>
          {options.action.label}
        </button>
      )}
    </div>
  );
};

export default SnackbarItem;
