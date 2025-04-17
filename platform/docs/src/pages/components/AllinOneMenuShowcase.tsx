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
export default function AllinOneMenuShowcase() {
  /* Helpers to build common static items so the JSX stays concise */
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
      <Item
        key={p.desc}
        label={p.desc}
        secondaryLabel={p.wl}
      />
    ));

  return (
    <ShowcaseRow
      title="All In One Menu"
      description="A structured, consolidated menu designed to reduce visual clutter, helping users keep their focus on the image. It supports various UI components—including Switches, Numeric Inputs, Tabs, and Sliders—for detailed settings, as well as text-based lists for actionable items."
      code={`<IconMenu icon="viewport-window-level" menuStyle={{ width: 212, maxHeight: 500 }}>
  <ItemPanel label="Display">
    <Item label="Display Color bar" rightIcon={<Switch disabled />} />
    <DividerItem />
    <SubMenu itemLabel="Color LUT" itemIcon="icon-color-lut">
      <ItemPanel label="Color LUTs">
        <Item label="Preview in viewport" rightIcon={<Switch disabled />} />
        <DividerItem />
        <Item label="Grayscale" />
        <Item label="X Ray" />
        <Item label="HSV" />
        <Item label="Hot Iron" />
        <Item label="Red Hot" />
        <Item label="S PET" />
        <Item label="Perfusion" />
        <Item label="Rainbow" />
        <Item label="SUV" />
        <Item label="GE 256" />
        <Item label="GE" />
        <Item label="Siemens" />
      </ItemPanel>
    </SubMenu>
    <SubMenu itemLabel="Window Presets" itemIcon="viewport-window-level">
      <ItemPanel label="CT Presets">
        <Item label="Soft tissue" secondaryLabel="400 / 40" />
        <Item label="Lung" secondaryLabel="1500 / ‑600" />
        <Item label="Liver" secondaryLabel="150 / 90" />
        <Item label="Bone" secondaryLabel="2500 / 480" />
        <Item label="Brain" secondaryLabel="80 / 40" />
      </ItemPanel>
    </SubMenu>
  </ItemPanel>
</IconMenu>`}
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
            <SubMenu itemLabel="Window Presets" itemIcon="viewport-window-level">
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