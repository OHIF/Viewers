import React from 'react';
import { Checkbox } from '../../../../ui-next/src/components/Checkbox';
import { Label } from '../../../../ui-next/src/components/Label';
import ShowcaseRow from './ShowcaseRow';

/**
 * CheckboxShowcase component displays checkbox variants and examples
 */
export default function CheckboxShowcase() {
  return (
    <ShowcaseRow
      title="Checkbox"
      description="When possible use Switch in place of checkbox. If necessary, Checkbox provides a smaller component to change between two states or options."
      code={`
<div className="items-top flex space-x-2">
  <Checkbox id="terms1" />
  <div className="grid gap-1.5 pt-0.5 leading-none">
    <Label>Display inactive segmentations</Label>
  </div>
</div>
      `}
    >
      <div className="items-top flex space-x-2">
        <Checkbox id="terms1" />
        <div className="grid gap-1.5 pt-0.5 leading-none">
          <Label>Display inactive segmentations</Label>
        </div>
      </div>
    </ShowcaseRow>
  );
}
