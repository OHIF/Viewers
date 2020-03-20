import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const TableHead = ({ children, className, style }) => {
  return (
    <div
      className={classnames(
        'bg-custom-navy border-b border-custom-violetPale flex font-bold',
        className
      )}
      style={style}
    >
      {React.cloneElement(children, {
        isTableHead: true,
      })}
    </div>
  );
};

TableHead.defaultProps = {
  className: '',
  style: {},
};

TableHead.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default TableHead;
