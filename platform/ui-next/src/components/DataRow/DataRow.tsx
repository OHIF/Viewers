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
  disableEditing: boolean;
  description: string;
  details?: { primary: string[]; secondary: string[] };
  //
  isSelected?: boolean;
  onSelect?: () => void;
  //
  isVisible: boolean;
  onToggleVisibility: () => void;
  //
  isLocked: boolean;
  onToggleLocked: () => void;
  //
  title: string;
  onRename: () => void;
  //
  onDelete: () => void;
  //
  colorHex?: string;
  onColor: () => void;
}

const DataRow: React.FC<DataRowProps> = ({
  number,
  title,
  colorHex,
  details,
  onSelect,
  isLocked,
  onToggleVisibility,
  onToggleLocked,
  onRename,
  onDelete,
  onColor,
  isSelected = false,
  isVisible = true,
  disableEditing = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isTitleLong = title?.length > 25;

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    switch (action) {
      case 'Rename':
        onRename();
        break;
      case 'Lock':
        onToggleLocked();
        break;
      case 'Delete':
        onDelete();
        break;
      case 'Color':
        onColor();
        break;
    }
  };

  debugger;
  const renderDetailText = (text: string) => {
    const parts = text.split(/(<small>.*?<\/small>)/);
    return parts.map((part, index) => {
      if (part.startsWith('<small>') && part.endsWith('</small>')) {
        return <small key={index}>{part.slice(7, -8)}</small>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <TooltipProvider>
      <div className={`flex flex-col ${isVisible ? '' : 'opacity-60'}`}>
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
            <Button
              size="icon"
              variant="ghost"
              className={`h-6 w-6 transition-opacity ${
                isSelected || !isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              aria-label={isVisible ? 'Hide' : 'Show'}
              onClick={e => {
                e.stopPropagation();
                onToggleVisibility();
              }}
            >
              {isVisible ? <Icons.Hide className="h-6 w-6" /> : <Icons.Show className="h-6 w-6" />}
            </Button>

            {/* Lock Icon (if needed) */}
            {isLocked && <Icons.Lock className="text-muted-foreground h-6 w-6" />}

            {/* Actions Dropdown Menu */}
            <DropdownMenu onOpenChange={open => setIsDropdownOpen(open)}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
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
                {!disableEditing && (
                  <>
                    <DropdownMenuItem onClick={e => handleAction('Rename', e)}>
                      <Icons.Rename className="text-foreground" />
                      <span className="pl-2">Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={e => handleAction('Delete', e)}>
                      <Icons.Delete className="text-foreground" />
                      <span className="pl-2">Delete</span>
                    </DropdownMenuItem>
                    {onColor && (
                      <DropdownMenuItem onClick={e => handleAction('Color', e)}>
                        <Icons.ColorChange className="text-foreground" />
                        <span className="pl-2">Change Color</span>
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                <DropdownMenuItem onClick={e => handleAction('Lock', e)}>
                  <Icons.Lock className="text-foreground" />
                  <span className="pl-2">{isLocked ? 'Unlock' : 'Lock'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {details && (details.primary.length > 0 || details.secondary.length > 0) && (
          <div className="ml-7 px-2 py-2">
            <div className="text-secondary-foreground flex flex-col space-y-2">
              <div className="flex items-start justify-between text-sm leading-normal">
                <div className="flex-grow whitespace-pre-line">
                  {details.primary.map((line, lineIndex) => (
                    <div key={lineIndex}>{renderDetailText(line)}</div>
                  ))}
                </div>
                {details.secondary.length > 0 && (
                  <div className="text-muted-foreground ml-4 flex-shrink-0">
                    {details.secondary.map((secondaryText, index) => (
                      <small key={index}>{secondaryText}</small>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default DataRow;
