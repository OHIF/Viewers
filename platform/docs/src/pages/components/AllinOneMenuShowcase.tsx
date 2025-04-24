import React from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';
import ShowcaseRow from './ShowcaseRow';

/**
 * Pure‑UI mock of the in‑app Window/Level menu.
 * Clickable, but all actions are inert.
 */
export default function AllinOneMenuShowcase() {
  const isBrowser = useIsBrowser();

  if (!isBrowser) {
    return null;
  }

  const {
    default: AllInOneMenu,
    IconMenu,
    SubMenu,
    ItemPanel,
    Item,
    DividerItem,
    HorizontalDirection,
    VerticalDirection,
  } = require('../../../../ui-next/src/components/AllInOneMenu');
  const { Switch } = require('../../../../ui-next/src/components/Switch');

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
    ].map(name => <Item key={name} label={name} />);

  const renderWindowPresetItems = () =>
    [
      { desc: 'Soft tissue', wl: '400 / 40' },
      { desc: 'Lung', wl: '1500 / -600' },
      { desc: 'Liver', wl: '150 / 90' },
      { desc: 'Bone', wl: '2500 / 480' },
      { desc: 'Brain', wl: '80 / 40' },
    ].map(p => (
      <Item key={p.desc} label={p.desc} secondaryLabel={p.wl} />
    ));

  return (
    <ShowcaseRow
      title="All In One Menu"
      description="A structured menu that consolidates controls and actions."
      code={`<IconMenu icon="viewport-window-level" menuStyle={{ width: 212, maxHeight: 500 }}>…</IconMenu>`}
    >
      <div className="border-input/70 relative flex h-12 items-center rounded border bg-black px-4">
        <IconMenu
          icon="viewport-window-level"
          iconClassName="text-xl text-highlight hover:bg-primary/30 cursor-pointer rounded"
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
                {renderColorLUTItems()}
              </ItemPanel>
            </SubMenu>
            <SubMenu
              itemLabel="Window Presets"
              itemIcon="viewport-window-level"
            >
              <ItemPanel label="CT Presets">
                {renderWindowPresetItems()}
              </ItemPanel>
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