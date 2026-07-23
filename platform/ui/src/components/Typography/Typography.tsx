import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const baseClasses = 'm-0 leading-tight';

const defaultVariantMapping = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle: 'h6',
  body: 'p',
};

const defaults = {
  align: 'inherit',
  color: 'initial',
  display: 'initial',
  gutterBottom: false,
  noWrap: false,
  paragraph: false,
  variant: 'body',
};

const classes = {
  variant: {
    h1: 'text-6xl',
    h2: 'text-5xl',
    h3: 'text-4xl',
    h4: 'text-3xl',
    h5: 'text-2xl',
    // Using px value temporarily until larger fontsize variables are finalized
    h6: 'text-[20px]',
    subtitle: 'text-lg',
    body: 'text-base',
    caption: 'text-xs',
    button: 'text-sm uppercase',
    overline: 'text-xs uppercase',
    srOnly: 'absolute h-0 w-0 hidden',
    inherit: '',
  },
  color: {
    initial: 'text-white',
    inherit: 'text-inherit',
    primary: 'text-primary-main',
    primaryActive: 'text-primary-active',
    primaryLight: 'text-primary-light',
    secondary: 'text-common-light',
    error: 'text-red-600',
  },
  align: {
    inherit: '',
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  },
  display: {
    initial: '',
    block: 'block',
    inline: 'inline',
  },
  gutterBottom: {
    true: 'mb-3',
    false: '',
  },
  paragraph: {
    true: 'mb-3',
    false: '',
  },
  noWrap: {
    true: 'truncate',
    false: '',
  },
};

const Typography = ({
  align = defaults.align,
  color = defaults.color,
  display = defaults.display,
  gutterBottom = defaults.gutterBottom,
  noWrap = defaults.noWrap,
  paragraph = defaults.paragraph,
  variant = defaults.variant,
  component,
  className,
  ...rest
}) => {
  const Component = component || (paragraph ? 'p' : defaultVariantMapping[variant]) || 'span';
  return (
    <Component
      className={classnames(
        baseClasses,
        classes.variant[variant],
        classes.color[color],
        classes.align[align],
        classes.gutterBottom[gutterBottom],
        classes.paragraph[paragraph],
        classes.noWrap[noWrap],
        classes.display[display],
        className
      )}
      {...rest}
    />
  );
};

Typography.propTypes = {
  component: PropTypes.elementType,
  paragraph: PropTypes.bool,
  display: PropTypes.oneOf(['initial', 'block', 'inline']),
  variant: PropTypes.oneOf([
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'subtitle',
    'body',
    'caption',
    'button',
    'overline',
    'srOnly',
    'inherit',
  ]),
  color: PropTypes.oneOf([
    'initial',
    'inherit',
    'primary',
    'primaryActive',
    'secondary',
    'error',
    'primaryLight',
  ]),
  className: PropTypes.string,
  children: PropTypes.node,
  align: PropTypes.oneOf(['inherit', 'left', 'center', 'right', 'justify']),
  gutterBottom: PropTypes.bool,
  noWrap: PropTypes.bool,
};

export default Typography;
