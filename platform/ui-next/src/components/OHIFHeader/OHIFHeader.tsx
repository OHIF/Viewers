import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Icons,
  Button,
} from '../';

import { OHIFNavBar } from './OHIFNavBar';

/**
 * OHIFHeader
 * A header component that leverages the OHIFNavBar.
 * It can display a logo, a left "return" button, a center region for children,
 * a patient info section on the right, and a settings dropdown menu.
 */
interface OHIFHeaderProps {
  children?: ReactNode;
  menuOptions: Array<{
    title: string;
    icon?: string;
    onClick: () => void;
  }>;
  isReturnEnabled?: boolean;
  onClickReturnButton?: () => void;
  isSticky?: boolean;
  WhiteLabeling?: {
    createLogoComponentFn?: (React: any, props: any) => ReactNode;
  };
  PatientInfo?: ReactNode;
  Secondary?: ReactNode;
}

export function OHIFHeader({
  children,
  menuOptions,
  isReturnEnabled = true,
  onClickReturnButton,
  isSticky = false,
  WhiteLabeling,
  PatientInfo,
  Secondary,
  ...props
}: OHIFHeaderProps): ReactNode {
  const { t } = useTranslation('Header');

  const onClickReturn = () => {
    if (isReturnEnabled && onClickReturnButton) {
      onClickReturnButton();
    }
  };

  return (
    <OHIFNavBar
      isSticky={isSticky}
      {...props}
    >
      <div className="relative h-[48px] items-center">
        {/* Left Return / Logo */}
        <div className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center">
          <div
            className={classNames(
              'mr-3 inline-flex items-center',
              isReturnEnabled && 'cursor-pointer'
            )}
            onClick={onClickReturn}
            data-cy="return-to-work-list"
          >
            {isReturnEnabled && <Icons.ArrowLeft className="text-primary-active w-8" />}
            <div className="ml-1">
              {WhiteLabeling?.createLogoComponentFn?.(React, props) || <Icons.OHIFLogo />}
            </div>
          </div>
        </div>
        {/* Secondary (Left Center) */}
        <div className="absolute top-1/2 left-[250px] h-8 -translate-y-1/2">{Secondary}</div>
        {/* Center Content */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          <div className="flex items-center justify-center space-x-2">{children}</div>
        </div>
        {/* Right Settings / Patient Info */}
        <div className="absolute right-0 top-1/2 flex -translate-y-1/2 select-none items-center">
          {PatientInfo}
          <div className="border-primary-dark mx-1.5 h-[25px] border-r"></div>
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-active hover:bg-primary-dark mt-2 h-full w-full"
                >
                  <Icons.GearSettings />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {menuOptions.map((option, index) => {
                  const IconComponent = option.icon
                    ? Icons[option.icon as keyof typeof Icons]
                    : null;
                  return (
                    <DropdownMenuItem
                      key={index}
                      onSelect={option.onClick}
                      className="flex items-center gap-2 py-2"
                    >
                      {IconComponent && (
                        <span className="flex h-4 w-4 items-center justify-center">
                          <Icons.ByName name={IconComponent.name} />
                        </span>
                      )}
                      <span className="flex-1">{option.title}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </OHIFNavBar>
  );
}
