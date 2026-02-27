import React from 'react';
import classNames from 'classnames';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@ohif/ui-next';
import { Icons } from '@ohif/ui-next';

const PACS_TITLE = 'PACS IA';
const CONTEXT_LABEL = 'CHU Lyon - Service Radiologie';

/** Icône cloche (Material Design style) */
function IconBell({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/** Icône personne / mon compte (Material Design style) */
function IconPerson({ className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function WorkListHeader({
  className,
  menuOptions,
}: {
  className?: string;
  menuOptions: Array<{ title: string; icon?: string; onClick: () => void }>;
}) {
  return (
    <header
      className={classNames(
        'sticky top-0 z-20 grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-[#e5e7eb] bg-white px-4',
        className
      )}
    >
      <div className="flex min-w-0 items-center">
        <h1 className="text-2xl font-bold text-[#374151]" style={{ fontFamily: 'Roboto, sans-serif' }}>{PACS_TITLE}</h1>
      </div>

      <div className="flex items-center justify-center text-lg font-medium text-[#374151]" style={{ fontFamily: 'Roboto, sans-serif' }}>
        {CONTEXT_LABEL}
      </div>

      <div className="flex min-w-0 items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-[#374151] hover:bg-[#f3f4f6]"
          title="Notifications"
        >
          <IconBell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-[#374151] hover:bg-[#f3f4f6]"
              title="Mon compte"
            >
              <IconPerson className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {menuOptions.map((option, index) => {
              const IconComponent = option.icon ? Icons[option.icon as keyof typeof Icons] : null;
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
    </header>
  );
}

export default WorkListHeader;
