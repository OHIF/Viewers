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
      { label: 'Colors & Theming', href: '/colors-and-theming' },
      { label: 'Iconography', href: '/components/icons' },
    ],
  },
  {
    title: 'Components',
    items: [
      { label: 'AllInOneMenu', href: '/components/all-in-one-menu' },
      { label: 'Button', href: '/components/button' },
      { label: 'Checkbox', href: '/components/checkbox' },
      { label: 'CinePlayer', href: '/components/cine-player' },
      { label: 'Combobox', href: '/components/combobox' },
      { label: 'DataRow', href: '/components/data-row' },
      { label: 'DataTable', href: '/components/data-table' },
      { label: 'Dialog', href: '/components/dialog' },
      { label: 'DropdownMenu', href: '/components/dropdown-menu' },
      { label: 'HoverCard', href: '/components/hover-card' },
      { label: 'Input', href: '/components/input' },
      { label: 'Label', href: '/components/label' },
      { label: 'Numeric', href: '/components/numeric' },
      { label: 'PanelSection', href: '/components/panel-section' },
      { label: 'Popover', href: '/components/popover' },
      { label: 'ScrollArea', href: '/components/scroll-area' },
      { label: 'Select', href: '/components/select' },
      { label: 'Slider', href: '/components/slider' },
      { label: 'SmartScrollbar', href: '/components/smart-scrollbar' },
      { label: 'Switch', href: '/components/switch-toggle' },
      { label: 'Table', href: '/components/table' },
      { label: 'Tabs', href: '/components/tabs' },
      { label: 'Toast', href: '/components/toast' },
      { label: 'ToolButton', href: '/components/tool-button' },
      { label: 'ToolButtonList', href: '/components/tool-button-list' },
      { label: 'Tooltip', href: '/components/tooltip' },
    ],
  },
];
