import React from 'react';

export const Table = props => {
  const { className, style, ...rest } = props;
  return (
    <div className={className}>
      <table className={className} {...rest} />
    </div>
  );
};
