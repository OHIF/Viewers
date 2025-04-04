import React from 'react';
import { Input } from '../../../../ui-next/src/components/Input';
import { Label } from '../../../../ui-next/src/components/Label';
import ShowcaseRow from './ShowcaseRow';

/**
 * InputShowcase component displays Input variants and examples
 */
export default function InputShowcase() {
  return (
    <ShowcaseRow
      title="Input"
      description="Input fields can be used with or without example text"
      code={`
<div className="inline-block">
  <div className="mr-4 inline-block">
    <Label>Patient Weight</Label>
  </div>
  <div className="inline-block">
    <Input placeholder="(kg)" />
  </div>
</div>
      `}
    >
      <div className="inline-block">
        <div className="mr-4 inline-block">
          <Label>Patient Weight</Label>
        </div>
        <div className="inline-block">
          <Input placeholder="(kg)" />
        </div>
      </div>
    </ShowcaseRow>
  );
}
