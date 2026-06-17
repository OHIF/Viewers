import React from 'react';

import { useViewportGrid } from '@ohif/ui-next';

type PlaceholderDefinition = {
  viewportId: string;
  label: string;
  description: string;
  dataCy: string;
  showWhenEmptyOnly?: boolean;
};

const PLACEHOLDERS: PlaceholderDefinition[] = [
  {
    viewportId: 'dental-prior',
    label: 'No Prior Exam',
    description: 'No same-modality prior is available in the loaded studies.',
    dataCy: 'dental-no-prior-placeholder',
    showWhenEmptyOnly: true,
  },
  {
    viewportId: 'dental-bitewing-left',
    label: 'Bitewing Placeholder',
    description: 'Static MVP placeholder. Bitewing image matching is not enabled.',
    dataCy: 'dental-bitewing-placeholder-left',
  },
  {
    viewportId: 'dental-bitewing-right',
    label: 'Bitewing Placeholder',
    description: 'Static MVP placeholder. Bitewing image matching is not enabled.',
    dataCy: 'dental-bitewing-placeholder-right',
  },
];

function DentalViewportPlaceholder({
  placeholder,
}: {
  placeholder: PlaceholderDefinition;
}) {
  const [viewportGrid] = useViewportGrid();
  const viewport = viewportGrid.viewports.get(placeholder.viewportId);

  if (!viewport) {
    return null;
  }

  const hasDisplaySet = Boolean(viewport.displaySetInstanceUIDs?.length);

  if (placeholder.showWhenEmptyOnly && hasDisplaySet) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute flex items-center justify-center p-3"
      style={{
        top: `${viewport.y * 100}%`,
        left: `${viewport.x * 100}%`,
        width: `${viewport.width * 100}%`,
        height: `${viewport.height * 100}%`,
      }}
      data-cy={placeholder.dataCy}
    >
      <div className="border-primary/40 bg-background/90 flex h-full w-full flex-col items-center justify-center rounded border border-dashed px-5 text-center">
        <div className="text-primary text-sm font-semibold">{placeholder.label}</div>
        <div className="text-muted-foreground mt-1 max-w-[260px] text-xs">
          {placeholder.description}
        </div>
      </div>
    </div>
  );
}

function DentalViewportPlaceholders() {
  return (
    <>
      {PLACEHOLDERS.map(placeholder => (
        <DentalViewportPlaceholder
          key={placeholder.viewportId}
          placeholder={placeholder}
        />
      ))}
    </>
  );
}

export default DentalViewportPlaceholders;
