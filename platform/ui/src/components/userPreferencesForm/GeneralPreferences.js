import React from 'react';
import PropTypes from 'prop-types';
import LanguageSwitcher from '../languageSwitcher';

const GeneralPreferences = props => {
  console.log('GeneralPreferences', props);
  return (
    <div className="general-preferences-wrapper">
      <div className="col-sm-3">
        <label htmlFor="language-select" className="p-r-1">
          Language
        </label>
        <LanguageSwitcher
          language={props.generalPreferences.language}
          updatePropValue={props.updatePropValue}
        />
      </div>
    </div>
  );
};

GeneralPreferences.propTypes = {
  generalPreferences: PropTypes.shape({
    language: PropTypes.string,
  }).isRequired,
  updatePropValue: PropTypes.func.isRequired,
};

export { GeneralPreferences };
