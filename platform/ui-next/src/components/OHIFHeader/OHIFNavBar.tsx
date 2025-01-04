import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const stickyClasses = 'sticky top-0';
const notStickyClasses = 'relative';

export function OHIFNavBar({
  className,
  children,
  isSticky,
}: {
  className?: string;
  children?: React.ReactNode;
  isSticky?: boolean;
}) {
  return (
    <div
      className={classnames(
        'bg-secondary-dark z-20 border-black px-1',
        isSticky ? stickyClasses : notStickyClasses,
        className
      )}
    >
      {children}
    </div>
  );
}

OHIFNavBar.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  isSticky: PropTypes.bool,
};
