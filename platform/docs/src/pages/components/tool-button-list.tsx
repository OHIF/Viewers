import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function ToolButtonListPageContent() {
  const {
    ToolButton,
    ToolButtonList,
    ToolButtonListDefault,
    ToolButtonListDropDown,
    ToolButtonListItem,
    ToolButtonListDivider,
  } = require('../../../../ui-next/src/components/ToolButton');
  const { TooltipProvider } = require('../../../../ui-next/src/components/Tooltip');
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const props = [
    { name: 'ToolButtonList', type: 'component', default: '—', description: 'Root flex container for the button + dropdown group' },
    { name: 'ToolButtonListDefault', type: 'component', default: '—', description: 'Wrapper for the primary ToolButton, with optional tooltip' },
    { name: 'ToolButtonListDropDown', type: 'component', default: '—', description: 'Chevron trigger that opens a dropdown of related tools' },
    { name: 'ToolButtonListItem', type: 'component', default: '—', description: 'Menu item inside the dropdown, with optional icon' },
    { name: 'ToolButtonListDivider', type: 'component', default: '—', description: 'Vertical divider between the primary button and dropdown chevron' },
  ];

  return (
    <TooltipProvider>
      <ComponentLayout
        title="ToolButtonList"
        description="Grouped tool button with dropdown"
      >
        <PageHeader
          title="ToolButtonList"
          description="A compound component that pairs a primary tool button with a dropdown of related tools."
        />

        <div className="mb-10">
          <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
            <p>
              ToolButtonList groups a primary{' '}
              <strong className="text-foreground">ToolButton</strong> with a dropdown chevron
              that reveals related tool options. It's composed of five sub-components:{' '}
              <strong className="text-foreground">ToolButtonList</strong> (root),{' '}
              <strong className="text-foreground">ToolButtonListDefault</strong> (primary slot),{' '}
              <strong className="text-foreground">ToolButtonListDivider</strong>,{' '}
              <strong className="text-foreground">ToolButtonListDropDown</strong> (chevron + menu),{' '}
              and <strong className="text-foreground">ToolButtonListItem</strong> (menu items).
            </p>
            <p>
              In the OHIF toolbar, this pattern is used for measurement tool groups (Length,
              Bidirectional, Angle), annotation tools, and other sets where one tool is the
              default and others are accessible via the dropdown.
            </p>
          </div>
        </div>

        <Section title="Examples">
          <ExampleBlock title="Measurement tools">
            <div className="bg-popover flex h-11 items-center rounded p-2">
              <ToolButtonList>
                <ToolButtonListDefault>
                  <ToolButton
                    id="Length"
                    icon="ToolLength"
                    label="Length"
                    tooltip="Length Tool"
                    onInteraction={({ itemId }) => console.debug(`Clicked ${itemId}`)}
                  />
                </ToolButtonListDefault>
                <ToolButtonListDivider />
                <ToolButtonListDropDown>
                  <ToolButtonListItem
                    icon="ToolLength"
                    onSelect={() => console.debug('Selected Length')}
                  >
                    <span className="pl-1">Length</span>
                  </ToolButtonListItem>
                  <ToolButtonListItem
                    icon="ToolBidirectional"
                    onSelect={() => console.debug('Selected Bidirectional')}
                  >
                    <span className="pl-1">Bidirectional</span>
                  </ToolButtonListItem>
                  <ToolButtonListItem
                    icon="ToolAnnotate"
                    onSelect={() => console.debug('Selected Annotation')}
                  >
                    <span className="pl-1">Annotation</span>
                  </ToolButtonListItem>
                </ToolButtonListDropDown>
              </ToolButtonList>
            </div>
          </ExampleBlock>

          <ExampleBlock title="Active primary tool">
            <div className="bg-popover flex h-11 items-center rounded p-2">
              <ToolButtonList>
                <ToolButtonListDefault>
                  <ToolButton
                    id="Length"
                    icon="ToolLength"
                    label="Length"
                    tooltip="Length Tool"
                    isActive
                    onInteraction={() => {}}
                  />
                </ToolButtonListDefault>
                <ToolButtonListDivider />
                <ToolButtonListDropDown>
                  <ToolButtonListItem
                    icon="ToolLength"
                    onSelect={() => {}}
                  >
                    <span className="pl-1">Length</span>
                  </ToolButtonListItem>
                  <ToolButtonListItem
                    icon="ToolBidirectional"
                    onSelect={() => {}}
                  >
                    <span className="pl-1">Bidirectional</span>
                  </ToolButtonListItem>
                </ToolButtonListDropDown>
              </ToolButtonList>
            </div>
          </ExampleBlock>

          <ExampleBlock title="Multiple groups in a toolbar" last>
            <div className="bg-popover flex h-11 items-center gap-1 rounded p-2">
              <ToolButtonList>
                <ToolButtonListDefault>
                  <ToolButton
                    id="Length"
                    icon="ToolLength"
                    label="Length"
                    tooltip="Length"
                    isActive
                    onInteraction={() => {}}
                  />
                </ToolButtonListDefault>
                <ToolButtonListDivider />
                <ToolButtonListDropDown>
                  <ToolButtonListItem icon="ToolLength" onSelect={() => {}}>
                    <span className="pl-1">Length</span>
                  </ToolButtonListItem>
                  <ToolButtonListItem icon="ToolBidirectional" onSelect={() => {}}>
                    <span className="pl-1">Bidirectional</span>
                  </ToolButtonListItem>
                </ToolButtonListDropDown>
              </ToolButtonList>

              <ToolButton
                id="Zoom"
                icon="ToolZoom"
                label="Zoom"
                tooltip="Zoom"
                onInteraction={() => {}}
              />
              <ToolButton
                id="Pan"
                icon="ToolMove"
                label="Pan"
                tooltip="Pan"
                onInteraction={() => {}}
              />
            </div>
          </ExampleBlock>
        </Section>

        <Section title="Usage">
          <CodeBlock
            code={`import {
  ToolButton, ToolButtonList, ToolButtonListDefault,
  ToolButtonListDropDown, ToolButtonListItem, ToolButtonListDivider,
} from '@ohif/ui-next';

<ToolButtonList>
  <ToolButtonListDefault>
    <ToolButton
      id="Length"
      icon="ToolLength"
      label="Length"
      tooltip="Length Tool"
      onInteraction={({ itemId }) => handleTool(itemId)}
    />
  </ToolButtonListDefault>
  <ToolButtonListDivider />
  <ToolButtonListDropDown>
    <ToolButtonListItem icon="ToolLength" onSelect={() => selectTool('Length')}>
      <span className="pl-1">Length</span>
    </ToolButtonListItem>
    <ToolButtonListItem icon="ToolBidirectional" onSelect={() => selectTool('Bidirectional')}>
      <span className="pl-1">Bidirectional</span>
    </ToolButtonListItem>
  </ToolButtonListDropDown>
</ToolButtonList>`}
          />
        </Section>

        <Section title="Sub-components">
          <PropsTable props={props} />
        </Section>
      </ComponentLayout>
    </TooltipProvider>
  );
}

export default function ToolButtonListPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <ToolButtonListPageContent />}</BrowserOnly>
  );
}
