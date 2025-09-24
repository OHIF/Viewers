import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../../../ui-next/src/components/DropdownMenu';
import { Button } from '../../../../ui-next/src/components/Button';
import ShowcaseRow from './ShowcaseRow';

/**
 * DropdownMenuShowcase component displays DropdownMenu variants and examples
 */
export default function DropdownMenuShowcase() {
  return (
    <ShowcaseRow
      title="Dropdown Menu"
      description="Dropdown menu provides a flexible list of options that can open from buttons or other elements"
      code={`
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Open Basic</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
    <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
      `}
    >
      <div className="flex flex-wrap gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button>Open Basic</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open Align Start</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open Align End</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem>Long name Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>Open Align Top</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
          >
            <DropdownMenuItem onSelect={() => console.debug('Item 1')}>Item 1</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => console.debug('Item 2')}>Item 2</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => console.debug('Item 3')}>
              Long name Item 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </ShowcaseRow>
  );
}