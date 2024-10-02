// src/_prototypes/DataRow/DataRow.tsx

import React, { useState } from 'react';
import { Button } from '../../components/Button/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/DropdownMenu';
import { Icons } from '../../components/Icons/Icons';

interface DataRowProps {
  number: number;
  title: string;
  description: string;
  optionalField?: string;
  colorHex?: string;
  details?: string;
  actionOptions: string[];
  onAction: (action: string) => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

const DataRow: React.FC<DataRowProps> = ({
  number,
  title,
  description,
  optionalField,
  colorHex,
  details,
  actionOptions,
  onAction,
  isSelected = false,
  onSelect,
}) => {
  // State to track if the dropdown is open
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex flex-col">
      {/* Row 1 with 'group' class to enable group-hover */}
      <div
        className={`flex items-center ${
          isSelected ? 'bg-popover' : 'bg-muted'
        } group relative cursor-pointer`}
        onClick={onSelect}
      >
        {/* Hover Overlay */}
        <div className="bg-primary/20 pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>

        {/* Number Box */}
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-l border-r border-black text-sm ${
            isSelected ? 'bg-highlight text-black' : 'bg-muted text-muted-foreground'
          }`}
        >
          {number}
        </div>

        {/* Color Circle (Optional) */}
        {colorHex && (
          <div className="flex h-7 w-5 items-center justify-center">
            <span
              className="ml-2 h-2 w-2 rounded-full"
              style={{ backgroundColor: colorHex }}
            ></span>
          </div>
        )}

        {/* Label */}
        <div className="ml-2 flex-1 overflow-hidden">
          <span
            className={`truncate pr-2 text-sm ${
              isSelected ? 'text-highlight' : 'text-muted-foreground'
            }`}
          >
            {title}
          </span>
        </div>

        {/* Actions Button (Appears on Hover or when Dropdown is Open or Selected) */}
        <div className="relative mr-0.5 flex items-center">
          <DropdownMenu onOpenChange={open => setIsDropdownOpen(open)}>
            <DropdownMenuTrigger asChild>
              <Button
                size="small"
                variant="ghost"
                className={`h-6 w-6 transition-opacity ${
                  isSelected || isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                aria-label="Actions"
                onClick={e => e.stopPropagation()} // Prevent row selection on button click
              >
                <Icons.More className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actionOptions.map((option, index) => (
                <DropdownMenuItem
                  key={index}
                  onSelect={() => onAction(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2 (Details) */}
      {details && (
        <div className="ml-7 bg-black px-2 py-1">
          <div className="text-secondary-foreground whitespace-pre-line text-sm leading-normal">
            {details}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRow;
