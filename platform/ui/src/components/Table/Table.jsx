import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const Table = ({ children, className, fullWidth, style }) => {
  return (
    <div
      className={classnames(
        'text-lg text-white',
        {
          'w-full': fullWidth,
        },
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};

Table.defaultProps = {
  className: '',
  fullWidth: true,
  style: {},
};

Table.propTypes = {
  fullWidth: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default Table;
