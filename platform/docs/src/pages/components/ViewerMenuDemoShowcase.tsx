import React from 'react';
import AllInOneMenu, {
  IconMenu,
  SubMenu,
  ItemPanel,
  Item,
  DividerItem,
  HorizontalDirection,
  VerticalDirection,
} from '../../../../ui-next/src/components/AllInOneMenu';
import { Icons } from '../../../../ui-next/src/components/Icons';
import ShowcaseRow from './ShowcaseRow';

/**
 * Pure‑UI mock of the in‑app Window/Level menu.
 * *No* services or commands – every click is inert.
 */
export default function ViewerMenuDemoShowcase() {
  return (
    <ShowcaseRow
      title="Viewer Menu (Mock)"
      description="Static recreation of the App’s Window‑Level menu. You can open sub‑menus and tabs, but nothing executes."
      code={`<IconMenu icon="viewport-window-level">
  <ItemPanel> …your static items… </ItemPanel>
</IconMenu>`}
    >
      <div className="bg-popover relative flex h-12 items-center rounded px-4">
        {/* ——— 3‑dot icon that opens the menu ——— */}
        <IconMenu
          icon="viewport-window-level"
          iconClassName="text-xl text-highlight hover:bg-primary/30 cursor-pointer rounded"
          horizontalDirection={HorizontalDirection.LeftToRight}
          verticalDirection={VerticalDirection.TopToBottom}
        >
          {/* ——— FIRST PANEL ——— */}
          <ItemPanel
            index={0}
            label="Display"
          >
            {/* simple toggles */}
            <Item label="Preview in viewport">
              {/* you can add <Switch /> here if you’d like — it still won’t do anything */}
            </Item>
            <Item label="Display Color Bar" />
            <DividerItem />

            {/* Sub‑menu for Color LUT */}
            <SubMenu
              itemLabel="Color LUT"
              itemIcon="icon-color-lut"
            >
              <ItemPanel
                index={1}
                label="LUTs"
                maxHeight="200px"
              >
                {['Grayscale', 'Hot Iron', 'PET', 'Viridis'].map(name => (
                  <Item
                    key={name}
                    label={name}
                  />
                ))}
              </ItemPanel>
            </SubMenu>

            {/* Sub‑menu for Window/Level presets */}
            <SubMenu
              itemLabel="Window Presets"
              itemIcon="viewport-window-level"
            >
              <ItemPanel
                index={2}
                label="Presets"
              >
                {[
                  { desc: 'Soft tissue', wl: '400 / 40' },
                  { desc: 'Lung', wl: '1500 / ‑600' },
                  { desc: 'Bone', wl: '2500 / 480' },
                ].map(p => (
                  <Item
                    key={p.desc}
                    label={p.desc}
                    secondaryLabel={p.wl}
                  />
                ))}
              </ItemPanel>
            </SubMenu>
          </ItemPanel>

          {/* ——— SECOND PANEL: 3‑D options ——— */}
          <SubMenu
            itemLabel="Rendering Options"
            itemIcon="volume-3d"
          >
            <ItemPanel
              index={3}
              label="Rendering"
            >
              <Item
                label="Quality"
                secondaryLabel="High"
              />
              <Item
                label="Lighting"
                secondaryLabel="On"
              />
              <DividerItem />
              <Item label="Shade" />
            </ItemPanel>
          </SubMenu>
        </IconMenu>

        <span className="text-muted-foreground ml-3 text-sm">
          Click the icon to explore (callbacks disabled)
        </span>
      </div>
    </ShowcaseRow>
  );
}
