import React from 'react';
import { Switch } from '../../../../ui-next/src/components/Switch';
import { Label } from '../../../../ui-next/src/components/Label';
import ShowcaseRow from './ShowcaseRow';

/**
 * SwitchShowcase component displays Switch variants and examples
 */
export default function SwitchShowcase() {
  return (
    <ShowcaseRow
      title="Switch"
      description="A toggle Switch is used to change between two different states. Use descriptive labels next to Switches that are understandable before interacting."
      code={`
<Switch />
      `}
    >
      <Switch defaultChecked />
      <Label className="text-foreground mx-2 w-14 flex-none whitespace-nowrap text-sm">
        Sync changes in all viewports
      </Label>
    </ShowcaseRow>
  );
}
