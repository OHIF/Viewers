// docs/src/pages/components/PanelSectionShowcase.tsx
import React from 'react';
import { PanelSection } from '../../../../ui-next/src/components/PanelSection/PanelSection';
import { Button } from '../../../../ui-next/src/components/Button';
import ShowcaseRow from './ShowcaseRow';

/**
 * PanelSectionShowcase displays an expandable/collapsible panel section.
 */
export default function PanelSectionShowcase() {
  return (
    <ShowcaseRow
      title="Panel Section"
      description="Collapsible panels for grouping controls or metadata inside side‑panels."
      code={`
<PanelSection defaultOpen>
  <PanelSection.Header>Series Information</PanelSection.Header>
  <PanelSection.Content>
    <div className="p-2 space-y-1 text-sm text-muted-foreground">
      <div>Images: 120</div>
      <div>Modality: MR</div>
      <div>Body Part: Brain</div>
      <Button variant="link" size="xs">Load another series</Button>
    </div>
  </PanelSection.Content>
</PanelSection>
      `}
    >
      <PanelSection
        defaultOpen
        className="bg-muted w-[280px]"
      >
        <PanelSection.Header className="bg-popover">Series Information</PanelSection.Header>
        <PanelSection.Content>
          <div className="text-muted-foreground space-y-1 p-2 text-sm">
            <div className="pl-2">
              <div>Images: 120</div>
              <div>Modality: MR</div>
              <div>Body Part: Brain</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
            >
              Load more information
            </Button>
          </div>
        </PanelSection.Content>
      </PanelSection>
    </ShowcaseRow>
  );
}
