import React, { useState, useEffect, useCallback } from 'react';
import { withTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { withModal } from '@ohif/ui';
import { UserPreferences } from '../UserPreferences';
import './Header.css';

function PreferenceButton(props) {
  const {
    t,
    modal: { show },
  } = props;

  const handlePreferencse = useCallback(() => {
    show({
      content: UserPreferences,
      title: t('User Preferences'),
    });
  }, [, show, t]);

  return (
    <div className="form-inline btn-group pull-right">
      <button className="btn btn-outline" onClick={handlePreferencse}>
        {t('Preferences')}
      </button>
    </div>
  );
}

PreferenceButton.propTypes = {
  t: PropTypes.func.isRequired,
  modal: PropTypes.object,
};

PreferenceButton.defaultProps = {};

export default withTranslation(['PreferenceButton'])(
  withModal(PreferenceButton)
);
