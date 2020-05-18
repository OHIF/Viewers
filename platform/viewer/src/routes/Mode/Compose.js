import React from 'react';
import PropTypes from 'prop-types';

/**
 * Nests React components as ordered in array. We use this to
 * simplify composition a Mode specify's in it's configuration
 * for React Contexts that should wrap a Mode Route.
 */
export default function Compose(props) {
  const { components = [], children } = props;

  return (
    <>
      {components.reduceRight((acc, Comp) => {
        return <Comp>{acc}</Comp>;
      }, children)}
    </>
  );
}

Compose.propTypes = {
  components: PropTypes.array,
  children: PropTypes.node.isRequired,
};
