import React from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../../../../ui-next/src/components/Popover/Popover';
import { Button } from '../../../../ui-next/src/components/Button';
import ShowcaseRow from './ShowcaseRow';

/**
 * PopoverShowcase presents a simple Popover that appears after clicking a button.
 */
export default function PopoverShowcase() {
  return (
    <ShowcaseRow
      title="Popover"
      description="Transient panel that appears over content—great for small forms, extra details, or actions."
      code={`
<Popover>
  <PopoverTrigger asChild>
    <Button variant="default">Open Popover</Button>
  </PopoverTrigger>
  <PopoverContent className="w-60">
    <p className="text-sm">
      Hello! I’m a Popover. Click outside or press Esc to close me.
    </p>
  </PopoverContent>
</Popover>
      `}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="default">Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent className="w-60">
          <p className="text-sm">
            Hello! I’m a Popover. Click outside or press&nbsp;Esc to close me.
          </p>
        </PopoverContent>
      </Popover>
    </ShowcaseRow>
  );
}