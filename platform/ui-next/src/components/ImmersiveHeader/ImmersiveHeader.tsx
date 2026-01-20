import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

const ImmersiveHeader = ({ title, children, className }) => {
  return (
    <div
      className={classnames(
        'border-glass-border bg-bkg-low/95 flex h-16 w-full items-center justify-between border-b px-6 backdrop-blur-xl',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-4">{children}</div>
    </div>
  );
};

ImmersiveHeader.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
};

export { ImmersiveHeader };
