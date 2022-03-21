import React from 'react';
import PropTypes from 'prop-types';
import BaseOverlay from 'react-overlays/Overlay';
import elementType from 'prop-types-extra/lib/elementType';
import { withTranslation } from '../../contextProviders';
import classNames from 'classnames';

import Fade from './Fade';

function EnhancedOverlayContent(config, overlay, otherProps = {}) {
  const { props, arrowProps, className, placement = 'bottom' } = config;

  const { ref, ...rest } = props || {};

  const overlayProps =
    typeof overlay !== 'function' ? React.Children.only(overlay).props : {};

  const mergedProps = {
    ...overlayProps,
    ...otherProps,
    placement,
    className: classNames(
      className,
      overlayProps.className,
      otherProps.className
    ),
    ...rest,
  };

  if (ref) {
    mergedProps.forwardRef = ref;
  }

  return typeof overlay === 'function'
    ? overlay(mergedProps)
    : React.cloneElement(overlay, mergedProps);
}

const propTypes = {
  /**
   * Set the visibility of the Overlay
   */
  show: PropTypes.bool,
  /**
   * Specify whether the overlay should trigger onHide when the user clicks outside the overlay
   */
  rootClose: PropTypes.bool,
  /**
   * A callback invoked by the overlay when it wishes to be hidden. Required if
   * `rootClose` is specified.
   */
  onHide: PropTypes.func,

  /**
   * Use animation
   */
  animation: PropTypes.oneOfType([PropTypes.bool, elementType]),

  /**
   * Callback fired before the Overlay transitions in
   */
  onEnter: PropTypes.func,

  /**
   * Callback fired as the Overlay begins to transition in
   */
  onEntering: PropTypes.func,

  /**
   * Callback fired after the Overlay finishes transitioning in
   */
  onEntered: PropTypes.func,

  /**
   * Callback fired right before the Overlay transitions out
   */
  onExit: PropTypes.func,

  /**
   * Callback fired as the Overlay begins to transition out
   */
  onExiting: PropTypes.func,

  /**
   * Callback fired after the Overlay finishes transitioning out
   */
  onExited: PropTypes.func,

  /**
   * Sets the direction of the Overlay.
   */
  placement: PropTypes.oneOf(['top', 'right', 'bottom', 'left']),
};

const defaultProps = {
  animation: Fade,
  rootClose: false,
  show: false,
  placement: 'right',
};

class Overlay extends React.Component {
  render() {
    const { animation, overlay: OverlayContent, ...props } = this.props;

    const transitionComponent = animation === true ? Fade : animation || null;
    const childClassName = transitionComponent ? '' : 'in';

    return (
      <BaseOverlay {...props} transition={transitionComponent}>
        {config =>
          EnhancedOverlayContent(config, OverlayContent, {
            className: childClassName,
          })
        }
      </BaseOverlay>
    );
  }
}

Overlay.propTypes = propTypes;
Overlay.defaultProps = defaultProps;

const connectedComponent = withTranslation()(Overlay);
export { connectedComponent as Overlay };
export default connectedComponent;
