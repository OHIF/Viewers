import React from 'react';

/**
 * Nests React components as ordered in array. We use this to
 * simplify composition a Mode specify's in it's configuration
 * for React Contexts that should wrap a Mode Route.
 */
export default function Compose(props) {
  const { components = [], children } = props;

  return (
    <React.Fragment>
      {components.reduceRight((acc, curr) => {
        const [Comp, props] = Array.isArray(curr) ? [curr[0], curr[1]] : [curr, {}];
        return <Comp {...props}>{acc}</Comp>;
      }, children)}
    </React.Fragment>
  );
}

// https://juliuskoronci.medium.com/avoid-a-long-list-of-react-providers-c45a269d80c1

