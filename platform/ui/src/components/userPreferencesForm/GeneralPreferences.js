import React, { Component } from 'react';
import LanguageSwitcher from '../languageSwitcher';

export class GeneralPreferences extends Component {
  render() {
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
}
