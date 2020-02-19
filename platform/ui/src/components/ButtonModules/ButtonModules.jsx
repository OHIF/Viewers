import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import capitalize from '../../utils/capitalize';
import styles from './ButtonModules.module.scss';

const Button = props => {
  const {
    children,
    variant = defaults.variant,
    color = defaults.color,
    size = defaults.size,
    type = defaults.type,
    startIcon: startIconProp,
    endIcon: endIconProp,
    className,
    ...rest
  } = props;
  const startIcon = startIconProp && (
    <div className={styles.startIcon}>{startIconProp}</div>
  );

  const endIcon = endIconProp && (
    <div className={styles.endIcon}>{endIconProp}</div>
  );

  return (
    <button
      className={classnames(
        styles.baseButton,
        styles[variant],
        styles[`${variant}${capitalize(color)}`],
        styles[`${variant}Size${capitalize(size)}`],
        className
      )}
      type={type}
      {...rest}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
};

const defaults = {
  variant: 'outlined',
  color: 'default',
  size: 'large',
  radius: 'medium',
  disabled: false,
  type: 'button',
};

Button.propTypes = {
  children: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  radius: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
  variant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  color: PropTypes.oneOf(['default', 'primary', 'secondary']),
  disabled: PropTypes.bool,
  type: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  className: PropTypes.node,
};

export default Button;
