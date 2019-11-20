import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import i18n from '@ohif/i18n';

import './LanguageSwitcher.styl';
import { withTranslation } from '../../contextProviders';

const LanguageSwitcher = props => {
  const getCurrentLanguage = (lang = i18n.language) => lang.split('-')[0];

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
    props.updatePropValue(language, 'generalPreferences', 'language');
  };

  return (
    <select
      name="language-select"
      id="language-select"
      className="language-select"
      value={props.language}
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

LanguageSwitcher.propTypes = {
  language: PropTypes.string.isRequired,
  updatePropValue: PropTypes.func.isRequired,
};

export default withTranslation('UserPreferencesModal')(LanguageSwitcher);
