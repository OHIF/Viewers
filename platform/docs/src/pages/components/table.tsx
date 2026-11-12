import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function TablePageContent() {
  const {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
    TableCaption,
  } = require('../../../../ui-next/src/components/Table');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const studies = [
    { id: 'ST-001', patient: 'Smith, John', modality: 'CT', date: '2024-03-15', series: 4, status: 'Complete' },
    { id: 'ST-002', patient: 'Doe, Jane', modality: 'MR', date: '2024-03-14', series: 6, status: 'Complete' },
    { id: 'ST-003', patient: 'Lee, Alex', modality: 'CT', date: '2024-03-14', series: 3, status: 'In Progress' },
    { id: 'ST-004', patient: 'Garcia, Maria', modality: 'PET/CT', date: '2024-03-13', series: 8, status: 'Complete' },
    { id: 'ST-005', patient: 'Brown, Robert', modality: 'MR', date: '2024-03-12', series: 5, status: 'Failed' },
  ];

  const measurements = [
    { label: 'Lesion 1', tool: 'Bidirectional', value: '24.3 × 18.1 mm', location: 'Liver' },
    { label: 'Lesion 2', tool: 'Length', value: '15.7 mm', location: 'Lung RUL' },
    { label: 'Lesion 3', tool: 'EllipticalROI', value: '42.1 mm²', location: 'Kidney L' },
  ];

  const tableProps = [
    { name: 'containerClassName', type: 'string', default: '—', description: 'CSS classes applied to the outer scroll container' },
    { name: 'noScroll', type: 'boolean', default: 'false', description: 'Disables the overflow-auto wrapper around the table' },
    { name: 'className', type: 'string', default: '—', description: 'CSS classes applied to the <table> element' },
  ];

  const tableRowProps = [
    { name: 'data-state', type: '"selected"', default: '—', description: 'Set to "selected" to apply the selected row styling (elevated background + foreground text)' },
    { name: 'className', type: 'string', default: '—', description: 'CSS classes applied to the <tr> element' },
  ];

  return (
    <ComponentLayout
      title="Table"
      description="Styled HTML table primitives"
    >
      <PageHeader
        title="Table"
        description="Composable table primitives for tabular data."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            A set of styled wrappers around native HTML table elements.
            Each sub-component (<strong className="text-foreground">Table</strong>,{' '}
            <strong className="text-foreground">TableHeader</strong>,{' '}
            <strong className="text-foreground">TableBody</strong>,{' '}
            <strong className="text-foreground">TableRow</strong>,{' '}
            <strong className="text-foreground">TableHead</strong>,{' '}
            <strong className="text-foreground">TableCell</strong>,{' '}
            <strong className="text-foreground">TableFooter</strong>,{' '}
            <strong className="text-foreground">TableCaption</strong>) forwards refs and accepts all native attributes plus optional styling overrides.
          </p>
          <p>
            Rows respond to <strong className="text-foreground">hover</strong> with highlighted text
            and to <strong className="text-foreground">data-state=&quot;selected&quot;</strong> with
            an elevated background — no additional props needed.
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Basic table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Study</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Modality</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Series</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studies.map(study => (
                <TableRow key={study.id}>
                  <TableCell className="font-medium">{study.id}</TableCell>
                  <TableCell>{study.patient}</TableCell>
                  <TableCell>{study.modality}</TableCell>
                  <TableCell>{study.date}</TableCell>
                  <TableCell className="text-right">{study.series}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ExampleBlock>

        <ExampleBlock title="With footer and caption">
          <Table>
            <TableCaption>Tracked measurements for current study</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measurements.map(m => (
                <TableRow key={m.label}>
                  <TableCell className="font-medium">{m.label}</TableCell>
                  <TableCell>{m.tool}</TableCell>
                  <TableCell>{m.value}</TableCell>
                  <TableCell>{m.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total measurements</TableCell>
                <TableCell className="text-right">{measurements.length}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </ExampleBlock>

        <ExampleBlock title="No scroll wrapper" last>
          <Table noScroll>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measurements.map(m => (
                <TableRow key={m.label}>
                  <TableCell className="font-medium">{m.label}</TableCell>
                  <TableCell>{m.tool}</TableCell>
                  <TableCell>{m.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ExampleBlock>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import {
  Table, TableHeader, TableBody, TableFooter,
  TableHead, TableRow, TableCell, TableCaption,
} from '@ohif/ui-next';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Patient</TableHead>
      <TableHead>Modality</TableHead>
      <TableHead>Date</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {studies.map(study => (
      <TableRow key={study.id}>
        <TableCell>{study.patient}</TableCell>
        <TableCell>{study.modality}</TableCell>
        <TableCell>{study.date}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// Row selection via data attribute
<TableRow data-state={isSelected ? 'selected' : undefined}>
  …
</TableRow>`}
        />
      </Section>

      <Section title="Table Props">
        <PropsTable props={tableProps} />
      </Section>

      <Section title="TableRow Props">
        <PropsTable props={tableRowProps} />
      </Section>

      <div className="mb-10">
        <p className="text-sm text-muted-foreground">
          All sub-components (<strong className="text-foreground">TableHeader</strong>,{' '}
          <strong className="text-foreground">TableBody</strong>,{' '}
          <strong className="text-foreground">TableFooter</strong>,{' '}
          <strong className="text-foreground">TableHead</strong>,{' '}
          <strong className="text-foreground">TableCell</strong>,{' '}
          <strong className="text-foreground">TableCaption</strong>) accept{' '}
          <strong className="text-foreground">className</strong> and forward all native HTML attributes and refs.
        </p>
      </div>
    </ComponentLayout>
  );
}

export default function TablePage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <TablePageContent />}</BrowserOnly>
  );
}
