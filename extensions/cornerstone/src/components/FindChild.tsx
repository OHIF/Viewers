import React from 'react';

export type FindChildProps = {
  source: React.ReactNode | React.ReactNode[] | ((...args: any[]) => React.ReactNode);
  type: string;
  subType?: string;
  children?: React.ReactNode | React.ReactNode[] | ((...args: any[]) => React.ReactNode);
  useDefault?: boolean;
  allowEmpty?: boolean;
  props?: unknown;
};

/**
 * This component is used to find the best matching child object from the given
 * instance, instantiating it with the additional child props.
 */
export function FindChild(props: FindChildProps) {
  // Find the most suitable child from among the props and render it
}

export default FindChild;
