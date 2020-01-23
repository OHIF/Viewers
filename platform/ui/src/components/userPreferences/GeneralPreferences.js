import React, { useState } from 'react';
import PropTypes from 'prop-types';

import i18n from '@ohif/i18n';

import LanguageSwitcher from '../languageSwitcher';
import { TabFooter } from './TabFooter';

/**
 * General Preferences tab
 * It renders the General Preferences content
 *
 * @param {object} props component props
 * @param {string} props.name Tab`s name
 * @param {function} props.onClose
 * @param {object} props.generalPreferences
 * @param {string} props.defaultLanguage
 */
function GeneralPreferences({
  name,
  onClose,
  t,
  generalPreferences,
  defaultLanguage,
}) {
  const { language: currentLanguage = i18n.language } = generalPreferences;

  const [language, setLanguage] = useState(currentLanguage);

  const onResetPreferences = () => {
    setLanguage(defaultLanguage);
  };

  const onSave = () => {
    i18n.changeLanguage(language);
  };

  const hasErrors = () => false;

  return (
    <div className="">
      <div className="">
        <label htmlFor="language-select" className="p-r-1">
          Language
        </label>
        <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
      </div>
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

GeneralPreferences.propTypes = {
  defaultLanguage: PropTypes.any,
  generalPreferences: PropTypes.any,
  name: PropTypes.string,
  hide: PropTypes.func,
  t: PropTypes.func,
};

export { GeneralPreferences };
