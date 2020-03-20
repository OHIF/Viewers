import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const TableRow = ({ children, className, isTableHead, style }) => {
  return (
    <div className={classnames('w-full flex', className)} style={style}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { isTableHead })
      )}
    </div>
  );
};

TableRow.defaultProps = {
  isTableHead: false,
  className: '',
  style: {},
};

TableRow.propTypes = {
  isTableHead: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default TableRow;
