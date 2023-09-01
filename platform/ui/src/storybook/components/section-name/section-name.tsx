import PropTypes from 'prop-types';
import { useMemo } from 'react';

export const SectionName = ({ className, children, ...props }) => {
  const id = useMemo(() => children.toLowerCase().split(' ').join('-'), [children]);
  // eslint-disable-next-line jsx-a11y/heading-has-content
  return (
    <h2
      id={id}
      {...props}
      className="mt-4 text-3xl text-blue-600"
    >
      {children}
    </h2>
  );
};

SectionName.propTypes = {
  children: PropTypes.string.isRequired,
};
