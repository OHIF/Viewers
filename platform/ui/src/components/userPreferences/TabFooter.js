import React from 'react';
import PropTypes from 'prop-types';

function TabFooter({ onResetPreferences, onSave, onClose, hasErrors, t }) {
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
        <div onClick={onClose} data-cy="cancel-btn" className="btn btn-default">
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
  onClose: PropTypes.func,
  hasErrors: PropTypes.bool,
  t: PropTypes.func,
};

export { TabFooter };
