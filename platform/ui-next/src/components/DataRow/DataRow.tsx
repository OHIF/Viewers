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
 * DataRow displays a selectable, interactive row with hierarchical data.
 *
 * IMPORTANT IMPLEMENTATION NOTE:
 * - This component intentionally has **no `isActive` prop**.
 * - The "activeness" of the parent context (e.g., an active Segmentation) is
 *   communicated via a **named Tailwind group** on an ancestor element:
 *     className="group/seg" data-active={true|false}
 * - Styles in this component react to the parent using Tailwind's arbitrary variants:
 *     group-data-[active=true]/seg:...
 *     group-data-[active=false]/seg:...
 *
 * Visual behaviors preserved:
 * 1) Segmentation ACTIVE + segment isSelected  => primary selection UI
 *    - row bg changes to bg-popover
 *    - number cap bg-highlight
 *    - title text-highlight
 *    - action icons visible
 *
 * 2) Segmentation INACTIVE + segment isSelected => "will become active" UI
 *    - base row remains bg-muted
 *    - a subtle overlay bg-primary/20 is shown over the row
 *    - icons do NOT become persistently visible (hover still reveals)
 *
 * Other details (hover overlay, visibility/lock controls, details tooltip) remain unchanged.
 */

/**
 * Props for the DataRow component
 * @interface DataRowProps
 * @property {number} number - The display number/index of the row
 * @property {string} title - The main text label for the row
 * @property {boolean} disableEditing - When true, prevents rename and delete operations
 * @property {string} [colorHex] - Optional hex/rgb color to display a color indicator
 * @property {Object} [details] - Optional hierarchical details to display below the row
 * @property {string[]} details.primary - Primary details shown immediately below the row
 * @property {string[]} details.secondary - Secondary details (currently unused)
 * @property {boolean} [isSelected] - Whether the row is currently selected (active within its segmentation)
 * @property {() => void} [onSelect] - Callback when the row is clicked/selected
 * @property {boolean} isVisible - Controls the row's visibility state
 * @property {() => void} onToggleVisibility - Callback to toggle visibility
 * @property {boolean} isLocked - Controls the row's locked state
 * @property {() => void} onToggleLocked - Callback to toggle locked state
 * @property {() => void} onRename - Callback when rename is requested
 * @property {() => void} onDelete - Callback when delete is requested
 * @property {() => void} onColor - Callback when color change is requested
 * @property {React.ReactNode} children - Optional children, including Status components
 */
interface DataRowProps {
  number: number | null;
  disableEditing: boolean;
  description: string;
  details?: { primary: string[]; secondary: string[] };
  //
  // Whether this row is the selected item within its own group (e.g., selected segment within a segmentation)
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
  onCopy?: (e) => void;
  className?: string;
  children?: React.ReactNode;
}

