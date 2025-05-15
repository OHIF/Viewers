import React, { createContext, useContext, ReactNode, ComponentType } from 'react';
import { cn } from '../utils';
import { Button } from '../components/Button';

export type IconSizeType = 'tiny' | 'small' | 'medium' | 'large' | number;

interface IconSizeContextType {
  size: IconSizeType;
  getSizeValue: (size?: IconSizeType) => number | string;
  getSizeClassName: (size?: IconSizeType, additionalClasses?: string) => string;
  IconContainer: ComponentType<any>;
  containerProps: {
    variant: string;
    size: string;
    [key: string]: any;
  };
  className: string;
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
  containerProps: {
    variant: 'ghost',
    size: 'icon',
  },
  className: '',
};

export const IconSizeContext = createContext<IconSizeContextType>(defaultContext);

interface IconPresentationProviderProps {
  size: IconSizeType;
  children: ReactNode;
  IconContainer?: ComponentType<any>;
  containerProps?: {
    variant?: string;
    size?: string;
    [key: string]: any;
  };
}

export const IconPresentationProvider = ({
  size,
  children,
  IconContainer = Button,
  containerProps = {},
}: IconPresentationProviderProps) => {
  const className = getSizeClassName(size);
  const mergedProps = {
    variant: 'ghost',
    size: 'icon',
    ...containerProps,
  };

  const contextValue = {
    size,
    getSizeValue,
    getSizeClassName,
    IconContainer,
    containerProps: mergedProps,
    className,
  };
  return <IconSizeContext.Provider value={contextValue}>{children}</IconSizeContext.Provider>;
};

export const useIconPresentation = () => useContext(IconSizeContext);
