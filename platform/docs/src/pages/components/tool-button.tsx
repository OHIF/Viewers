import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function ToolButtonPageContent() {
  const { ToolButton } = require('../../../../ui-next/src/components/ToolButton');
  const { TooltipProvider } = require('../../../../ui-next/src/components/Tooltip');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const InteractivePicker = require('./_layout/InteractivePicker').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const [activeId, setActiveId] = useState('Zoom');

  const states = [
    { value: 'default', label: 'Default', description: 'Idle state. Transparent background, foreground icon.' },
    { value: 'active', label: 'Active', description: 'Currently selected tool. Highlighted background with inverted icon.' },
    { value: 'toggled', label: 'Toggled', description: 'Toggled on. Transparent background with highlight-colored icon.' },
    { value: 'disabled', label: 'Disabled', description: 'Unavailable. Reduced opacity, cursor not-allowed.' },
  ];

  const props = [
    { name: 'id', type: 'string', default: '—', description: 'Unique identifier, passed to onInteraction' },
    { name: 'icon', type: 'string', default: '—', description: 'Icon name from the OHIF icon registry' },
    { name: 'label', type: 'string', default: '—', description: 'Accessible label text' },
    { name: 'tooltip', type: 'string', default: '—', description: 'Tooltip text shown on hover' },
    { name: 'size', type: '"default" | "small"', default: '"default"', description: 'Button size (default: 40×40, small: 32×32)' },
    { name: 'isActive', type: 'boolean', default: 'false', description: 'Active tool state (highlighted background)' },
    { name: 'isToggled', type: 'boolean', default: 'false', description: 'Toggled state (highlight-colored icon)' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Disables interaction' },
    { name: 'onInteraction', type: '({ itemId, commands }) => void', default: '—', description: 'Called when the button is clicked' },
  ];

  return (
    <TooltipProvider>
      <ComponentLayout
        title="ToolButton"
        description="Toolbar icon button with active states"
      >
        <PageHeader
          title="ToolButton"
          description="An icon button for the OHIF toolbar with active, toggled, and disabled states."
        />

        <div className="mb-10">
          <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
            <p>
              ToolButton is the primary interactive element in the OHIF toolbar. Each button
              represents a tool (Zoom, Pan, Window/Level, measurement tools, etc.) and
              visually reflects whether it's the{' '}
              <strong className="text-foreground">active</strong> tool,{' '}
              <strong className="text-foreground">toggled</strong> on, or{' '}
              <strong className="text-foreground">disabled</strong>.
            </p>
            <p>
              It renders an icon from the OHIF icon registry via{' '}
              <strong className="text-foreground">Icons.ByName</strong> and wraps disabled
              buttons in a span so tooltips still work. Use{' '}
              <strong className="text-foreground">ToolButtonList</strong> to group a primary
              tool with a dropdown of related tools.
            </p>
          </div>
        </div>

        <Section title="States">
          <InteractivePicker
            options={states}
            defaultValue="default"
            renderPreview={(active) => (
              <div className="bg-popover flex h-11 items-center justify-center rounded px-4">
                <ToolButton
                  id="demo"
                  icon="ToolZoom"
                  label="Zoom"
                  tooltip="Zoom"
                  isActive={active === 'active'}
                  isToggled={active === 'toggled'}
                  disabled={active === 'disabled'}
                  disabledText={active === 'disabled' ? 'Tool unavailable' : undefined}
                  onInteraction={() => {}}
                />
              </div>
            )}
          />
        </Section>

        <Section title="Examples">
          <ExampleBlock title="Toolbar row">
            <div className="bg-popover flex h-11 items-center justify-center rounded px-2">
              {[
                { id: 'Zoom', icon: 'ToolZoom', label: 'Zoom' },
                { id: 'Pan', icon: 'ToolMove', label: 'Pan' },
                { id: 'WL', icon: 'ToolWindowLevel', label: 'Window Level' },
              ].map((tool) => (
                <ToolButton
                  key={tool.id}
                  id={tool.id}
                  icon={tool.icon}
                  label={tool.label}
                  tooltip={tool.label}
                  isActive={activeId === tool.id}
                  onInteraction={({ itemId }) => setActiveId(itemId)}
                />
              ))}
            </div>
          </ExampleBlock>

          <ExampleBlock title="Size comparison" last>
            <div className="bg-popover flex h-11 items-center gap-3 rounded px-4">
              <ToolButton
                id="default-size"
                icon="ToolZoom"
                label="Default"
                tooltip="Default size"
                onInteraction={() => {}}
              />
              <ToolButton
                id="small-size"
                icon="ToolZoom"
                label="Small"
                tooltip="Small size"
                size="small"
                onInteraction={() => {}}
              />
            </div>
          </ExampleBlock>
        </Section>

        <Section title="Usage">
          <CodeBlock
            code={`import { ToolButton } from '@ohif/ui-next';

<ToolButton
  id="Zoom"
  icon="ToolZoom"
  label="Zoom"
  tooltip="Zoom Tool"
  isActive={activeTool === 'Zoom'}
  onInteraction={({ itemId }) => setActiveTool(itemId)}
/>`}
          />
        </Section>

        <Section title="Props">
          <PropsTable props={props} />
        </Section>
      </ComponentLayout>
    </TooltipProvider>
  );
}

export default function ToolButtonPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <ToolButtonPageContent />}</BrowserOnly>
  );
}
