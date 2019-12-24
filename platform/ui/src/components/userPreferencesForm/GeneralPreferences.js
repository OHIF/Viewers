import React from 'react';
import PropTypes from 'prop-types';
import LanguageSwitcher from '../languageSwitcher';
import i18n from '@ohif/i18n';

/**
 * General Preferences tab
 */

/**
 * General Preferences tab
 * It renders the General Preferences content
 *
 * It stores current state and whenever it changes, component messages parent of new value (through function callback)
 * @param {object} props component props
 * @param {string} props.name Tab`s name
 * @param {object} props.generalPreferences Data for initial state
 * @param {function} props.onTabStateChanged Callback function to communicate parent in case its states changes
 * @param {function} props.onTabErrorChanged Callback Function in case any error on tab
 */
function GeneralPreferences({
  generalPreferences,
  name,
  onTabStateChanged,
  onTabErrorChanged,
}) {
  const { language = i18n.language } = generalPreferences;

  const onLanguageChange = language => {
    onTabStateChanged(name, {
      generalPreferences: { ...generalPreferences, language },
    });
  };

  return (
    <div className="general-preferences-wrapper">
      <div className="col-sm-3">
        <label htmlFor="language-select" className="p-r-1">
          Language
        </label>
        <LanguageSwitcher
          language={language}
          onLanguageChange={onLanguageChange}
        />
      </div>
    </div>
  );
}

GeneralPreferences.propTypes = {
  generalPreferences: PropTypes.any,
  name: PropTypes.string,
  onTabStateChanged: PropTypes.func,
  onTabErrorChanged: PropTypes.func,
};

export { GeneralPreferences };
