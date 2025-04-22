import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../../../ui-next/src/components/Tooltip';
import { Button } from '../../../../ui-next/src/components/Button';
import ShowcaseRow from './ShowcaseRow';

/**
 * TooltipShowcase component displays Tooltip variants and examples
 */
export default function TooltipShowcase() {
  return (
    <ShowcaseRow
      title="Tooltip"
      description="Tooltips reveal helper text when users hover, focus, or tap an element."
      code={`
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon">?</Button>
  </TooltipTrigger>
  <TooltipContent>
    Tooltip content
  </TooltipContent>
</Tooltip>
      `}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">?</Button>
        </TooltipTrigger>
        <TooltipContent>
          Tooltip content
        </TooltipContent>
      </Tooltip>
    </ShowcaseRow>
  );
}