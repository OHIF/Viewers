import React from 'react';
import { useToolbar, useIsMobile } from '@ohif/core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  Button,
  Icons,
  cn,
} from '@ohif/ui-next';

/**
 * Component to render MoreTools as a nested submenu in mobile view
 */
function MobileMoreToolsMenu({
  id,
  buttonSection,
  viewportId,
  onInteraction,
  isItemOpen,
  isItemLocked,
  openItem,
  closeItem,
  toggleLock,
  location,
}: {
  id: string;
  buttonSection: string | boolean;
  viewportId?: string;
  onInteraction: (args: any) => void;
  isItemOpen: (itemId: string, viewportId?: string) => boolean;
  isItemLocked: (itemId: string, viewportId?: string) => boolean;
  openItem: (itemId: string, viewportId?: string) => void;
  closeItem: (itemId: string, viewportId?: string) => void;
  toggleLock: (itemId: string, viewportId?: string) => void;
  location?: number;
}) {
  // Get the actual button section name - if boolean true, use the button id as section name
  const sectionName = typeof buttonSection === 'string' ? buttonSection : id;

  const { toolbarButtons } = useToolbar({
    buttonSection: sectionName,
  });

  if (!toolbarButtons?.length) {
    return null;
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center space-x-2">
        <Icons.ByName
          name="tool-more-menu"
          className="h-5 w-5"
        />
        <span>More Tools</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {toolbarButtons.map(toolDef => {
          if (!toolDef) {
            return null;
          }

          const { id: toolId, componentProps } = toolDef;
          const { icon, label, tooltip, isActive, disabled } = componentProps || {};

          return (
            <DropdownMenuItem
              key={toolId}
              disabled={disabled}
              className={cn(
                'flex items-center space-x-2 cursor-pointer',
                isActive && 'bg-accent'
              )}
              onSelect={() => {
                onInteraction({
                  ...componentProps,
                  itemId: toolId,
                  viewportId,
                  commands: componentProps?.commands,
                });
              }}
            >
              {icon && (
                <Icons.ByName
                  name={icon}
                  className="h-5 w-5"
                />
              )}
              <span>{label || tooltip || toolId}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/**
 * Props for the Toolbar component that renders a collection of toolbar buttons and/or button sections.
 *
 * @interface ToolbarProps
 */
interface ToolbarProps {
  /**
   * The section of buttons to display in the toolbar.
   * Common values include 'primary', 'secondary', 'tertiary', etc.
   * Defaults to 'primary' if not specified.
   *
   * @default 'primary'
   */
  buttonSection?: string;

  /**
   * The unique identifier of the viewport this toolbar is associated with.
   */
  viewportId?: string;

  /**
   * The numeric position or location of the toolbar.
   * Used for ordering and layout purposes in the UI.
   */
  location?: number;
}

export function Toolbar({ buttonSection = 'primary', viewportId, location }: ToolbarProps) {
  const {
    toolbarButtons,
    onInteraction,
    isItemOpen,
    isItemLocked,
    openItem,
    closeItem,
    toggleLock,
  } = useToolbar({
    buttonSection,
  });

  const isMobile = useIsMobile(768); // Use md breakpoint (768px)
  const [layoutSelectorOpen, setLayoutSelectorOpen] = React.useState(false);
  const layoutButtonRef = React.useRef<HTMLDivElement>(null);

  if (!toolbarButtons.length) {
    return null;
  }

  // Find Layout button component
  const layoutButtonDef = toolbarButtons.find(btn => btn.id === 'Layout');
  const LayoutComponent = layoutButtonDef?.Component;

  // On mobile, show all tools in a dropdown menu
  if (isMobile) {
    const activeTool = toolbarButtons.find(
      button => button.componentProps?.isActive
    )?.componentProps || toolbarButtons[0]?.componentProps;

    // Get icon for active tool, with special handling for Layout button
    const getActiveToolIcon = () => {
      if (activeTool?.icon) {
        return activeTool.icon;
      }
      // Check if Layout button exists in toolbar
      const layoutButton = toolbarButtons.find(btn => btn.id === 'Layout');
      if (layoutButton) {
        return 'tool-layout';
      }
      return 'menu';
    };

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground/80 hover:bg-background hover:text-highlight border-primary inline-flex h-10 w-10 items-center justify-center rounded-lg bg-transparent"
            >
              <Icons.ByName
                name={getActiveToolIcon()}
                className="h-5 w-5"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="bottom"
            align="start"
            className="max-h-[80vh] overflow-y-auto"
          >
            {toolbarButtons.map(toolDef => {
              if (!toolDef) {
                return null;
              }

              const { id, Component, componentProps } = toolDef;
              const { icon, label, tooltip, isActive, disabled, buttonSection } = componentProps || {};

              // Enhanced props with state and actions - respecting viewport specificity
              const enhancedProps = {
                ...componentProps,
                isOpen: isItemOpen(id, viewportId),
                isLocked: isItemLocked(id, viewportId),
                onOpen: () => openItem(id, viewportId),
                onClose: () => closeItem(id, viewportId),
                onToggleLock: () => toggleLock(id, viewportId),
                viewportId,
              };

              // Handle Layout button - render as menu item like other buttons
              if (id === 'Layout') {
                return (
                  <DropdownMenuItem
                    key={id}
                    disabled={disabled}
                    className={cn(
                      'flex items-center space-x-2 cursor-pointer',
                      isActive && 'bg-accent'
                    )}
                    onSelect={(e) => {
                      e.preventDefault();
                      setLayoutSelectorOpen(true);
                      onInteraction({
                        ...componentProps,
                        itemId: id,
                        viewportId,
                        commands: componentProps?.commands,
                      });
                    }}
                  >
                    <Icons.ByName
                      name="tool-layout"
                      className="h-5 w-5"
                    />
                    <span>{label || tooltip || id}</span>
                  </DropdownMenuItem>
                );
              }

            // Handle MoreTools button - render as nested submenu
            if (id === 'MoreTools' && buttonSection) {
              return (
                <MobileMoreToolsMenu
                  key={id}
                  id={id}
                  buttonSection={buttonSection}
                  viewportId={viewportId}
                  onInteraction={onInteraction}
                  isItemOpen={isItemOpen}
                  isItemLocked={isItemLocked}
                  openItem={openItem}
                  closeItem={closeItem}
                  toggleLock={toggleLock}
                  location={location}
                />
              );
            }

            // Regular button - render as menu item
            return (
              <DropdownMenuItem
                key={id}
                disabled={disabled}
                className={cn(
                  'flex items-center space-x-2 cursor-pointer',
                  isActive && 'bg-accent'
                )}
                onSelect={() => {
                  onInteraction({
                    ...componentProps,
                    itemId: id,
                    viewportId,
                    commands: componentProps?.commands,
                  });
                }}
              >
                {icon && (
                  <Icons.ByName
                    name={icon}
                    className="h-5 w-5"
                  />
                )}
                <span>{label || tooltip || id}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Layout Selector - rendered outside dropdown but controlled by menu item */}
      {LayoutComponent && layoutButtonDef && (
        <div
          ref={layoutButtonRef}
          className="fixed invisible pointer-events-none"
          style={{
            top: 0,
            left: 0,
            width: '1px',
            height: '1px'
          }}
        >
          <LayoutComponent
            id="Layout"
            location={location}
            open={layoutSelectorOpen}
            onOpenChange={setLayoutSelectorOpen}
            onInteraction={args => {
              onInteraction({
                ...args,
                itemId: 'Layout',
                viewportId,
              });
            }}
            {...(layoutButtonDef.componentProps || {})}
            viewportId={viewportId}
          />
        </div>
      )}
    </>
    );
  }

  // Desktop: show tools normally
  return (
    <>
      {toolbarButtons?.map(toolDef => {
        if (!toolDef) {
          return null;
        }

        const { id, Component, componentProps } = toolDef;

        // Enhanced props with state and actions - respecting viewport specificity
        const enhancedProps = {
          ...componentProps,
          isOpen: isItemOpen(id, viewportId),
          isLocked: isItemLocked(id, viewportId),
          onOpen: () => openItem(id, viewportId),
          onClose: () => closeItem(id, viewportId),
          onToggleLock: () => toggleLock(id, viewportId),
          viewportId,
        };

        const tool = (
          <Component
            key={id}
            id={id}
            location={location}
            onInteraction={args => {
              onInteraction({
                ...args,
                itemId: id,
                viewportId,
              });
            }}
            {...enhancedProps}
          />
        );

        return (
          <div
            key={id}
            // This wrapper div exists solely for React's key prop requirement during reconciliation.
            // We use display:contents to make it transparent to the layout engine (children appear
            // as direct children of the parent) while keeping it in the DOM for React's virtual DOM.
            className="contents"
          >
            {tool}
          </div>
        );
      })}
    </>
  );
}
