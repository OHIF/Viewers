import React from 'react';
import PropTypes from 'prop-types';

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
