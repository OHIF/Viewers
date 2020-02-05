import React from 'react';
import PropTypes from 'prop-types';

import { TabFooter } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

function WindowLevelPreferences({ onClose }) {
  const { t } = useTranslation('UserPreferencesModal');
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
  onClose: PropTypes.func,
};

export { WindowLevelPreferences };
