import React, { useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

function AllInOneMenuPageContent() {
  // Load from the barrel to avoid circular dependency TDZ crash.
  // IconMenu, SubMenu, BackItem, and ItemPanel all import from '@ohif/ui-next'.
  const {
    AllInOneMenu,
    Switch,
  } = require('../../../../ui-next/src/components');

  const {
    IconMenu,
    SubMenu,
    ItemPanel,
    Item,
    DividerItem,
    Menu,
    HorizontalDirection,
    VerticalDirection,
  } = AllInOneMenu;

  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const CodeBlock = require('./_layout/CodeBlock').default;
  const ExampleBlock = require('./_layout/ExampleBlock').default;
  const PropsTable = require('./_layout/PropsTable').default;

  const colorLUTs = [
    'Grayscale',
    'X Ray',
    'HSV',
    'Hot Iron',
    'Red Hot',
    'S PET',
    'Perfusion',
    'Rainbow',
    'SUV',
    'GE 256',
    'GE',
    'Siemens',
  ];

  const windowPresets = [
    { desc: 'Soft tissue', wl: '400 / 40' },
    { desc: 'Lung', wl: '1500 / -600' },
    { desc: 'Liver', wl: '150 / 90' },
    { desc: 'Bone', wl: '2500 / 480' },
    { desc: 'Brain', wl: '80 / 40' },
  ];

  const menuProps = [
    { name: 'isVisible', type: 'boolean', default: 'false', description: 'Controls menu visibility' },
    { name: 'menuStyle', type: 'CSSProperties', default: '—', description: 'Inline styles on the menu container (e.g. width, maxHeight)' },
    { name: 'menuClassName', type: 'string', default: '—', description: 'Additional CSS classes on the menu container' },
    { name: 'backLabel', type: 'string', default: '"Back"', description: 'Label shown on the back button when inside a SubMenu' },
    { name: 'headerComponent', type: 'ReactNode', default: '—', description: 'Content rendered above the menu items (e.g. a search input)' },
    { name: 'showHeaderDivider', type: 'boolean', default: 'false', description: 'Show a divider below the header component' },
    { name: 'activePanelIndex', type: 'number', default: '0', description: 'Which ItemPanel tab is active (when multiple panels exist)' },
    { name: 'preventHideMenu', type: 'boolean', default: 'false', description: 'Prevent the menu from closing on item click' },
    { name: 'onVisibilityChange', type: '(visible: boolean) => void', default: '—', description: 'Called when visibility changes' },
    { name: 'children', type: 'ReactNode', default: '—', description: 'Menu content (ItemPanel, SubMenu, Item, etc.)' },
  ];

  const iconMenuProps = [
    { name: 'icon', type: 'string', default: '—', description: 'Icon name from the OHIF icon registry' },
    { name: 'iconClassName', type: 'string', default: '—', description: 'CSS classes on the icon wrapper' },
    { name: 'horizontalDirection', type: 'HorizontalDirection', default: 'LeftToRight', description: 'Which edge of the icon the menu aligns to' },
    { name: 'verticalDirection', type: 'VerticalDirection', default: 'BottomToTop', description: 'Whether the menu opens above or below the icon' },
    { name: 'menuStyle', type: 'CSSProperties', default: '—', description: 'Inline styles passed to the inner Menu' },
    { name: 'menuKey', type: 'string | number', default: '—', description: 'React key for the inner Menu (forces remount on change)' },
  ];

  const itemProps = [
    { name: 'label', type: 'string', default: '—', description: 'Primary text for the item' },
    { name: 'secondaryLabel', type: 'string', default: '—', description: 'Right-aligned secondary text (e.g. a keyboard shortcut or value)' },
    { name: 'icon', type: 'ReactNode', default: '—', description: 'Icon rendered in the left gutter' },
    { name: 'rightIcon', type: 'ReactNode', default: '—', description: 'Content rendered on the far right (e.g. a Switch toggle)' },
    { name: 'useIconSpace', type: 'boolean', default: 'false', description: 'Reserve left gutter space even when no icon is provided' },
    { name: 'onClick', type: '() => void', default: '—', description: 'Called on click. The menu auto-hides after.' },
  ];

  const subMenuProps = [
    { name: 'itemLabel', type: 'string', default: '—', description: 'Text shown in the parent menu for this submenu entry' },
    { name: 'itemIcon', type: 'string', default: '—', description: 'Icon name shown next to the submenu label' },
    { name: 'onClick', type: '() => void', default: '—', description: 'Called when the submenu entry is clicked (in addition to navigating)' },
    { name: 'children', type: 'ReactNode', default: '—', description: 'The submenu content (ItemPanel with Items)' },
  ];

  const itemPanelProps = [
    { name: 'label', type: 'string', default: '—', description: 'Tab label shown in the PanelSelector when multiple panels exist' },
    { name: 'index', type: 'number', default: '0', description: 'Panel index for tab ordering' },
    { name: 'maxHeight', type: 'string', default: '"250px"', description: 'Max height before scrolling (CSS value)' },
    { name: 'className', type: 'string', default: '—', description: 'Additional CSS classes' },
    { name: 'children', type: 'ReactNode', default: '—', description: 'Panel content (Items, SubMenus, DividerItems, etc.)' },
  ];

  return (
    <ComponentLayout
      title="AllInOneMenu"
      description="Hierarchical menu system"
    >
      <PageHeader
        title="AllInOneMenu"
        description="A structured, navigable menu that consolidates controls, actions, and submenus into a single component."
      />

      <div className="mb-10">
        <div className="text-secondary-foreground space-y-3 text-lg leading-relaxed">
          <p>
            AllInOneMenu is a <strong className="text-foreground">compound component system</strong> for
            building hierarchical menus with stack-based navigation. Clicking a SubMenu pushes a
            new level onto the menu stack; a Back button at the top pops back to the previous level.
            This lets users drill into nested options without losing context.
          </p>
          <p>
            In the OHIF Viewer, AllInOneMenu powers the{' '}
            <strong className="text-foreground">viewport action corner menus</strong> — Window/Level
            presets, color LUT selection, orientation controls, and display options. It is one of the
            most heavily used UI patterns in the application.
          </p>
          <p>
            The system consists of several composable parts:{' '}
            <strong className="text-foreground">Menu</strong> (root container),{' '}
            <strong className="text-foreground">IconMenu</strong> (icon trigger + menu),{' '}
            <strong className="text-foreground">ItemPanel</strong> (scrollable panel with optional tabs),{' '}
            <strong className="text-foreground">SubMenu</strong> (drills deeper),{' '}
            <strong className="text-foreground">Item</strong> (leaf action),{' '}
            <strong className="text-foreground">DividerItem</strong> (separator), and{' '}
            <strong className="text-foreground">HeaderItem</strong> (section label).
          </p>
        </div>
      </div>

      <Section title="Examples">
        <ExampleBlock title="Window / Level menu (viewport action corner)">
          <div className="relative z-10 flex items-center gap-3">
            <div className="relative flex h-12 items-center px-4">
              <IconMenu
                icon="viewport-window-level"
                iconClassName="text-xl text-primary hover:bg-primary/30 cursor-pointer rounded"
                horizontalDirection={HorizontalDirection.LeftToRight}
                verticalDirection={VerticalDirection.TopToBottom}
                menuStyle={{ width: 212, maxHeight: 500 }}
              >
                <ItemPanel label="Display">
                  <Item
                    label="Display Color bar"
                    rightIcon={
                      <Switch
                        checked={false}
                        disabled
                        className="pointer-events-none"
                      />
                    }
                    useIconSpace={false}
                  />
                  <DividerItem />
                  <SubMenu itemLabel="Color LUT" itemIcon="icon-color-lut">
                    <ItemPanel
                      label="Color LUTs"
                      maxHeight="calc(100vh - 250px)"
                      className="flex flex-col"
                    >
                      <Item
                        label="Preview in viewport"
                        rightIcon={
                          <Switch
                            checked={false}
                            disabled
                            className="pointer-events-none"
                          />
                        }
                      />
                      <DividerItem />
                      {colorLUTs.map(name => (
                        <Item key={name} label={name} />
                      ))}
                    </ItemPanel>
                  </SubMenu>
                  <SubMenu itemLabel="Window Presets" itemIcon="viewport-window-level">
                    <ItemPanel label="CT Presets">
                      {windowPresets.map(p => (
                        <Item key={p.desc} label={p.desc} secondaryLabel={p.wl} />
                      ))}
                    </ItemPanel>
                  </SubMenu>
                </ItemPanel>
              </IconMenu>
              <span className="text-muted-foreground ml-3 text-sm">
                Click to explore the menu hierarchy
              </span>
            </div>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Simple flat menu">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 items-center px-4">
              <IconMenu
                icon="icon-settings"
                iconClassName="flex h-6 w-6 items-center justify-center text-primary hover:bg-primary/30 cursor-pointer rounded"
                horizontalDirection={HorizontalDirection.LeftToRight}
                verticalDirection={VerticalDirection.TopToBottom}
                menuStyle={{ width: 180 }}
              >
                <ItemPanel>
                  <Item label="Reset viewport" />
                  <Item label="Rotate left" />
                  <Item label="Rotate right" />
                  <DividerItem />
                  <Item label="Flip horizontal" />
                  <Item label="Flip vertical" />
                </ItemPanel>
              </IconMenu>
              <span className="text-muted-foreground ml-3 text-sm">
                Simple action list
              </span>
            </div>
          </div>
        </ExampleBlock>

        <ExampleBlock title="Controlled Menu (inline, always visible)" last>
          <div className="relative w-[220px]">
            <Menu
              isVisible={true}
              preventHideMenu={true}
              menuStyle={{ width: 212 }}
            >
              <ItemPanel>
                <Item label="Axial" secondaryLabel="A" />
                <Item label="Sagittal" secondaryLabel="S" />
                <Item label="Coronal" secondaryLabel="C" />
                <DividerItem />
                <Item label="3D" secondaryLabel="3" />
              </ItemPanel>
            </Menu>
          </div>
        </ExampleBlock>
      </Section>

      <Section title="Anatomy">
        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <p>
            A typical AllInOneMenu is structured as an <strong className="text-foreground">IconMenu</strong> wrapping
            one or more <strong className="text-foreground">ItemPanels</strong>, each containing{' '}
            <strong className="text-foreground">Items</strong> and{' '}
            <strong className="text-foreground">SubMenus</strong>.
          </p>
          <pre className="overflow-x-auto rounded-md border border-input/50 bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
{`IconMenu (icon trigger + positioned Menu)
├── ItemPanel (scrollable, labeled for tabs)
│   ├── Item (leaf action — label, icon, secondaryLabel)
│   ├── Item + rightIcon (e.g. Switch toggle)
│   ├── DividerItem (separator)
│   ├── SubMenu → pushes a new level
│   │   └── ItemPanel
│   │       ├── Item
│   │       └── Item
│   └── SubMenu → pushes a new level
│       └── ItemPanel
│           └── Item
└── (optional) second ItemPanel → creates tabbed panels`}
          </pre>
          <p>
            When a <strong className="text-foreground">SubMenu</strong> is clicked, its children replace the
            current view and a <strong className="text-foreground">Back</strong> button appears at the top.
            When multiple <strong className="text-foreground">ItemPanels</strong> exist at the same level,
            a tab bar appears to switch between them.
          </p>
        </div>
      </Section>

      <Section title="Usage">
        <CodeBlock
          code={`import AllInOneMenu from '@ohif/ui-next/AllInOneMenu';

const { IconMenu, SubMenu, ItemPanel, Item, DividerItem,
        HorizontalDirection, VerticalDirection } = AllInOneMenu;

// Icon-triggered menu with submenus
<IconMenu
  icon="viewport-window-level"
  iconClassName="text-xl text-highlight cursor-pointer"
  horizontalDirection={HorizontalDirection.LeftToRight}
  verticalDirection={VerticalDirection.TopToBottom}
  menuStyle={{ width: 212, maxHeight: 500 }}
>
  <ItemPanel label="Display">
    <Item label="Reset" onClick={handleReset} />
    <DividerItem />
    <SubMenu itemLabel="Window Presets" itemIcon="viewport-window-level">
      <ItemPanel label="CT Presets">
        <Item label="Soft tissue" secondaryLabel="400 / 40" onClick={...} />
        <Item label="Lung" secondaryLabel="1500 / -600" onClick={...} />
      </ItemPanel>
    </SubMenu>
  </ItemPanel>
</IconMenu>

// Simple flat menu
<IconMenu
  icon="icon-settings"
  verticalDirection={VerticalDirection.TopToBottom}
  menuStyle={{ width: 180 }}
>
  <ItemPanel>
    <Item label="Rotate left" onClick={handleRotateLeft} />
    <Item label="Rotate right" onClick={handleRotateRight} />
  </ItemPanel>
</IconMenu>`}
        />
      </Section>

      <Section title="Direction & Positioning">
        <div className="text-secondary-foreground space-y-4 text-lg leading-relaxed">
          <p>
            <strong className="text-foreground">HorizontalDirection</strong> controls which edge the menu aligns to:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li><code className="text-xs text-highlight">LeftToRight</code> — menu left edge aligns with icon left edge. Use when the icon is near the left side of its container.</li>
            <li><code className="text-xs text-highlight">RightToLeft</code> — menu right edge aligns with icon right edge. Use when the icon is near the right side.</li>
          </ul>
          <p>
            <strong className="text-foreground">VerticalDirection</strong> controls whether the menu opens above or below:
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li><code className="text-xs text-highlight">TopToBottom</code> — menu appears below the icon. Use when the icon is near the top.</li>
            <li><code className="text-xs text-highlight">BottomToTop</code> — menu appears above the icon. Use when the icon is near the bottom (default).</li>
          </ul>
          <p>
            In the OHIF Viewer, viewport action corners typically use BottomToTop + RightToLeft
            (top-right corner) or TopToBottom + LeftToRight (bottom-left corner) depending on
            where the trigger lives.
          </p>
        </div>
      </Section>

      <Section title="Props">
        <div className="space-y-8">
          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">Menu</h3>
            <p className="text-muted-foreground mb-3 text-sm">
              Root container. Manages visibility, menu path stack, and panel selection.
              Usually used indirectly via IconMenu.
            </p>
            <PropsTable props={menuProps} />
          </div>

          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">IconMenu</h3>
            <p className="text-muted-foreground mb-3 text-sm">
              Wraps Menu with a clickable icon trigger and outside-click dismissal.
              Inherits all Menu props in addition to the ones below.
            </p>
            <PropsTable props={iconMenuProps} />
          </div>

          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">Item</h3>
            <p className="text-muted-foreground mb-3 text-sm">
              A single actionable row. Clicking an Item auto-closes the menu.
            </p>
            <PropsTable props={itemProps} />
          </div>

          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">SubMenu</h3>
            <p className="text-muted-foreground mb-3 text-sm">
              Pushes a new level onto the menu stack when clicked. Shows a chevron indicator.
              Its children define the content of the new level.
            </p>
            <PropsTable props={subMenuProps} />
          </div>

          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">ItemPanel</h3>
            <p className="text-muted-foreground mb-3 text-sm">
              Scrollable container for Items. When multiple ItemPanels exist at the same menu level,
              a tab bar appears to switch between them.
            </p>
            <PropsTable props={itemPanelProps} />
          </div>

          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">DividerItem</h3>
            <p className="text-muted-foreground mb-3 text-sm">
              A thin horizontal line separating groups of items. No props.
            </p>
          </div>

          <div>
            <h3 className="text-highlight mb-3 text-base font-semibold">HeaderItem</h3>
            <p className="text-muted-foreground mb-3 text-sm">
              A compact section label rendered in muted text. Accepts <code className="text-xs">children: ReactNode</code>.
            </p>
          </div>
        </div>
      </Section>

    </ComponentLayout>
  );
}

export default function AllInOneMenuPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <AllInOneMenuPageContent />}</BrowserOnly>
  );
}
