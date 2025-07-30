import React from 'react';
import { Label } from '../../../../ui-next/src/components/Label/Label';
import { Switch } from '../../../../ui-next/src/components/Switch';
import ShowcaseRow from './ShowcaseRow';

/**
 * LabelShowcase pairs a Label with a Switch inline.
 */
export default function LabelShowcase() {
  return (
    <ShowcaseRow
      title="Label"
      description="Labels clarify the purpose of controls and improve accessibility."
      code={`
<Switch defaultChecked id="preview-switch" />
<Label htmlFor="preview-switch" className="ml-2">
  Preview edits before creating
</Label>
      `}
    >
      <div className="flex items-center gap-2">
        <Switch defaultChecked id="preview-switch" />
        <Label htmlFor="preview-switch">Preview edits before creating</Label>
      </div>
    </ShowcaseRow>
  );
}