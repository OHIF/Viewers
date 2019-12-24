import './Tooltip.styl';

import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  /** Sets the direction the Tooltip is positioned towards. */
  placement: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),

  /** The "top" position value for the Tooltip. */
  positionTop: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** The "left" position value for the Tooltip. */
  positionLeft: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

  /** The "top" position value for the Tooltip arrow. */
  arrowOffsetTop: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** The "left" position value for the Tooltip arrow. */
  arrowOffsetLeft: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

const defaultProps = {
  placement: 'right',
};

class Tooltip extends React.Component {
  render() {
    const {
      placement,
      positionTop,
      positionLeft,
      arrowOffsetTop,
      arrowOffsetLeft,
      className,
      style,
      children,
    } = this.props;

    const outerStyle = {
      top: positionTop,
      left: positionLeft,
      ...style,
    };

    const arrowStyle = {
      top: arrowOffsetTop,
      left: arrowOffsetLeft,
    };

    return (
      <div
        role="tooltip"
        className={classNames(className, 'tooltip', placement)}
        style={outerStyle}
      >
        <div className="tooltip-arrow" style={arrowStyle} />
        <div className="tooltip-inner">{children}</div>
      </div>
    );
  }
}

Tooltip.propTypes = propTypes;
Tooltip.defaultProps = defaultProps;

export { Tooltip };
