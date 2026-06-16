import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function ComboboxPageContent() {
  const { Combobox } = require('../../../../ui-next/src/components/Combobox/Combobox');
  const { Label } = require('../../../../ui-next/src/components/Label');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const modalities = [
    'AR', 'AU', 'BI', 'CR', 'CT', 'DG', 'DOC', 'DX', 'ECG', 'ES',
    'GM', 'IO', 'KO', 'MG', 'MR', 'NM', 'OCT', 'OP', 'OT', 'PR',
    'PT', 'REG', 'RF', 'RG', 'RTDOSE', 'RTIMAGE', 'RTPLAN', 'RTSTRUCT',
    'SEG', 'SM', 'SR', 'US', 'XA', 'XC',
  ].map(m => ({ value: m, label: m }));

  const tools = [
    { value: 'length', label: 'Length' },
    { value: 'bidirectional', label: 'Bidirectional' },
    { value: 'elliptical-roi', label: 'Elliptical ROI' },
    { value: 'rectangle-roi', label: 'Rectangle ROI' },
    { value: 'angle', label: 'Angle' },
    { value: 'cobb-angle', label: 'Cobb Angle' },
  ];

  const props = [
    { name: 'data', type: '{ value: string; label: string }[]', default: '[]', description: 'Array of selectable options' },
    { name: 'placeholder', type: 'string', default: '"Select item..."', description: 'Placeholder text shown when no value is selected' },
  ];

  return (
    <ComponentLayout
      title="Combobox"
      description="Searchable dropdown for filtering and selecting"
    >
      <PageHeader
        title="Combobox"
        description="A searchable dropdown built with Command and Popover primitives."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            Combobox combines a text search input with a dropdown list, allowing users to
            filter through large option sets. It's built on top of{' '}
            <strong className="text-foreground">Command</strong> (cmdk) and{' '}
            <strong className="text-foreground">Popover</strong> components.
          </p>
          <p>
            Use Combobox instead of Select when the option list is long (10+ items) or
            when users benefit from type-to-filter. In the OHIF Viewer, it's used for
            modality selection and other searchable lists.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Modality list">
          <Combobox data={modalities} placeholder="Modality" />
        </ExampleBlock>

        <ExampleBlock title="Tool selection">
          <Combobox data={tools} placeholder="Measurement tool" />
        </ExampleBlock>

        <ExampleBlock title="With label" last>
          <div className="flex items-center gap-4">
            <Label>Filter by</Label>
            <Combobox data={modalities} placeholder="Modality" />
          </div>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import { Combobox } from '@ohif/ui-next';

const items = [
  { value: 'ct', label: 'CT' },
  { value: 'mr', label: 'MR' },
  { value: 'us', label: 'US' },
];

<Combobox data={items} placeholder="Modality" />`}
        />
      </Section>

      <Section title="Props">
        <PropsTable props={props} />
      </Section>
    </ComponentLayout>
  );
}

export default function ComboboxPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <ComboboxPageContent />}</BrowserOnly>
  );
}
