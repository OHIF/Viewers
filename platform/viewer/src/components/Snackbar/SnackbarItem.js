import React, { useState } from 'react';

const SnackbarItem = ({ options, onClose }) => {
  const SHADOW_OPACITY = '0.9';

  const defaultColors = {
    success: {
      rgb: '94, 164, 0',
      hex: '#5ea400',
    },
    error: {
      rgb: '236, 61, 61',
      hex: '#ec3d3d',
    },
    warning: {
      rgb: '235, 173, 23',
      hex: '#ebad1a',
    },
    info: {
      rgb: '54, 156, 199',
      hex: '#369cc7',
    },
  };

  const containerStyles = {
    position: 'relative',
    padding: '20px',
    color: 'white',
    margin: options.position.includes('bottom') ? '10px 0 0' : '0 0 10px',
  };

  const styles = {
    success: {
      ...containerStyles,
      backgroundColor: `rgba(${defaultColors[options.type].rgb}, ${SHADOW_OPACITY})`,
    },

    error: {
      ...containerStyles,
      backgroundColor: `rgba(${defaultColors[options.type].rgb}, ${SHADOW_OPACITY})`,
    },

    warning: {
      ...containerStyles,
      backgroundColor: `rgba(${defaultColors[options.type].rgb}, ${SHADOW_OPACITY})`,
    },

    info: {
      ...containerStyles,
      backgroundColor: `rgba(${defaultColors[options.type].rgb}, ${SHADOW_OPACITY})`,
    },
  };

  const handleClose = () => {
    onClose(options.id);
  };

  return (
    <div
      style={styles[options.type]}
      className={`${options.visible ? '' : 'sb-hidden'} sb-item`}
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
