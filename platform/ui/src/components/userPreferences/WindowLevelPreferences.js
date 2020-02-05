import React from 'react';
import PropTypes from 'prop-types';

import { TabFooter } from './TabFooter';

function WindowLevelPreferences({ name, onClose, t }) {
  const onResetPreferences = () => {};
  const onSave = () => {};
  const hasErrors = false;

  return (
    <React.Fragment>
      <div className="">Component content: {name}</div>
      <div className="">TDB!</div>
      <TabFooter
        onResetPreferences={onResetPreferences}
        onSave={onSave}
        onClose={onClose}
        hasErrors={hasErrors}
        t={t}
      />
    </React.Fragment>
  );
}

WindowLevelPreferences.propTypes = {
  name: PropTypes.string,
  hide: PropTypes.func,
  t: PropTypes.func,
};

export { WindowLevelPreferences };
