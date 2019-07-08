import React, { useState, useEffect } from 'react';
import i18n from '@ohif/i18n';

import './LanguageSwitcher.styl';
import { withTranslation } from '../../utils/LanguageProvider';

const LanguageSwitcher = () => {
  const getCurrentLanguage = (language = i18n.language) =>
    language.split('-')[0];

  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const languages = [
    // TODO: list of available languages should come from i18n.options.resources
    {
      value: 'en',
      label: 'English',
    },
    {
      value: 'es',
      label: 'Spanish',
    },
  ];

  const onChange = () => {
    const { value } = event.target;
    const language = getCurrentLanguage(value);
    setCurrentLanguage(language);

    i18n.init({
      fallbackLng: language,
      lng: language,
    });
  };

  useEffect(() => {
    let mounted = true;

    i18n.on('languageChanged', () => {
      if (mounted) {
        setCurrentLanguage(getCurrentLanguage());
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <select
      name="language-select"
      id="language-select"
      className="language-select"
      value={currentLanguage}
      onChange={onChange}
    >
      {languages.map(language => (
        <option key={language.value} value={language.value}>
          {language.label}
        </option>
      ))}
    </select>
  );
};

export default withTranslation('UserPreferencesModal')(LanguageSwitcher);
