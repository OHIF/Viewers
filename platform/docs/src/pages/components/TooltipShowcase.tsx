import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import ShowcaseRow from './ShowcaseRow';
import { Button } from '../../../../ui-next/src/components/Button';

/**
 * TooltipShowcase component displays Tooltip variants and examples
 */
export default function TooltipShowcase() {
  return (
    <BrowserOnly fallback={<></>}>
      {() => {
        const {
          Tooltip,
          TooltipTrigger,
          TooltipContent,
          TooltipProvider,
        } = require('../../../../ui-next/src/components/Tooltip');

        return (
          <TooltipProvider>
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
                  <Button variant="ghost" size="icon">
                    ?
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tooltip content</TooltipContent>
              </Tooltip>
            </ShowcaseRow>
          </TooltipProvider>
        );
      }}
    </BrowserOnly>
  );
}