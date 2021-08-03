import React from 'react';

import PropTypes from 'prop-types';
import LanguageSwitcher from '../components/languageSwitcher';

import './wrapper.styl';

const Wrapper = ({ children }) => (
  <React.Fragment>
    <div className="sidebarLanguageSwitcher">
      <strong>Display components in:</strong>
      <LanguageSwitcher />
    </div>
    {children}
  </React.Fragment>
);

Wrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Wrapper;
