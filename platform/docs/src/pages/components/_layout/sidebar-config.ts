export interface SidebarItem {
  label: string;
  href: string;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export const sidebarSections: SidebarSection[] = [
  {
    title: 'Foundations',
    items: [
      { label: 'Overview', href: '/components' },
      { label: 'Colors & Theming', href: '/theming' },
    ],
  },
  {
    title: 'Components',
    items: [
      { label: 'AllInOneMenu', href: '/components/all-in-one-menu' },
      { label: 'Badge', href: '/components/badge' },
      { label: 'Button', href: '/components/button' },
      { label: 'Card', href: '/components/card' },
      { label: 'Checkbox', href: '/components/checkbox' },
      { label: 'CinePlayer', href: '/components/cine-player' },
      { label: 'Combobox', href: '/components/combobox' },
      { label: 'DataRow', href: '/components/data-row' },
      { label: 'Dialog', href: '/components/dialog' },
      { label: 'DropdownMenu', href: '/components/dropdown-menu' },
      { label: 'HoverCard', href: '/components/hover-card' },
      { label: 'Input', href: '/components/input' },
      { label: 'Label', href: '/components/label' },
      { label: 'NumericMeta', href: '/components/numeric-meta' },
      { label: 'PanelSection', href: '/components/panel-section' },
      { label: 'Popover', href: '/components/popover' },
      { label: 'ScrollArea', href: '/components/scroll-area' },
      { label: 'Select', href: '/components/select' },
      { label: 'Separator', href: '/components/separator' },
      { label: 'Slider', href: '/components/slider' },
      { label: 'Switch', href: '/components/switch' },
      { label: 'Tabs', href: '/components/tabs' },
      { label: 'Toast', href: '/components/toast' },
      { label: 'Toggle', href: '/components/toggle' },
      { label: 'ToolButton', href: '/components/tool-button' },
      { label: 'ToolButtonList', href: '/components/tool-button-list' },
      { label: 'Tooltip', href: '/components/tooltip' },
    ],
  },
  {
    title: 'Patterns',
    items: [
      { label: 'Segmentation List', href: '/patterns' },
      { label: 'Measurement List', href: '/patterns' },
    ],
  },
];
