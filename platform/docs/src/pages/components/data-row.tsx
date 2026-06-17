import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function DataRowPageContent() {
  const { DataRow } = require('../../../../ui-next/src/components/DataRow');
  const { TooltipProvider } = require('../../../../ui-next/src/components/Tooltip');
  const { dataList } = require('../../../../ui-next/assets/data');

  const roiToolsGroup = dataList.find(g => g.type === 'ROI Tools');
  const measurementItems = roiToolsGroup ? roiToolsGroup.items.slice(0, 5) : [];
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const InteractivePicker = require('./_layout/InteractivePicker').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const [selectedId, setSelectedId] = useState('seg-1');
  const [visibility, setVisibility] = useState({ 'seg-1': true, 'seg-2': true, 'seg-3': true });
  const [locked, setLocked] = useState({ 'seg-1': false, 'seg-2': true, 'seg-3': false });

  const noop = (e) => e?.stopPropagation?.();

  const states = [
    { value: 'default', label: 'Default', description: 'Idle state. Muted background, foreground text.' },
    { value: 'selected', label: 'Selected', description: 'Primary selection. Popover background, highlight title and number box.' },
    { value: 'secondary', label: 'Secondary', description: 'Secondary selection. Primary tint overlay, used for inactive segmentation.' },
    { value: 'hidden', label: 'Hidden', description: 'Visibility off. Entire row at 60% opacity.' },
  ];

  const props = [
    { name: 'number', type: 'number | null', default: '—', description: 'Display index. Renders a colored number box when provided.' },
    { name: 'title', type: 'string', default: '—', description: 'Primary text label. Long titles (>25 chars) get a tooltip.' },
    { name: 'colorHex', type: 'string', default: '—', description: 'Hex color for the dot indicator (e.g. segmentation color)' },
    { name: 'isSelected', type: 'boolean', default: 'false', description: 'Primary selection state (highlighted background + title)' },
    { name: 'isSecondarySelected', type: 'boolean', default: 'false', description: 'Secondary selection (primary tint, for inactive segmentation)' },
    { name: 'onSelect', type: '(e) => void', default: '—', description: 'Called when the row is clicked' },
    { name: 'isVisible', type: 'boolean', default: 'true', description: 'Visibility state. Row renders at 60% opacity when false.' },
    { name: 'onToggleVisibility', type: '(e) => void', default: '—', description: 'Called when the eye icon is clicked' },
    { name: 'isLocked', type: 'boolean', default: 'false', description: 'Shows a lock icon when true' },
    { name: 'onToggleLocked', type: '(e) => void', default: '—', description: 'Called when lock is toggled via the action menu' },
    { name: 'disableEditing', type: 'boolean', default: 'false', description: 'Hides the action menu (rename, delete, color, lock)' },
    { name: 'onRename', type: '(e) => void', default: '—', description: 'Called from the action menu' },
    { name: 'onDelete', type: '(e) => void', default: '—', description: 'Called from the action menu' },
    { name: 'onColor', type: '(e) => void', default: '—', description: 'Called from the action menu' },
    { name: 'onCopy', type: '(e) => void', default: '—', description: 'Optional. Adds a "Duplicate" item to the action menu.' },
    { name: 'details', type: '{ primary: string[], secondary: string[] }', default: '—', description: 'Expandable detail lines below the row (max 4 visible)' },
    { name: 'children', type: 'ReactNode', default: '—', description: 'Status indicators via DataRow.Status.Warning/Success/Error/Info' },
  ];

  return (
    <TooltipProvider>
      <ComponentLayout
        title="DataRow"
        description="Interactive list row for panels"
      >
        <PageHeader
          title="DataRow"
          description="A selectable, numbered row with visibility toggle, color indicator, and contextual action menu."
        />

        <div className="mb-10">
          <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
            <p>
              DataRow is the primary list item component in OHIF side panels. It displays a
              numbered entry with a title, optional{' '}
              <strong className="text-foreground">color dot</strong>,{' '}
              <strong className="text-foreground">visibility toggle</strong>,{' '}
              <strong className="text-foreground">lock indicator</strong>, and a{' '}
              <strong className="text-foreground">three-dot action menu</strong> with
              rename, delete, color change, duplicate, and lock/unlock options.
            </p>
            <p>
              In the OHIF Viewer, DataRow is used for{' '}
              <strong className="text-foreground">segmentation lists</strong>,{' '}
              <strong className="text-foreground">measurement lists</strong>, and any panel
              where items need selection, visibility control, and contextual actions. It supports
              primary selection (active segmentation) and secondary selection (inactive segmentation)
              states.
            </p>
          </div>
        </div>

        <Section title="States">
          <InteractivePicker
            options={states}
            defaultValue="default"
            renderPreview={(active) => (
              <div className="w-[280px] space-y-px">
                <DataRow
                  number={1}
                  title="Liver"
                  description=""
                  colorHex="#E2B93B"
                  isSelected={active === 'selected'}
                  isSecondarySelected={active === 'secondary'}
                  isVisible={active !== 'hidden'}
                  isLocked={false}
                  disableEditing={false}
                  onToggleVisibility={noop}
                  onToggleLocked={noop}
                  onRename={noop}
                  onDelete={noop}
                  onColor={noop}
                  onSelect={noop}
                />
                <DataRow
                  number={2}
                  title="Spleen"
                  description=""
                  colorHex="#68B9FF"
                  isSelected={false}
                  isVisible={true}
                  isLocked={false}
                  disableEditing={false}
                  onToggleVisibility={noop}
                  onToggleLocked={noop}
                  onRename={noop}
                  onDelete={noop}
                  onColor={noop}
                  onSelect={noop}
                />
                <DataRow
                  number={3}
                  title="Kidney L"
                  description=""
                  colorHex="#FF5733"
                  isSelected={false}
                  isVisible={true}
                  isLocked={false}
                  disableEditing={false}
                  onToggleVisibility={noop}
                  onToggleLocked={noop}
                  onRename={noop}
                  onDelete={noop}
                  onColor={noop}
                  onSelect={noop}
                />
              </div>
            )}
          />
        </Section>

        <Section title="Examples">
          <ExampleBlock title="Segmentation list with interactive selection">
            <div className="w-[280px] space-y-px">
              {[
                { id: 'seg-1', num: 1, title: 'Liver', color: '#E2B93B' },
                { id: 'seg-2', num: 2, title: 'Spleen', color: '#68B9FF' },
                { id: 'seg-3', num: 3, title: 'Kidney Left', color: '#FF5733' },
              ].map((seg) => (
                <DataRow
                  key={seg.id}
                  number={seg.num}
                  title={seg.title}
                  description=""
                  colorHex={seg.color}
                  isSelected={selectedId === seg.id}
                  isVisible={visibility[seg.id]}
                  isLocked={locked[seg.id]}
                  disableEditing={false}
                  onSelect={() => setSelectedId(seg.id === selectedId ? null : seg.id)}
                  onToggleVisibility={(e) => {
                    e.stopPropagation();
                    setVisibility(v => ({ ...v, [seg.id]: !v[seg.id] }));
                  }}
                  onToggleLocked={(e) => {
                    e.stopPropagation();
                    setLocked(l => ({ ...l, [seg.id]: !l[seg.id] }));
                  }}
                  onRename={noop}
                  onDelete={noop}
                  onColor={noop}
                />
              ))}
            </div>
          </ExampleBlock>

          <ExampleBlock title="Measurement list with details">
            <div className="w-[280px] space-y-px">
              {measurementItems.map((item, index) => (
                <DataRow
                  key={item.id}
                  number={index + 1}
                  title={item.title}
                  description={item.description}
                  details={item.details}
                  isSelected={index === 0}
                  isVisible={true}
                  isLocked={false}
                  disableEditing={false}
                  onSelect={noop}
                  onToggleVisibility={noop}
                  onToggleLocked={noop}
                  onRename={noop}
                  onDelete={noop}
                  onColor={noop}
                />
              ))}
            </div>
          </ExampleBlock>

          <ExampleBlock title="Read-only (editing disabled)" last>
            <div className="w-[280px] space-y-px">
              <DataRow
                number={1}
                title="CT Axial 2.0mm"
                description=""
                isSelected={true}
                isVisible={true}
                isLocked={false}
                disableEditing={true}
                onToggleVisibility={noop}
                onToggleLocked={noop}
                onRename={noop}
                onDelete={noop}
                onColor={noop}
              />
              <DataRow
                number={2}
                title="PET Coronal"
                description=""
                isSelected={false}
                isVisible={true}
                isLocked={false}
                disableEditing={true}
                onToggleVisibility={noop}
                onToggleLocked={noop}
                onRename={noop}
                onDelete={noop}
                onColor={noop}
              />
              <DataRow
                number={3}
                title="Segmentation Overlay"
                description=""
                isSelected={false}
                isVisible={false}
                isLocked={false}
                disableEditing={true}
                onToggleVisibility={noop}
                onToggleLocked={noop}
                onRename={noop}
                onDelete={noop}
                onColor={noop}
              />
            </div>
          </ExampleBlock>
        </Section>

        <Section title="Usage">
          <CodeBlock
            code={`import { DataRow } from '@ohif/ui-next';

<DataRow
  number={1}
  title="Liver"
  colorHex="#E2B93B"
  isSelected={selectedId === 'liver'}
  isVisible={true}
  isLocked={false}
  disableEditing={false}
  onSelect={() => setSelectedId('liver')}
  onToggleVisibility={handleToggleVisibility}
  onToggleLocked={handleToggleLocked}
  onRename={handleRename}
  onDelete={handleDelete}
  onColor={handleColor}
>
  <DataRow.Status.Success tooltip="Tracked" />
</DataRow>`}
          />
        </Section>

        <Section title="Props">
          <PropsTable props={props} />
        </Section>
      </ComponentLayout>
    </TooltipProvider>
  );
}

export default function DataRowPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <DataRowPageContent />}</BrowserOnly>
  );
}
