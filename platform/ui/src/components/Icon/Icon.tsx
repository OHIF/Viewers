import React from 'react';
import getIcon from './getIcon';

interface IconProps {
  name: string;
  className?: string;
}

const Icon = ({
  name,
  ...otherProps
}: IconProps) => {
  return <React.Fragment>{getIcon(name, { ...otherProps })}</React.Fragment>;
};

export default Icon;
