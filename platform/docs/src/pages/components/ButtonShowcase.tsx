import React from 'react';
import { Button } from '../../../../ui-next/src/components/Button';
import ShowcaseRow from './ShowcaseRow';

/**
 * ButtonShowcase component displays button variants and examples
 */
export default function ButtonShowcase() {
  return (
    <ShowcaseRow
      title="Buttons"
      description="Button components and size variants. Use the primary and secondary buttons in dialogs or screens where one action is required. In the Viewer application, use ghost button in panels where many different actions are available."
      code={`
<Button variant="default">Primary Button</Button>

<Button variant="secondary">Secondary Button</Button>

<Button variant="ghost">Ghost Button</Button>

<Button variant="ghost" size="icon">?</Button>

<Button variant="link">Link</Button>
      `}
    >
      <div className="flex flex-wrap gap-4">
        <Button variant="default">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="ghost">Ghost Button</Button>
        <Button
          variant="ghost"
          size="icon"
        >
          ?
        </Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="mt-6 flex flex-wrap gap-4">
        <Button
          variant="default"
          size="lg"
          className="w-[107px]"
        >
          Large Button
        </Button>
        <Button
          variant="default"
          size="sm"
        >
          Small Button
        </Button>
      </div>
    </ShowcaseRow>
  );
}
