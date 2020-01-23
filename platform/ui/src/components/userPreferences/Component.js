import React from 'react';
import PropTypes from 'prop-types';

import { TabFooter } from './TabFooter';

function Component({ name, onClose, t }) {
  const onResetPreferences = () => {};
  const onSave = () => {};
  const hasErrors = () => {};

  return (
    <div className="">
      <div className="">Component content: {name}</div>
      <TabFooter
        onResetPreferences={onResetPreferences}
        onSave={onSave}
        onClose={onClose}
        hasErrors={hasErrors}
        t={t}
      />
    </div>
  );
}

Component.propTypes = {
  name: PropTypes.string,
  hide: PropTypes.func,
  t: PropTypes.func,
};

export { Component };
