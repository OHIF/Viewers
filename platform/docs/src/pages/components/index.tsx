import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function OverviewContent() {
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;

  return (
    <ComponentLayout
      title="ui-next Components"
      description="Component documentation for the OHIF Viewer design system"
    >
      <PageHeader
        title="ui-next Components"
        description="Component documentation for the OHIF Viewer design system"
      />

      <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
        <p>
          This section documents the components available in the{' '}
          <strong className="text-foreground">@ohif/ui-next</strong> package.
          Use the sidebar to browse individual components, or explore the
          foundations section for theming and color tokens.
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
