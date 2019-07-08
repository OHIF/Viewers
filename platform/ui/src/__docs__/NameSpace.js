import React, { Fragment } from 'react';
import { Link } from 'docz';
import PropTypes from 'prop-types';

const NameSpace = ({ name }) => (
  <Fragment>
    The namespace used on this component was: <pre>{name}</pre> Check the{' '}
    <Link to="/translating#how-to-translate-components">translation docs</Link>{' '}
    to see how to override it.
  </Fragment>
);

NameSpace.propTypes = {
  name: PropTypes.string.isRequired,
};

export default NameSpace;
