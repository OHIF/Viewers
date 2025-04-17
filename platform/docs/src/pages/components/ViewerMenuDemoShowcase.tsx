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
import { Switch } from '../../../../ui-next/src/components/Switch';
import ShowcaseRow from './ShowcaseRow';

/**
 * Pure‑UI mock of the in‑app Window/Level menu.
 * Clickable, but all actions are inert.
 */
export default function ViewerMenuDemoShowcase() {
  /**
   * Helpers to build common static items so the JSX stays concise
   */
  const renderColorLUTItems = () =>
    [
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
    ].map(name => (
      <Item
        key={name}
        label={name}
      />
    ));

  const renderWindowPresetItems = () =>
    [
      { desc: 'Soft tissue', wl: '400 / 40' },
      { desc: 'Lung', wl: '1500 / -600' },
      { desc: 'Liver', wl: '150 / 90' },
      { desc: 'Bone', wl: '2500 / 480' },
      { desc: 'Brain', wl: '80 / 40' },
    ].map(p => (
      <Item
        key={p.desc}
        label={p.desc}
        secondaryLabel={p.wl}
      />
    ));

  return (
    <ShowcaseRow
      title="Viewer Menu (Mock)"
      description="Static recreation of the App’s Window‑Level menu. You can open sub‑menus and tabs, but nothing executes."
      code={`<IconMenu icon="viewport-window-level">\n  <ItemPanel>…mock items…</ItemPanel>\n</IconMenu>`}
    >
      <div className="border-input/70 relative flex h-12 items-center rounded border bg-black px-4">
        {/* —— trigger icon —— */}
        <IconMenu
          icon="viewport-window-level"
          iconClassName="text-xl text-highlight hover:bg-primary/30 cursor-pointer rounded"
          horizontalDirection={HorizontalDirection.LeftToRight}
          verticalDirection={VerticalDirection.TopToBottom}
          /* keep width consistent with production menu */
          menuStyle={{ width: 212, maxHeight: 500 }}
        >
          {/* —— TOP‑LEVEL PANEL —— */}
          <ItemPanel label="Display">
            {/* Display Color bar toggle */}
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

            {/* Color LUT sub‑menu */}
            <SubMenu
              itemLabel="Color LUT"
              itemIcon="icon-color-lut"
            >
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
                {renderColorLUTItems()}
              </ItemPanel>
            </SubMenu>

            {/* Window presets sub‑menu */}
            <SubMenu
              itemLabel="Window Presets"
              itemIcon="viewport-window-level"
            >
              <ItemPanel label="CT Presets">{renderWindowPresetItems()}</ItemPanel>
            </SubMenu>
          </ItemPanel>
        </IconMenu>

        <span className="text-muted-foreground ml-3 text-sm">
          Click the icon to explore an example
        </span>
      </div>
    </ShowcaseRow>
  );
}
