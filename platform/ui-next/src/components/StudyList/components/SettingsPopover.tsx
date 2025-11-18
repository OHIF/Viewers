import * as React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../../Popover/Popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../../Select';
import { Label } from '../../Label';
import { Button } from '../../Button';
import { Icons } from '../../Icons';
import { ALL_WORKFLOW_OPTIONS, type WorkflowId } from '../WorkflowsInfer';

/** Context to allow subcomponents to close the popover */
type SettingsPopoverContextValue = {
  close: () => void;
};

const SettingsPopoverContext = React.createContext<SettingsPopoverContextValue | null>(null);

function useSettingsPopoverContext() {
  const ctx = React.useContext(SettingsPopoverContext);
  if (!ctx) {
    throw new Error('SettingsPopover subcomponents must be used within <SettingsPopover>');
  }
  return ctx;
}

type RootProps = {
  /** Controlled open state (optional). If omitted, component manages its own state. */
  open?: boolean;
  /** onOpenChange for controlled usage (optional). */
  onOpenChange?: (open: boolean) => void;
  /** PopoverContent alignment (defaults to "end"). */
  align?: React.ComponentProps<typeof PopoverContent>['align'];
  /** PopoverContent side offset (defaults to 8). */
  sideOffset?: number;
  /** Optional className to extend PopoverContent. */
  contentClassName?: string;
  /**
   * Children must include exactly one <SettingsPopover.Trigger> plus any content for the popover body
   * (e.g., <SettingsPopover.Workflow />, <SettingsPopover.Divider />, <SettingsPopover.Link />, etc.).
   */
  children?: React.ReactNode;
};

/** Marker subcomponent: consumed by the root to render the PopoverTrigger */
type TriggerProps = {
  children: React.ReactNode;
};

function SettingsPopoverTrigger(_props: TriggerProps) {
  // This is a marker-only component. The root extracts its children and renders them inside PopoverTrigger.
  return null;
}
SettingsPopoverTrigger.displayName = 'SettingsPopover.Trigger';

/**
 * Root SettingsPopover component (compound API).
 * Usage:
 * <SettingsPopover>
 *   <SettingsPopover.Trigger><Button>...</Button></SettingsPopover.Trigger>
 *   <SettingsPopover.Workflow ... />
 *   <SettingsPopover.Divider />
 *   <SettingsPopover.Link href="/about">About</SettingsPopover.Link>
 * </SettingsPopover>
 */
function SettingsPopoverComponent({
  open,
  onOpenChange,
  align = 'end',
  sideOffset = 8,
  contentClassName,
  children,
}: RootProps) {
  const isControlled = typeof open === 'boolean';
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isOpen = isControlled ? (open as boolean) : internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const close = React.useCallback(() => setOpen(false), [setOpen]);

  // Extract the Trigger node from children and collect the rest as popover content
  const childrenArray = React.Children.toArray(children);
  let triggerNode: React.ReactNode | null = null;
  const contentChildren: React.ReactNode[] = [];

  for (const child of childrenArray) {
    if (React.isValidElement(child) && child.type === SettingsPopoverTrigger) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      triggerNode = (child.props as TriggerProps).children;
    } else {
      contentChildren.push(child);
    }
  }

  if (!triggerNode) {
    throw new Error('<SettingsPopover.Trigger> is required as a direct child of <SettingsPopover>.');
  }

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {triggerNode}
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={sideOffset}
        className={['w-[315px] p-4', contentClassName].filter(Boolean).join(' ')}
        // Prevents unwanted focus jumps when opening
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <SettingsPopoverContext.Provider value={{ close }}>
          {contentChildren}
        </SettingsPopoverContext.Provider>
      </PopoverContent>
    </Popover>
  );
}

type WorkflowProps = {
  /** Selected default workflow */
  defaultMode: WorkflowId | null;
  /** Handler when default workflow changes */
  onDefaultModeChange: (value: WorkflowId | null) => void;
  /** Optional label text, defaults to "Default Workflow" */
  label?: string;
};

/**
 * SettingsPopover.Workflow
 * Renders the "Default Workflow" row with a Select.
 * Closes the popover after selection.
 */
function Workflow({ defaultMode, onDefaultModeChange, label = 'Default Workflow' }: WorkflowProps) {
  const { close } = useSettingsPopoverContext();
  const selectId = React.useId();
  const NO_DEFAULT_VALUE = '__NO_DEFAULT__';

  return (
    <div className="mt-0 flex items-center gap-3">
      <Label htmlFor={selectId} className="whitespace-nowrap">
        {label}
      </Label>
      <div className="min-w-0 flex-1">
        <Select
          value={defaultMode ?? undefined}
          onValueChange={(value) => {
            if (value === NO_DEFAULT_VALUE) {
              onDefaultModeChange(null);
            } else {
              onDefaultModeChange(value as WorkflowId);
            }
            close();
          }}
        >
          <SelectTrigger id={selectId} className="w-full">
            <SelectValue placeholder="Select Workflow" />
          </SelectTrigger>
          {/* Keep stopPropagation so the Select's portal doesn't trigger outside interactions on the Popover */}
          <SelectContent onPointerDown={(e) => e.stopPropagation()}>
            {ALL_WORKFLOW_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectItem value={NO_DEFAULT_VALUE}>No Default</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/**
 * SettingsPopover.Divider
 * A simple divider to separate sections inside the popover.
 */
function Divider() {
  return <div className="bg-muted -mx-2 my-3 h-px" />;
}

type LinkProps = {
  /** Link label */
  children: React.ReactNode;
  /** Optional href for navigation */
  href?: string;
  /** Optional click handler (runs before closing) */
  onClick?: () => void;
  /** Target for anchor links (e.g., "_blank") */
  target?: string;
  /** rel for anchor links */
  rel?: string;
  /** data-cy for testing */
  dataCY?: string;
};

/**
 * SettingsPopover.Link
 * Generic link-style button that matches existing popover link styling.
 * Supports href or onClick and closes the popover afterwards.
 */
function Link({ children, href, onClick, target, rel, dataCY }: LinkProps) {
  const { close } = useSettingsPopoverContext();

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    onClick?.();
    // Close popover after an action
    close();
  };

  // Render as anchor if href provided; otherwise as button
  if (href) {
    return (
      <Button
        asChild
        variant="ghost"
        size="default"
        dataCY={dataCY}
        className="w-full justify-start h-7"
      >
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a href={href} target={target} rel={rel} onClick={handleClick}>
          {children}
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="default"
      onClick={handleClick}
      dataCY={dataCY}
      className="w-full justify-start h-7"
    >
      {children}
    </Button>
  );
}

SettingsPopoverComponent.displayName = 'SettingsPopover';

export const SettingsPopover = Object.assign(SettingsPopoverComponent, {
  Trigger: SettingsPopoverTrigger,
  Workflow,
  Divider,
  Link,
});
