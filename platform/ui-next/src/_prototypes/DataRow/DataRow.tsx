// src/_prototypes/DataRow/DataRow.tsx

import React from 'react';
import { Button } from '../../components/Button/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/DropdownMenu'; // Adjust the import path as necessary

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
  return (
    <div className="flex flex-col">
      {/* Row 1 with 'group' class to enable group-hover */}
      <div
        className={`flex h-7 items-center px-2 ${
          isSelected ? 'bg-popover' : 'bg-muted'
        } group relative cursor-pointer`}
        onClick={onSelect}
      >
        {/* Hover Overlay */}
        <div className="bg-primary/20 pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>

        {/* Number Box */}
        <div
          className={`mr-2 flex h-7 w-7 items-center justify-center rounded ${
            isSelected ? 'bg-highlight text-black' : 'bg-muted text-muted-foreground'
          }`}
        >
          {number}
        </div>

        {/* Color Circle (Optional) */}
        {colorHex && (
          <div className="mr-2 flex h-7 w-7 items-center justify-center">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colorHex }}
            ></span>
          </div>
        )}

        {/* Label */}
        <div className="flex-1 overflow-hidden">
          <span
            className={`truncate text-sm ${
              isSelected ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {title}
          </span>
        </div>

        {/* Actions Button (Appears on Hover of the entire row) */}
        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="small"
                variant="ghost" // Using the ghost variant
                className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Actions"
                onClick={e => e.stopPropagation()} // Prevent row selection on button click
              >
                ⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
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

      {/* Row 2 (Optional) */}
      {details && (
        <div className="flex h-7 items-center bg-black px-2 text-white">
          <span className="truncate text-sm">{details}</span>
        </div>
      )}
    </div>
  );
};

export default DataRow;
