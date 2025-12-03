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
import { useStudyListWorkflows } from './StudyListWorkflowProvider';

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
  /**
   * Children must include exactly one <SettingsPopover.Trigger> and one <SettingsPopover.Content>.
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
 *   <SettingsPopover.Content>
 *     <SettingsPopover.Workflow ... />
 *     <SettingsPopover.Divider />
 *     <SettingsPopover.Link href="/about">About</SettingsPopover.Link>
 *   </SettingsPopover.Content>
 * </SettingsPopover>
 */
function SettingsPopoverComponent({ open, onOpenChange, children }: RootProps) {
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

  // Extract the Trigger and Content nodes from children
  const childrenArray = React.Children.toArray(children);
  let triggerNode: React.ReactNode | null = null;
  let contentNode: React.ReactElement<ContentProps> | null = null;

  for (const child of childrenArray) {
    if (React.isValidElement(child) && child.type === SettingsPopoverTrigger) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      triggerNode = (child.props as TriggerProps).children;
    } else if (React.isValidElement(child) && child.type === SettingsPopoverContent) {
      contentNode = child as React.ReactElement<ContentProps>;
    }
  }

  if (!triggerNode) {
    throw new Error(
      '<SettingsPopover.Trigger> is required as a direct child of <SettingsPopover>.'
    );
  }
  if (!contentNode) {
    throw new Error(
      '<SettingsPopover.Content> is required as a direct child of <SettingsPopover>.'
    );
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>{triggerNode}</PopoverTrigger>

      <SettingsPopoverContext.Provider value={{ close }}>
        {contentNode}
      </SettingsPopoverContext.Provider>
    </Popover>
  );
}

type ContentProps = {
  /** PopoverContent alignment (defaults to "end"). */
  align?: React.ComponentProps<typeof PopoverContent>['align'];
  /** PopoverContent side offset (defaults to 8). */
  sideOffset?: number;
  /** Optional className to extend PopoverContent. */
  className?: string;
  children?: React.ReactNode;
};

/**
 * SettingsPopover.Content
 * Wraps the popover body content.
 */
function SettingsPopoverContent({
  align = 'end',
  sideOffset = 8,
  className,
  children,
}: ContentProps) {
  return (
    <PopoverContent
      align={align}
      sideOffset={sideOffset}
      className={['w-[315px] p-4', className].filter(Boolean).join(' ')}
      // Prevents unwanted focus jumps when opening
      onOpenAutoFocus={e => e.preventDefault()}
    >
      {children}
    </PopoverContent>
  );
}

/**
 * SettingsPopover.Workflow
 * Renders the "Default Workflow" row with a Select.
 * Closes the popover after selection.
 */
function Workflow() {
  const { close } = useSettingsPopoverContext();
  const { workflows, defaultWorkflowId, setDefaultWorkflowId } = useStudyListWorkflows();
  const selectId = React.useId();
  const NO_DEFAULT_VALUE = '__NO_DEFAULT__';

  return (
    <div className="mt-0 flex items-center gap-3">
      <Label
        htmlFor={selectId}
        className="whitespace-nowrap"
      >
        Default Workflow
      </Label>
      <div className="min-w-0 flex-1">
        <Select
          value={defaultWorkflowId ?? undefined}
          onValueChange={value => {
            if (value === NO_DEFAULT_VALUE) {
              setDefaultWorkflowId();
            } else {
              setDefaultWorkflowId(value);
            }
            close();
          }}
        >
          <SelectTrigger
            id={selectId}
            className="w-full"
          >
            <SelectValue placeholder="Select Workflow" />
          </SelectTrigger>
          {/* Keep stopPropagation so the Select's portal doesn't trigger outside interactions on the Popover */}
          <SelectContent onPointerDown={e => e.stopPropagation()}>
            {workflows.map(workflow => (
              <SelectItem
                key={workflow.id}
                value={workflow.id}
              >
                {workflow.displayName}
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

  const handleClick: React.MouseEventHandler<HTMLElement> = e => {
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
        className="h-7 w-full justify-start"
      >
        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
        <a
          href={href}
          target={target}
          rel={rel}
          onClick={handleClick}
        >
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
      className="h-7 w-full justify-start"
    >
      {children}
    </Button>
  );
}

SettingsPopoverComponent.displayName = 'SettingsPopover';

export const SettingsPopover = Object.assign(SettingsPopoverComponent, {
  Trigger: SettingsPopoverTrigger,
  Content: SettingsPopoverContent,
  Workflow,
  Divider,
  Link,
});
