import React from 'react';
import PropTypes from 'prop-types';

import './LanguageSwitcher.styl';

const LanguageSwitcher = ({ language, onLanguageChange, languages }) => {
  const onChange = event => {
    const { value } = event.target;
    onLanguageChange(value);
  };

  return (
    <select
      name="language-select"
      id="language-select"
      className="language-select"
      value={language}
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
  languages: PropTypes.array.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
};

export { LanguageSwitcher };
