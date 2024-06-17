import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const TableRow = ({ children, className = '', isTableHead = false, style = {} }) => {
  const childrens = React.Children.map(children, child => {
    const isValidReactElement = React.isValidElement(child);

    return isValidReactElement
      ? React.cloneElement(child, { isTableHead, cellsNum: children.length })
      : children;
  });

  return (
    <div
      className={classnames('flex w-full', className)}
      style={style}
    >
      {childrens}
    </div>
  );
};

TableRow.propTypes = {
  isTableHead: PropTypes.bool,
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

export default TableRow;