const DataRowComponent: React.FC<DataRowProps> = ({
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
  onCopy,
  isSelected = false,
  isVisible = true,
  disableEditing = false,
  className,
  children,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isTitleLong = title?.length > 25;
  const rowRef = useRef<HTMLDivElement>(null);

  // Extract Status components from children
  const statusComponents = React.Children.toArray(children).filter(
    child =>
      React.isValidElement(child) &&
      child.type &&
      (child.type as any).displayName?.startsWith('DataRow.Status')
  );

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    switch (action) {
      case 'Rename':
        onRename(e);
        break;
      case 'Copy':
        onCopy?.(e);
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
      className={cn(
        'flex flex-col',
        // Slight dim when the parent segmentation is inactive
        'group-data-[active=false]/seg:opacity-80',
        !isVisible && 'opacity-60',
        className
      )}
    >
      <div
        className={cn(
          // This "group" is for row-level hover effects (not to be confused with the parent named group/seg)
          'group relative flex cursor-pointer items-center',
          // Base row background
          'bg-muted',
          // Primary selection background only when parent segmentation is active
          isSelected && 'group-data-[active=true]/seg:bg-popover'
        )}
        onClick={onSelect}
        data-cy="data-row"
      >
        {/* Secondary selection overlay (shows ONLY when selected AND parent segmentation is inactive) */}
        {isSelected && (
          <div className={cn(
            'pointer-events-none absolute inset-0',
            // Hidden by default; appears when parent segmentation is inactive
            'hidden group-data-[active=false]/seg:block',
            // The "will become active" tint
            'bg-primary/20'
          )}></div>
        )}

        {/* Hover Overlay (row-level hover) */}
        <div className="bg-primary/20 pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"></div>

        {/* Number Box */}
        {number !== null && (
          <div
            className={cn(
              'flex h-7 max-h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-l border-r border-black text-base',
              // Default cap styling
              'bg-muted text-muted-foreground',
              // Highlight the cap ONLY when selected and the parent segmentation is active
              isSelected && 'group-data-[active=true]/seg:bg-highlight group-data-[active=true]/seg:text-black'
            )}
          >
            {number}
          </div>
        )}

        {/* add some space if there is not segment index */}
        {number === null && <div className="ml-1 h-7"></div>}

        {/* Color dot */}
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
                  className={cn(
                    'cursor-default text-base [overflow:hidden] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]',
                    // Default label color
                    'text-muted-foreground',
                    // When selected and parent segmentation is active, use highlight color
                    isSelected && 'group-data-[active=true]/seg:text-highlight'
                  )}
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
              className={cn(
                'text-base [overflow:hidden] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]',
                'text-muted-foreground',
                isSelected && 'group-data-[active=true]/seg:text-highlight'
              )}
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
            className={cn(
              'h-6 w-6 transition-opacity',
              // Always show when hidden (so user can reveal)
              !isVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              // Show persistently if selected AND parent segmentation is active
              isSelected && 'group-data-[active=true]/seg:opacity-100'
            )}
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

          {/* Status Components */}
          {statusComponents}

          {/* Actions Dropdown Menu */}
          {disableEditing && <div className="h-6 w-6"></div>}
          {!disableEditing && (
            <DropdownMenu onOpenChange={open => setIsDropdownOpen(open)}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    'h-6 w-6 transition-opacity',
                    isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    // When selected and the parent segmentation is active, keep the actions visible
                    isSelected && 'group-data-[active=true]/seg:opacity-100'
                  )}
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
                  {onCopy && (
                    <DropdownMenuItem onClick={e => handleAction('Copy', e)}>
                      <Icons.Copy className="text-foreground" />
                      <span
                        className="pl-2"
                        data-cy="Duplicate"
                      >
                        Duplicate
                      </span>
                    </DropdownMenuItem>
                  )}
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

interface StatusProps {
  children: React.ReactNode;
}

interface StatusIndicatorProps {
  tooltip?: string;
  icon: React.ReactNode;
  defaultTooltip: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ tooltip, icon, defaultTooltip }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex h-6 w-6 items-center justify-center">{icon}</div>
    </TooltipTrigger>
    <TooltipContent side="bottom">
      <div>{tooltip || defaultTooltip}</div>
    </TooltipContent>
  </Tooltip>
);

const Status: React.FC<StatusProps> & {
  Warning: React.FC<{ tooltip?: string }>;
  Success: React.FC<{ tooltip?: string }>;
  Error: React.FC<{ tooltip?: string }>;
  Info: React.FC<{ tooltip?: string }>;
} = ({ children }) => {
  return <>{children}</>;
};

const StatusWarning: React.FC<{ tooltip?: string }> = ({ tooltip }) => (
  <StatusIndicator
    tooltip={tooltip}
    icon={
      <Icons.ByName
        name="status-alert"
        className="h-4 w-4 text-yellow-500"
      />
    }
    defaultTooltip="Warning"
  />
);

const StatusSuccess: React.FC<{ tooltip?: string }> = ({ tooltip }) => (
  <StatusIndicator
    tooltip={tooltip}
    icon={<Icons.Checked className="h-4 w-4 text-green-500" />}
    defaultTooltip="Success"
  />
);

const StatusError: React.FC<{ tooltip?: string }> = ({ tooltip }) => (
  <StatusIndicator
    tooltip={tooltip}
    icon={
      <Icons.ByName
        name="status-error"
        className="h-4 w-4 text-red-500"
      />
    }
    defaultTooltip="Error"
  />
);

const StatusInfo: React.FC<{ tooltip?: string }> = ({ tooltip }) => (
  <StatusIndicator
    tooltip={tooltip}
    icon={<Icons.Info className="h-4 w-4 text-blue-500" />}
    defaultTooltip="Info"
  />
);

Status.displayName = 'DataRow.Status';
StatusWarning.displayName = 'DataRow.Status.Warning';
StatusSuccess.displayName = 'DataRow.Status.Success';
StatusError.displayName = 'DataRow.Status.Error';
StatusInfo.displayName = 'DataRow.Status.Info';

Status.Warning = StatusWarning;
Status.Success = StatusSuccess;
Status.Error = StatusError;
Status.Info = StatusInfo;

const DataRow = DataRowComponent as React.FC<DataRowProps> & {
  Status: typeof Status;
};

DataRow.Status = Status;

export default DataRow;
export { DataRow };
