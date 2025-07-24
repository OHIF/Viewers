import React, { useState, useRef } from 'react';
import { Button } from '../../components/Button/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/DropdownMenu';
import { Icons } from '../../components/Icons/Icons';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../components/Tooltip/Tooltip';
import { cn } from '../../lib/utils';

/**
 * DataRow is a complex UI component that displays a selectable, interactive row with hierarchical data.
 * It's designed to show a numbered item with a title, optional color indicator, and expandable details.
 * The row supports various interactive features like visibility toggling, locking, and contextual actions.
 *
 * @component
 * @example
 * ```tsx
 * <DataRow
 *   number={1}
 *   title="My Item"
 *   details={{
 *     primary: ["Main detail", "  Sub detail"],
 *     secondary: []
 *   }}
 *   isVisible={true}
 *   isLocked={false}
 *   onToggleVisibility={() => {}}
 *   onToggleLocked={() => {}}
 *   onRename={() => {}}
 *   onDelete={() => {}}
 *   onColor={() => {}}
 * />
 * ```
 */

/**
 * Props for the DataRow component
 * @interface DataRowProps
 * @property {number} number - The display number/index of the row
 * @property {string} title - The main text label for the row
 * @property {boolean} disableEditing - When true, prevents rename and delete operations
 * @property {string} [colorHex] - Optional hex color code to display a color indicator
 * @property {Object} [details] - Optional hierarchical details to display below the row
 * @property {string[]} details.primary - Primary details shown immediately below the row
 * @property {string[]} details.secondary - Secondary details (currently unused)
 * @property {boolean} [isSelected] - Whether the row is currently selected
 * @property {() => void} [onSelect] - Callback when the row is clicked/selected
 * @property {boolean} isVisible - Controls the row's visibility state
 * @property {() => void} onToggleVisibility - Callback to toggle visibility
 * @property {boolean} isLocked - Controls the row's locked state
 * @property {() => void} onToggleLocked - Callback to toggle locked state
 * @property {() => void} onRename - Callback when rename is requested
 * @property {() => void} onDelete - Callback when delete is requested
 * @property {() => void} onColor - Callback when color change is requested
 */
interface DataRowProps {
  number: number | null;
  disableEditing: boolean;
  description: string;
  details?: { primary: string[]; secondary: string[] };
  //
  isSelected?: boolean;
  onSelect?: (e) => void;
  //
  isVisible: boolean;
  onToggleVisibility: (e) => void;
  //
  isLocked: boolean;
  onToggleLocked: (e) => void;
  //
  title: string;
  onRename: (e) => void;
  //
  onDelete: (e) => void;
  //
  colorHex?: string;
  onColor: (e) => void;
  className?: string;
}

export const DataRow: React.FC<DataRowProps> = ({
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
  className,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isTitleLong = title?.length > 25;
  const rowRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   if (isSelected && rowRef.current) {
  //     setTimeout(() => {
  //       rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //     }, 200);
  //   }
  // }, [isSelected]);

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    switch (action) {
      case 'Rename':
        onRename(e);
        break;
      case 'Lock':
        onToggleLocked(e);
        break;
      case 'Delete':
        onDelete(e);
        break;
      case 'Color':
        onColor(e);
        break;
    }
  };

  const decodeHTML = (html: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const renderDetailText = (text: string, indent: number = 0) => {
    const indentation = '  '.repeat(indent);
    if (text === '') {
      return (
        <div
          key={`empty-${indent}`}
          className="h-2"
        ></div>
      );
    }
    const cleanText = decodeHTML(text);
    return (
      <div
        key={cleanText}
        className="whitespace-pre-wrap"
      >
        {indentation}
        <span className="font-medium">{cleanText}</span>
      </div>
    );
  };

  const renderDetails = (details: string[]) => {
    const visibleLines = details.slice(0, 4);
    const hiddenLines = details.slice(4);

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            <div className="flex flex-col space-y-1">
              {visibleLines.map((line, lineIndex) =>
                renderDetailText(line, line.startsWith('  ') ? 1 : 0)
              )}
            </div>
            {hiddenLines.length > 0 && (
              <div className="text-muted-foreground mt-1 flex items-center text-sm">
                <span>...</span>
                <Icons.Info className="mr-1 h-5 w-5" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="start"
          className="max-w-md"
        >
          <div className="text-secondary-foreground flex flex-col space-y-1 text-sm leading-normal">
            {details.map((line, lineIndex) =>
              renderDetailText(line, line.startsWith('  ') ? 1 : 0)
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div
      ref={rowRef}
      className={cn('flex flex-col', !isVisible && 'opacity-60', className)}
    >
      <div
        className={`flex items-center ${
          isSelected ? 'bg-popover' : 'bg-muted'
        } group relative cursor-pointer`}
        onClick={onSelect}
        data-cy="data-row"
      >
        {/* Hover Overlay */}
        <div className="bg-primary/20 pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>

        {/* Number Box */}
        {number !== null && (
          <div
            className={`flex h-7 max-h-7 w-7 flex-shrink-0 items-center justify-center rounded-l border-r border-black text-base ${
              isSelected ? 'bg-highlight text-black' : 'bg-muted text-muted-foreground'
            } overflow-hidden`}
          >
            {number}
          </div>
        )}

        {/* add some space if there is not segment index */}
        {number === null && <div className="ml-1 h-7"></div>}
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
                  className={`cursor-default text-base ${
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
              className={`text-base ${
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
              onToggleVisibility(e);
            }}
          >
            {isVisible ? <Icons.Hide className="h-6 w-6" /> : <Icons.Show className="h-6 w-6" />}
          </Button>

          {/* Lock Icon (if needed) */}
          {isLocked && !disableEditing && <Icons.Lock className="text-muted-foreground h-6 w-6" />}

          {/* Actions Dropdown Menu */}
          {disableEditing && <div className="h-6 w-6"></div>}
          {!disableEditing && (
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
                  dataCY="actionsMenuTrigger"
                  onClick={e => e.stopPropagation()} // Prevent row selection on button click
                >
                  <Icons.More className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                // this was causing issue for auto focus on input dialog
                onCloseAutoFocus={e => e.preventDefault()}
              >
                <>
                  <DropdownMenuItem onClick={e => handleAction('Rename', e)}>
                    <Icons.Rename className="text-foreground" />
                    <span
                      className="pl-2"
                      data-cy="Rename"
                    >
                      Rename
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={e => handleAction('Delete', e)}>
                    <Icons.Delete className="text-foreground" />
                    <span
                      className="pl-2"
                      data-cy="Delete"
                    >
                      Delete
                    </span>
                  </DropdownMenuItem>
                  {onColor && (
                    <DropdownMenuItem onClick={e => handleAction('Color', e)}>
                      <Icons.ColorChange className="text-foreground" />
                      <span
                        className="pl-2"
                        data-cy="Change Color"
                      >
                        Change Color
                      </span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={e => handleAction('Lock', e)}>
                    <Icons.Lock className="text-foreground" />
                    <span
                      className="pl-2"
                      data-cy="LockToggle"
                    >
                      {isLocked ? 'Unlock' : 'Lock'}
                    </span>
                  </DropdownMenuItem>
                </>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Details Section */}
      {details && (details.primary?.length > 0 || details.secondary?.length > 0) && (
        <div className="ml-7 px-2 py-2">
          <div className="text-secondary-foreground flex items-center gap-1 text-base leading-normal">
            {details.primary?.length > 0 && renderDetails(details.primary)}
            {details.secondary?.length > 0 && (
              <div className="text-muted-foreground ml-auto text-sm">
                {renderDetails(details.secondary)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRow;
