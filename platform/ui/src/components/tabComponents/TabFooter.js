import React from 'react';
import PropTypes from 'prop-types';

import './TabFooter.styl';

// In case translate is not passed
const translate = word => word;

function TabFooter({
  onResetPreferences,
  onSave,
  onCancel,
  hasErrors,
  t = translate,
}) {
  return (
    <div className="footer">
      <button
        className="btn btn-danger pull-left"
        data-cy="reset-default-btn"
        onClick={onResetPreferences}
      >
        {t('Reset to Defaults')}
      </button>
      <div>
        <div
          onClick={onCancel}
          data-cy="cancel-btn"
          className="btn btn-default"
        >
          {t('Cancel')}
        </div>
        <button
          className="btn btn-primary"
          data-cy="save-btn"
          disabled={hasErrors}
          onClick={onSave}
        >
          {t('Save')}
        </button>
      </div>
    </div>
  );
}

TabFooter.propTypes = {
  onResetPreferences: PropTypes.func,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  hasErrors: PropTypes.bool,
  t: PropTypes.func,
};

export { TabFooter };
