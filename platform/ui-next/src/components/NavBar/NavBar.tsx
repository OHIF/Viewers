import React from 'react';
import classnames from 'classnames';

const stickyClasses = 'sticky top-0';
const notStickyClasses = 'relative';

interface NavBarProps {
  className?: string;
  children?: React.ReactNode;
  isSticky?: boolean;
}

const NavBar = ({
  className,
  children,
  isSticky
}: NavBarProps) => {
  return (
    <div
      className={classnames(
        'bg-secondary-dark z-20 border-black px-1',
        isSticky && stickyClasses,
        !isSticky && notStickyClasses,
        className
      )}
    >
      {children}
    </div>
  );
};

export default NavBar;
