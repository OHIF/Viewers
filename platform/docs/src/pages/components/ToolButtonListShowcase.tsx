import React from 'react';
import {
  ToolButtonList,
  ToolButton,
  ToolButtonListDefault,
  ToolButtonListDropDown,
  ToolButtonListItem,
  ToolButtonListDivider,
} from '../../../../ui-next/src/components/ToolButton';
import { TooltipProvider } from '../../../../ui-next/src/components/Tooltip';

import ShowcaseRow from './ShowcaseRow';

/**
 * ToolButtonListShowcase component displays ToolButtonList variants and examples
 */
export default function ToolButtonListShowcase() {
  return (
    <ShowcaseRow
      title="ToolButtonList"
      description="A compound component that combines a primary tool button with a dropdown menu of additional related tools"
      code={`
// Example usage:
<ToolButtonList>
  <ToolButtonListDefault>
    <ToolButton
      id="Length"
      icon="tool-length"
      label="Length"
      tooltip="Length Tool"
      onInteraction={({ itemId }) => console.debug(\`Clicked \${itemId}\`)}
    />
  </ToolButtonListDefault>
  <ToolButtonListDivider />
  <ToolButtonListDropDown>
    <ToolButtonListItem
      icon="tool-length"
      onSelect={() => console.debug('Selected Length')}
    >
      <span className="pl-1">Length</span>
    </ToolButtonListItem>
    <ToolButtonListItem
      icon="tool-bidirectional"
      onSelect={() => console.debug('Selected Bidirectional')}
    >
      <span className="pl-1">Bidirectional</span>
    </ToolButtonListItem>
  </ToolButtonListDropDown>
</ToolButtonList>
      `}
    >
      <div className="bg-popover flex h-11 w-[450px] items-center justify-start rounded p-2">
        <TooltipProvider>
          <ToolButtonList>
            <ToolButtonListDefault>
              <ToolButton
                id="Length"
                icon="ToolLength"
                label="Length"
                tooltip="Length Tool"
                onInteraction={({ itemId }) => console.debug(`Clicked ${itemId}`)}
              />
            </ToolButtonListDefault>
            <ToolButtonListDivider />
            <ToolButtonListDropDown>
              <ToolButtonListItem
                icon="ToolLength"
                onSelect={() => console.debug('Selected Length')}
              >
                <span className="pl-1">Length</span>
              </ToolButtonListItem>
              <ToolButtonListItem
                icon="ToolBidirectional"
                onSelect={() => console.debug('Selected Bidirectional')}
              >
                <span className="pl-1">Bidirectional</span>
              </ToolButtonListItem>
              <ToolButtonListItem
                icon="ToolAnnotate"
                onSelect={() => console.debug('Selected Annotation')}
              >
                <span className="pl-1">Annotation</span>
              </ToolButtonListItem>
            </ToolButtonListDropDown>
          </ToolButtonList>
        </TooltipProvider>
      </div>
    </ShowcaseRow>
  );
}
