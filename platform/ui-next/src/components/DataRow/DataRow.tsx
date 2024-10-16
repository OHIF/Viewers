import React, { useState } from 'react';
import { Button } from '../../components/Button/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/DropdownMenu';
import { Icons } from '../../components/Icons/Icons';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '../../components/Tooltip/Tooltip';

interface DataRowProps {
  number: number;
  title: string;
  description: string;
  optionalField?: string;
  colorHex?: string;
  details?: string;
  series?: string;
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
  series,
  actionOptions,
  onAction,
  isSelected = false,
  onSelect,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const isTitleLong = title.length > 25;

  return (
    <TooltipProvider>
      {' '}
      {/* Ensure TooltipProvider wraps the component */}
      <div className="flex flex-col">
        {/* Row 1 with 'group' class to enable group-hover */}
        <div
          className={`flex items-center ${
            isSelected ? 'bg-popover' : 'bg-muted'
          } group relative cursor-pointer ${isVisible ? '' : 'opacity-60'}`}
          onClick={onSelect}
        >
          {/* Hover Overlay */}
          <div className="bg-primary/20 pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>

          {/* Number Box */}
          <div
            className={`flex h-7 max-h-7 w-7 flex-shrink-0 items-center justify-center rounded-l border-r border-black text-sm ${
              isSelected ? 'bg-highlight text-black' : 'bg-muted text-muted-foreground'
            } overflow-hidden`}
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

          {/* Label with Conditional Tooltip */}
          <div className="ml-2 flex-1 overflow-hidden">
            {isTitleLong ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`cursor-default text-sm ${
                      isSelected ? 'text-highlight' : 'text-muted-foreground'
                    } [overflow:hidden] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]`}
                  >
                    {title}
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="center"
                >
                  {title}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span
                className={`text-sm ${
                  isSelected ? 'text-highlight' : 'text-muted-foreground'
                } [overflow:hidden] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]`}
              >
                {title}
              </span>
            )}
          </div>

          {/* Actions and Visibility Toggle */}
          <div className="relative ml-2 flex items-center space-x-1">
            {/* Visibility Toggle Icon */}
            {isVisible ? (
              <Button
                size="small"
                variant="ghost"
                className={`h-6 w-6 transition-opacity ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                aria-label="Hide"
                onClick={e => {
                  e.stopPropagation(); // Prevent row selection on button click
                  setIsVisible(false);
                }}
              >
                <Icons.Hide className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                size="small"
                variant="ghost"
                className="h-6 w-6 opacity-100"
                aria-label="Show"
                onClick={e => {
                  e.stopPropagation(); // Prevent row selection on button click
                  setIsVisible(true);
                }}
              >
                <Icons.Show className="h-6 w-6" />
              </Button>
            )}

            {/* Actions Dropdown Menu */}
            <DropdownMenu onOpenChange={open => setIsDropdownOpen(open)}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="small"
                  variant="ghost"
                  className={`h-6 w-6 transition-opacity ${
                    isSelected || isDropdownOpen
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  }`}
                  aria-label="Actions"
                  onClick={e => e.stopPropagation()} // Prevent row selection on button click
                >
                  <Icons.More className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Icons.Rename className="text-foreground" />
                  <span className="pl-2">Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icons.Lock className="text-foreground" />
                  <span className="pl-2">Lock</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icons.ColorChange className="text-foreground" />
                  <span className="pl-2">Change Color</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Icons.Delete className="text-foreground" />
                  <span className="pl-2">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2 (Details and Series) */}
        {(details || series) && (
          <div className="ml-7 bg-black px-2 py-1">
            {/* Updated Flex Container: Changed 'items-center' to 'items-start' */}
            <div className="text-secondary-foreground flex items-start justify-between whitespace-pre-line text-sm leading-normal">
              <span>{details}</span>
              {series && <span className="text-muted-foreground">{series}</span>}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default DataRow;
