import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

const foundations = [
  {
    label: 'Colors & Theming',
    href: '/colors-and-theming',
    description: 'Color tokens, theme presets, and accessibility guidance.',
  },
  {
    label: 'Iconography',
    href: '/components/icons',
    description: '137 curated icons, searchable, with click-to-copy names.',
  },
];

const componentGroups = [
  {
    category: 'Simple',
    items: [
      { label: 'Button', href: '/components/button' },
      { label: 'Checkbox', href: '/components/checkbox' },
      { label: 'Input', href: '/components/input' },
      { label: 'Label', href: '/components/label' },
      { label: 'Slider', href: '/components/slider' },
      { label: 'Switch', href: '/components/switch-toggle' },
    ],
  },
  {
    category: 'Compound',
    items: [
      { label: 'Combobox', href: '/components/combobox' },
      { label: 'Dialog', href: '/components/dialog' },
      { label: 'DropdownMenu', href: '/components/dropdown-menu' },
      { label: 'HoverCard', href: '/components/hover-card' },
      { label: 'Popover', href: '/components/popover' },
      { label: 'ScrollArea', href: '/components/scroll-area' },
      { label: 'Select', href: '/components/select' },
      { label: 'Table', href: '/components/table' },
      { label: 'Tabs', href: '/components/tabs' },
      { label: 'Toast / Sonner', href: '/components/toast' },
      { label: 'Tooltip', href: '/components/tooltip' },
    ],
  },
  {
    category: 'OHIF-specific',
    items: [
      { label: 'AllInOneMenu', href: '/components/all-in-one-menu' },
      { label: 'CinePlayer', href: '/components/cine-player' },
      { label: 'DataRow', href: '/components/data-row' },
      { label: 'DataTable', href: '/components/data-table' },
      { label: 'Numeric', href: '/components/numeric' },
      { label: 'PanelSection', href: '/components/panel-section' },
      { label: 'SmartScrollbar', href: '/components/smart-scrollbar' },
      { label: 'ToolButton', href: '/components/tool-button' },
      { label: 'ToolButtonList', href: '/components/tool-button-list' },
    ],
  },
];

function OverviewContent() {
  const ComponentLayout = require('./_layout/ComponentLayout').default;
  const PageHeader = require('./_layout/PageHeader').default;
  const Section = require('./_layout/Section').default;
  const Link = require('@docusaurus/Link').default;

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

      <div className="mt-12">
        <Section title="Foundations">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {foundations.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className="group border-input/50 bg-muted/40 hover:border-primary/50 hover:bg-muted block rounded-lg border p-5 no-underline transition-colors"
              >
                <div className="text-foreground group-hover:text-highlight mb-1 text-lg font-semibold">
                  {item.label}
                </div>
                <p className="text-muted-foreground mb-0 text-base">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Components">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-3">
            {componentGroups.map(group => (
              <div key={group.category}>
                <h3 className="border-input/50 text-foreground mb-3 border-b pb-2 text-lg font-semibold tracking-wide">
                  {group.category}
                </h3>
                <ul className="space-y-1">
                  {group.items.map(item => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        className="text-muted-foreground hover:text-highlight inline-block py-0.5 text-lg no-underline transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </ComponentLayout>
  );
}

export default function OverviewPage() {
  return (
    <BrowserOnly fallback={<></>}>{() => <OverviewContent />}</BrowserOnly>
  );
}
