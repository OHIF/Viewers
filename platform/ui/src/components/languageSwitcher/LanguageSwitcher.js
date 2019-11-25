import React from 'react';
import PropTypes from 'prop-types';

import './LanguageSwitcher.styl';
import { withTranslation } from '../../contextProviders';

const LanguageSwitcher = ({ language, onLanguageChange }) => {
  const parseLanguage = lang => lang.split('-')[0];

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

  const onChange = event => {
    const { value } = event.target;
    onLanguageChange(parseLanguage(value));
  };

  return (
    <select
      name="language-select"
      id="language-select"
      className="language-select"
      value={parseLanguage(language)}
      onChange={onChange}
    >
      {languages.map(lng => (
        <option key={lng.value} value={lng.value}>
          {lng.label}
        </option>
      ))}
    </select>
  );
};

LanguageSwitcher.propTypes = {
  language: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
};

export default withTranslation('UserPreferencesModal')(LanguageSwitcher);
