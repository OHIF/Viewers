import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const TableBody = ({ children, className = '', style = {} }) => {
  return (
    <div
      className={classnames('ohif-scrollbar mt-2 max-h-48 overflow-y-scroll', className)}
      style={style}
    >
      {React.isValidElement(children)
        ? React.cloneElement(children, {
            isTableHead: false,
          })
        : children}
    </div>
  );
};

TableBody.propTypes = {
  children: function (props, propName, componentName) {
    const elements = React.Children.toArray(props.children);
    const isString = elements.some(child => typeof child === 'string');

    if (isString) {
      return new Error(
        `Failed prop type: Invalid prop ${propName} supplied to ${componentName}, expected a valid element instead of a string.`
      );
    }

    const isInvalidElement = elements.some(child => !React.isValidElement(child));

    if (isInvalidElement) {
      return new Error(
        `Failed prop type: Invalid prop ${propName} supplied to ${componentName}, expected a valid node element.`
      );
    }
  },
  className: PropTypes.string,
  style: PropTypes.object,
};

export default TableBody;
