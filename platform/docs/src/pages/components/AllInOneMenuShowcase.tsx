import React from 'react';
import AllInOneMenu, {
  IconMenu,
  HorizontalDirection,
  VerticalDirection,
} from '../../../../ui-next/src/components/AllInOneMenu';
import { Icons } from '../../../../ui-next/src/components/Icons';
import ShowcaseRow from './ShowcaseRow';

/**
 * All‑in‑One Menu showcase – demonstrates IconMenu + nested SubMenu + ItemPanels
 */
export default function AllInOneMenuShowcase() {
  return (
    <ShowcaseRow
      title="All‑in‑One Menu"
      description="Context menu that supports nested sub‑menus or tabbed panels, opened from any icon."
      code={`
<IconMenu
  icon="more"                       // Icon to click
  iconClassName="text-xl cursor-pointer"
  horizontalDirection={HorizontalDirection.LeftToRight}
  verticalDirection={VerticalDirection.TopToBottom}
>
  {/* FIRST PANEL (index 0) */}
  <AllInOneMenu.ItemPanel index={0} label="Display">
    <AllInOneMenu.Item
      label="Fill & Outline"
      onClick={() => console.debug('Fill & Outline')}
    />
    <AllInOneMenu.Item label="Outline Only" />
    <AllInOneMenu.Item label="Fill Only" />
    <AllInOneMenu.DividerItem />
    <AllInOneMenu.SubMenu itemLabel="Opacity…" />
  </AllInOneMenu.ItemPanel>

  {/* SECOND PANEL reached through SubMenu above */}
  <AllInOneMenu.SubMenu
    itemLabel="Opacity…"
    itemIcon="display-brightness"
    activePanelIndex={1}             // open this panel when submenu selected
  >
    <AllInOneMenu.ItemPanel index={1} label="Opacity">
      <AllInOneMenu.Item label="25 %" />
      <AllInOneMenu.Item label="50 %" />
      <AllInOneMenu.Item label="75 %" />
      <AllInOneMenu.Item label="100 %" />
    </AllInOneMenu.ItemPanel>
  </AllInOneMenu.SubMenu>
</IconMenu>`}
    >
      {/* --- Live demo --- */}
      <div className="bg-popover relative flex h-12 items-center rounded px-4">
        <IconMenu
          icon="more"
          iconClassName="text-xl text-foreground hover:text-primary"
          horizontalDirection={HorizontalDirection.LeftToRight}
          verticalDirection={VerticalDirection.TopToBottom}
        >
          {/* Panel 0 */}
          <AllInOneMenu.ItemPanel
            index={0}
            label="Display"
          >
            <AllInOneMenu.Item label="Fill & Outline" />
            <AllInOneMenu.Item label="Outline Only" />
            <AllInOneMenu.Item label="Fill Only" />
            <AllInOneMenu.DividerItem />
            <AllInOneMenu.SubMenu
              itemLabel="Opacity…"
              itemIcon="display-brightness"
            >
              {/* Panel 1 */}
              <AllInOneMenu.ItemPanel
                index={1}
                label="Opacity"
              >
                <AllInOneMenu.Item label="25 %" />
                <AllInOneMenu.Item label="50 %" />
                <AllInOneMenu.Item label="75 %" />
                <AllInOneMenu.Item label="100 %" />
              </AllInOneMenu.ItemPanel>
            </AllInOneMenu.SubMenu>
          </AllInOneMenu.ItemPanel>
        </IconMenu>
      </div>
    </ShowcaseRow>
  );
}
