import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { fade } from '../../utils/colorManipulator';
import capitalize from '../../utils/capitalize';
import theme from '../../styles/theme';

const styles = {
  base: {
    'box-sizing': 'border-box',
    'min-width': '64px',
    padding: '6px 16px',
    'border-radius': '20px',
    color: theme.palette.primary.main,
    transition: 'all 300ms ease',
    '&:hover': {
      'text-decoration': 'none',
      'background-color': fade(
        theme.palette.default.main,
        theme.palette.action.hoverOpacity
      ),
    },
    '&:active': {
      outline: 'none',
    },
    '&:focus': {
      outline: 'none',
    },
    '&:disabled': {
      color: theme.palette.action.disabled,
      cursor: 'not-allowed',
    },
  },
  /* Styles applied to the root element if `variant="text"`. */
  text: {
    padding: '6px 8px',
  },
  /* Styles applied to the root element if `variant="text"` and `color="primary"`. */
  textPrimary: {
    color: theme.palette.primary.main,
    '&:hover': {
      'background-color': fade(
        theme.palette.primary.light,
        theme.palette.action.hoverOpacity
      ),
    },
  },
  /* Styles applied to the root element if `variant="text"` and `color="secondary"`. */
  textSecondary: {
    color: theme.palette.secondary.main,
    '&:hover': {
      'background-color': fade(
        theme.palette.secondary.light,
        theme.palette.action.hoverOpacity
      ),
    },
  },
  /* Styles applied to the root element if `variant="outlined"`. */
  outlined: {
    padding: '5px 15px',
    border: `1px solid ${
      theme.palette.type === 'light'
        ? 'rgba(0, 0, 0, 0.23)'
        : 'rgba(255, 255, 255, 0.23)'
    }`,
    '&:disabled': {
      border: `1px solid ${theme.palette.default.main}`,
    },
  },
  /* Styles applied to the root element if `variant="outlined"` and `color="primary"`. */
  outlinedPrimary: {
    color: theme.palette.primary.main,
    border: `1px solid ${fade(
      theme.palette.primary.light,
      theme.palette.action.hoverOpacity
    )}`,
    '&:hover': {
      border: `1px solid ${theme.palette.primary.main}`,
      'background-color': fade(
        theme.palette.primary.light,
        theme.palette.action.hoverOpacity
      ),
    },
  },
  /* Styles applied to the root element if `variant="outlined"` and `color="secondary"`. */
  outlinedSecondary: {
    color: theme.palette.secondary.main,
    border: `1px solid ${fade(
      theme.palette.secondary.main,
      theme.palette.action.hoverOpacity
    )}`,
    '&:hover': {
      border: `1px solid ${theme.palette.secondary.main}`,
      'background-color': fade(
        theme.palette.secondary.light,
        theme.palette.action.hoverOpacity
      ),
    },
    '&$disabled': {
      border: `1px solid ${theme.palette.action.disabled}`,
    },
  },
  /* Styles applied to the root element if `variant="contained"`. */
  contained: {
    color: '#000',
    'background-color': theme.palette.default.light,
    // 'box-shadow': theme.shadows[2],
    '&:hover': {
      'background-color': theme.palette.default.light,
      // 'box-shadow': theme.shadows[4],

      '&$disabled': {
        'background-color': theme.palette.action.disabledBackground,
      },
    },
    '&:active': {
      // 'box-shadow': typographyows[8],
    },
    '&$disabled': {
      color: theme.palette.action.disabled,
      // 'box-shadow': theme.shadows[0],
      'background-color': theme.palette.action.disabledBackground,
    },
  },
  /* Styles applied to the root element if `variant="contained"` and `color="primary"`. */
  containedPrimary: {
    color: 'white',
    'background-color': theme.palette.primary.main,
    '&:hover': {
      'background-color': fade(
        theme.palette.primary.light,
        theme.palette.action.hoverOpacity
      ),
    },
  },
  /* Styles applied to the root element if `variant="contained"` and `color="secondary"`. */
  containedSecondary: {
    color: 'white',
    'background-color': theme.palette.secondary.main,
    '&:hover': {
      'background-color': fade(
        theme.palette.secondary.light,
        theme.palette.action.hoverOpacity
      ),
    },
  },
  /* Styles applied to the root element if `size="small"` and `variant="text"`. */
  textSizeSmall: {
    padding: '4px 5px',
    fontSize: '13px',
  },
  /* Styles applied to the root element if `size="medium"` and `variant="text"`. */
  textSizeMedium: {
    padding: '6px 9px',
    fontSize: '14px',
  },
  /* Styles applied to the root element if `size="large"` and `variant="text"`. */
  textSizeLarge: {
    padding: '8px 11px',
    fontSize: '15px',
  },
  /* Styles applied to the root element if `size="small"` and `variant="outlined"`. */
  outlinedSizeSmall: {
    padding: '3px 9px',
    fontSize: '13px',
  },
  /* Styles applied to the root element if `size="medium"` and `variant="outlined"`. */
  outlinedSizeMedium: {
    padding: '5px 15px',
    fontSize: '14px',
  },
  /* Styles applied to the root element if `size="large"` and `variant="outlined"`. */
  outlinedSizeLarge: {
    padding: '7px 21px',
    fontSize: '15px',
  },
  /* Styles applied to the root element if `size="small"` and `variant="contained"`. */
  containedSizeSmall: {
    padding: '4px 10px',
    fontSize: '13px',
  },
  /* Styles applied to the root element if `size="medium"` and `variant="contained"`. */
  containedSizeMedium: {
    padding: '6px 16px',
    fontSize: '13px',
  },
  /* Styles applied to the root element if `size="large"` and `variant="contained"`. */
  containedSizeLarge: {
    padding: '8px 22px',
    fontSize: '15px',
  },
  /* Styles applied to the startIcon element if supplied. */
  startIcon: {
    display: 'inherit',
    'margin-right': '8px',
    'margin-left': '-4px',
  },
  /* Styles applied to the endIcon element if supplied. */
  endIcon: {
    display: 'inherit',
    'margin-right': '-4px',
    'margin-left': '8px',
  },
};

const BaseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: transparent;
  outline: 0;
  border: 0;
  margin: 0;
  border-radius: 0;
  padding: 0;
  cursor: pointer;
  user-select: none;
  vertical-align: middle;
  -moz-appearance: none;
  appearance: none;
  text-decoration: none;
  color: inherit;
`;

const ButtonIcon = styled.div`
  ${props => ({
    ...styles[`${props.icon}`],
  })}
`;

const ButtonComponent = styled(BaseButton)`
  /* base styles */
  ${props => ({
    ...styles.base,
  })}

  /* variant styles */
  ${props => ({
    ...styles[`${props.variant}`],
  })}

  /* color */
  ${props => ({
    ...styles[`${props.variant}${capitalize(props.color)}`],
  })}

  /* size styles */
  ${props => ({
    ...styles[`${props.variant}Size${capitalize(props.size)}`],
  })}
`;

const Button = props => {
  const {
    children,
    variant = defaults.variant,
    color = defaults.color,
    size = defaults.size,
    radius = defaults.radius,
    disabled = defaults.disabled,
    elevation,
    type = defaults.type,
    startIcon: startIconProp,
    endIcon: endIconProp,
    className,
    ...rest
  } = props;
  const startIcon = startIconProp && (
    <ButtonIcon icon="startIcon">{startIconProp}</ButtonIcon>
  );

  const endIcon = endIconProp && (
    <ButtonIcon icon="endIcon">{endIconProp}</ButtonIcon>
  );

  return (
    <ButtonComponent
      variant={variant}
      color={color}
      size={size}
      radius={radius}
      disabled={disabled}
      type={type}
      {...rest}
    >
      {startIcon}
      {children}
      {endIcon}
    </ButtonComponent>
  );
};

const defaults = {
  variant: 'outlined',
  color: 'default',
  size: 'large',
  radius: 'medium',
  disabled: false,
  elevation: true,
  type: 'button',
};

Button.propTypes = {
  children: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  radius: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
  variant: PropTypes.oneOf(['text', 'outlined', 'contained']),
  color: PropTypes.oneOf(['default', 'primary', 'secondary']),
  disabled: PropTypes.bool,
  elevation: PropTypes.bool,
  type: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  className: PropTypes.node,
};

export default Button;
