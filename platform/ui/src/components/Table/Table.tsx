import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Table = ({ children, className = '', fullWidth = true, style = {} }) => {
  const classes = {
    base: 'text-lg text-white',
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  };

  return (
    <div
      className={classnames(classes.base, classes.fullWidth[fullWidth], className)}
      style={style}
    >
      {children}
    </div>
  );
};

Table.propTypes = {
  fullWidth: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default Table;
