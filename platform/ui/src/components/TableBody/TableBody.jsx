import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const TableBody = ({ children, className, style }) => {
  return (
    <div
      className={classnames(
        'mt-2 max-h-48 overflow-y-scroll ohif-scrollbar',
        className
      )}
      style={style}
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, { isTableHead: false })
      )}
    </div>
  );
};

TableBody.defaultProps = {
  className: '',
  style: {},
};

TableBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default TableBody;
