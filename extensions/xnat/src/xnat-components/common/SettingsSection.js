import React from 'react';
import './XNATSettings.styl';

const SettingsSection = ({ title, children }) => {
  return (
    <div className="settings-section">
      {title ?
        <div className="header">{title}</div> : null
      }
      <div className="content">
        {children}
      </div>
    </div>
  );
};

export default SettingsSection;