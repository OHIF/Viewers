import React from 'react';
import { TooltipProvider } from '../../../../ui-next/src/components/Tooltip';
import ToolButton from '../../../../ui-next/src/components/ToolButton/ToolButton';
import ShowcaseRow from './ShowcaseRow';

/**
 * ToolButtonShowcase component displays ToolButton variants and examples
 */
export default function ToolButtonShowcase() {
  return (
    <ShowcaseRow
      title="ToolButton"
      description="Used to activate tools or perform single actions"
      code={`
// Example usage:
<ToolButton
  id="Zoom"
  icon="zoom" // must exist in your Icons or fallback to 'MissingIcon'
  label="Zoom"
  tooltip="Zoom Tool"
  isActive={false}
  onInteraction={({ itemId }) => console.debug(\`Clicked \${itemId}\`)}
/>
      `}
    >
      <div className="bg-popover flex h-11 w-[450px] items-center justify-center rounded">
        <TooltipProvider>
          <ToolButton
            id="Zoom"
            icon="ToolZoom"
            isActive={true}
            label="Zoom"
            tooltip="Zoom"
            onInteraction={({ itemId }) => console.debug(`Clicked ${itemId}`)}
          />
          <ToolButton
            id="Zoom"
            icon="ToolMove"
            label="Pan"
            tooltip="Pan"
            onInteraction={({ itemId }) => console.debug(`Clicked ${itemId}`)}
          />
          <ToolButton
            id="Zoom"
            icon="ToolWindowLevel"
            label="Window Level"
            tooltip="Window Level"
            onInteraction={({ itemId }) => console.debug(`Clicked ${itemId}`)}
          />
        </TooltipProvider>
      </div>
    </ShowcaseRow>
  );
}
