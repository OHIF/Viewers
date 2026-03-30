import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../DropdownMenu/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';
import { Icons } from '../Icons';

export function StudyBrowserViewOptions({ tabs, onSelectTab, activeTabName }: withAppTypes) {
  const handleTabChange = (tabName: string) => {
    onSelectTab(tabName);
  };

  const activeTab = tabs.find(tab => tab.name === activeTabName);

  return (
    <div className="w-full min-w-0">
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger className="w-full overflow-hidden focus:outline-none focus:ring-0 focus-visible:outline-none">
            <DropdownMenuTrigger className="relative flex h-[28px] w-full items-center justify-start overflow-hidden whitespace-nowrap rounded border-0 bg-[#3a3a3a] px-3 text-sm text-white focus:outline-none data-[state=open]:outline-none data-[state=open]:ring-0">
              <span className="overflow-hidden text-ellipsis">{activeTab?.label}</span>
              <Icons.ChevronOpen className="absolute right-0 top-1/2 h-6 w-6 -translate-y-1/2 opacity-70" />
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>{activeTab?.label}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent className="bg-[#3a3a3a]">
          {tabs.map(tab => {
            const { name, label, studies } = tab;
            const isActive = activeTabName === name;
            const isDisabled = !studies.length;

            if (isDisabled) {
              return null;
            }

            return (
              <DropdownMenuItem
                key={name}
                className={`text-sm text-white hover:bg-[#4a4a4a] ${isActive ? 'font-semibold' : ''}`}
                onClick={() => handleTabChange(name)}
              >
                {label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
