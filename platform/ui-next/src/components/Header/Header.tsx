import React, { ReactNode } from 'react';
import classNames from 'classnames';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Icons,
  Button,
  ToolButton,
} from '../';
import { IconPresentationProvider } from '@ohif/ui-next';

import NavBar from '../NavBar';

// Todo: we should move this component to composition and remove props base

interface HeaderProps {
  children?: ReactNode;
  menuOptions: Array<{
    title: string;
    icon?: string;
    onClick: () => void;
  }>;
  isReturnEnabled?: boolean;
  onClickReturnButton?: () => void;
  isSticky?: boolean;
  /** Enables the two-row layout with horizontally scrollable controls below the desktop breakpoint. */
  isResponsive?: boolean;
  WhiteLabeling?: {
    createLogoComponentFn?: (React: any, props: any) => ReactNode;
  };
  Secondary?: ReactNode;
  /**
   * Ordered slots filling the right of the menu bar, ahead of the settings
   * menu — patient info, undo/redo, whatever a site puts there. Each is
   * followed by a separator, and a slot whose content renders nothing takes
   * its separator with it.
   */
  RightSide?: ReactNode[];
}

function Header({
  children,
  menuOptions,
  isReturnEnabled = true,
  onClickReturnButton,
  isSticky = false,
  isResponsive = false,
  WhiteLabeling,
  RightSide = [],
  Secondary,
  ...props
}: HeaderProps): ReactNode {
  const onClickReturn = () => {
    if (isReturnEnabled && onClickReturnButton) {
      onClickReturnButton();
    }
  };

  return (
    <IconPresentationProvider
      size="large"
      IconContainer={ToolButton}
    >
      <NavBar
        isSticky={isSticky}
        {...props}
      >
        <div
          className={classNames(
            'relative items-center',
            isResponsive
              ? // Row 1 is pinned to the desktop header height; row 2 may grow so that a
                // taller toolbar wraps instead of being clipped by `overflow-x-auto`.
                'grid min-h-[96px] grid-cols-[minmax(0,1fr)_auto] grid-rows-[48px_minmax(48px,auto)] lg:block lg:h-[48px] lg:min-h-0'
              : 'h-[48px]'
          )}
          data-cy="app-header"
        >
          <div
            className={classNames(
              'flex items-center',
              isResponsive
                ? 'relative col-start-1 row-start-1 min-w-0 lg:absolute lg:left-0 lg:top-1/2 lg:-translate-y-1/2'
                : 'absolute left-0 top-1/2 -translate-y-1/2'
            )}
            data-cy="app-header-branding"
          >
            <div
              className={classNames(
                'mr-3 inline-flex items-center',
                isReturnEnabled && 'cursor-pointer'
              )}
              onClick={onClickReturn}
              data-cy="return-to-work-list"
            >
              {isReturnEnabled && <Icons.ArrowLeft className="text-primary ml-1 h-7 w-7" />}
              <div className="ml-1">
                {WhiteLabeling?.createLogoComponentFn?.(React, props) || <Icons.OHIFLogo />}
              </div>
            </div>
          </div>
          <div
            className={classNames(
              isResponsive
                ? 'col-span-2 row-start-2 flex min-w-0 items-center justify-start gap-2 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:contents'
                : 'contents'
            )}
            data-cy="app-header-toolbar"
          >
            <div
              className={classNames(
                'h-8',
                isResponsive
                  ? 'shrink-0 lg:absolute lg:top-1/2 lg:left-[250px] lg:-translate-y-1/2'
                  : 'absolute top-1/2 left-[250px] -translate-y-1/2'
              )}
            >
              {Secondary}
            </div>
            <div
              className={classNames(
                isResponsive
                  ? 'shrink-0 lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:transform'
                  : 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform'
              )}
            >
              <div className="flex items-center justify-center space-x-2">{children}</div>
            </div>
          </div>
          {/* Patient identity has to stay on the first row: it is the safety check
              the user makes before reading the study, so it must never sit behind
              a horizontal scroll. Keeping it in normal flow next to the settings
              menu also reproduces the pre-`isResponsive` desktop DOM exactly —
              the two used to share this one flex row. */}
          <div
            className={classNames(
              'flex select-none items-center',
              isResponsive
                ? 'relative col-start-2 row-start-1 min-w-0 justify-self-end lg:absolute lg:top-1/2 lg:right-0 lg:-translate-y-1/2'
                : 'absolute top-1/2 right-0 -translate-y-1/2'
            )}
            data-cy="app-header-actions"
          >
            <div
              className="flex min-w-0 items-center"
              data-cy="app-header-context-actions"
            >
              {RightSide.map((item, index) => (
                // The separator is an `::after` so that `empty:hidden` can drop
                // the whole slot — separator included — when the item rendered
                // nothing (e.g. patient info with `showPatientInfo: 'disabled'`).
                <div
                  key={index}
                  className="after:border-muted flex items-center after:mx-1.5 after:h-[25px] after:border-r after:content-[''] empty:hidden"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary hover:bg-muted mt-2 h-full w-full"
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
                            <Icons.ByName name={option.icon} />
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
      </NavBar>
    </IconPresentationProvider>
  );
}

export default Header;
