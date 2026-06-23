import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function OverviewContent() {
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;

  return (
    <ComponentLayout
      title="Components / ui-next"
      description="Documentation for the OHIF Viewer design system"
    >
      <PageHeader
        title={
          <>
            Components <span className="opacity-50">/</span> ui-next
          </>
        }
        description="Documentation for the OHIF Viewer design system"
      />

      <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
        <p>
          Welcome to the component documentation for the OHIF Viewer.{' '}
          <strong className="text-foreground">@ohif/ui-next</strong> is the
          design system that shapes the viewer's interface, from the smallest
          toggle to the panels and toolbars that frame a study. It builds on the
          shadcn/ui and Radix foundation many developers already know, styled
          with Tailwind and shaped for the realities of medical imaging: dense
          layouts, dark viewports, and long clinical sessions where clarity
          matters.
        </p>
        <p>
          Whether you're building the viewer, extending it with a new mode, or
          crafting a theme, these docs are here to help you move quickly and
          stay consistent. Every component is live and interactive, so you're
          looking at the real thing, not a picture of it. Pick a component from
          the sidebar to see its variants and props, or open the{' '}
          <strong className="text-foreground">Foundations</strong> section to
          explore the dark-first theming and color roles that tie the whole
          system together.
        </p>
      </div>
    </ComponentLayout>
  );
}

export default function OverviewPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <OverviewContent />}</BrowserOnly>
  );
}
