import React, { createContext, useContext, ReactNode, ComponentType } from 'react';
import { cn } from '../utils';
import { Button } from '../components/Button';

export type IconSizeType = 'tiny' | 'small' | 'medium' | 'large' | number;

interface IconSizeContextType {
  size: IconSizeType;
  getSizeValue: (size?: IconSizeType) => number | string;
  getSizeClassName: (size?: IconSizeType, additionalClasses?: string) => string;
  IconContainer: ComponentType<any>;
}

const sizeMap = {
  tiny: 16,
  small: 20,
  medium: 24,
  large: 28,
};

export const getSizeValue = (size: IconSizeType = 'medium'): number | string => {
  if (typeof size === 'number') {
    return size;
  }
  return sizeMap[size] || sizeMap.medium;
};

export const getSizeClassName = (size: IconSizeType = 'medium', additionalClasses = ''): string => {
  const sizeValue = getSizeValue(size);
  return cn(`h-[${sizeValue}px] w-[${sizeValue}px]`, additionalClasses);
};

const defaultContext: IconSizeContextType = {
  size: 'medium',
  getSizeValue,
  getSizeClassName,
  IconContainer: Button,
};

export const IconSizeContext = createContext<IconSizeContextType>(defaultContext);

interface IconSizeProviderProps {
  size: IconSizeType;
  children: ReactNode;
  IconContainer?: ComponentType<any>;
}

export const IconSizeProvider = ({ size, children, IconContainer }: IconSizeProviderProps) => {
  const className = getSizeClassName(size);
  const contextValue = {
    size,
    getSizeValue,
    getSizeClassName,
    IconContainer,
    className,
  };
  return <IconSizeContext.Provider value={contextValue}>{children}</IconSizeContext.Provider>;
};

export const useIconSize = () => useContext(IconSizeContext);
