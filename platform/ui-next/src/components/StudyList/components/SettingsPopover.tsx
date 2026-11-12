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
import { useWorkflows } from './WorkflowsProvider';

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

type SettingsPopoverProps = {
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
 *     <SettingsPopover.Item onClick={...}>About</SettingsPopover.Item>
 *   </SettingsPopover.Content>
 * </SettingsPopover>
 */
function SettingsPopoverRoot({ children }: SettingsPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

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
      open={open}
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
  children?: React.ReactNode;
};

function SettingsPopoverContent({ children }: ContentProps) {
  return (
    <PopoverContent
      align="end"
      sideOffset={8}
      className="w-[315px] p-4"
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
  const { workflows, defaultWorkflowId, setDefaultWorkflowId } = useWorkflows();
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

type ItemProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

function Item({ children, onClick }: ItemProps) {
  const { close } = useSettingsPopoverContext();

  const handleClick = () => {
    onClick?.();
    close();
  };

  return (
    <Button
      variant="ghost"
      size="default"
      onClick={handleClick}
      className="h-7 w-full justify-start"
    >
      {children}
    </Button>
  );
}

SettingsPopoverRoot.displayName = 'SettingsPopover';

export const SettingsPopover = Object.assign(SettingsPopoverRoot, {
  Trigger: SettingsPopoverTrigger,
  Content: SettingsPopoverContent,
  Workflow,
  Divider,
  Item,
});
