import React, { createContext, useContext, ReactNode } from 'react';
import { cn } from '../utils';

export type IconSizeType = 'tiny' | 'small' | 'medium' | 'large' | number;

interface IconSizeContextType {
  size: IconSizeType;
  getSizeValue: (size?: IconSizeType) => number | string;
  getSizeClassName: (size?: IconSizeType, additionalClasses?: string) => string;
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
};

export const IconSizeContext = createContext<IconSizeContextType>(defaultContext);

interface IconSizeProviderProps {
  size: IconSizeType;
  children: ReactNode;
}

export const IconSizeProvider = ({ size, children }: IconSizeProviderProps) => {
  const iconClasses = getSizeClassName(size);
  return <IconSizeContext.Provider value={iconClasses}>{children}</IconSizeContext.Provider>;
};

export const useIconSize = () => useContext(IconSizeContext);
