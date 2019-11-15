import React from 'react';
import LanguageSwitcher from '../languageSwitcher';

/**
 * General Preferences tab
 */
function GeneralPreferences() {
  return (
    <div className="general-preferences-wrapper">
      <div className="col-sm-3">
        <label htmlFor="language-select" className="p-r-1">
          Language
        </label>
        <LanguageSwitcher />
      </div>
    </div>
  );
}

export { GeneralPreferences };
