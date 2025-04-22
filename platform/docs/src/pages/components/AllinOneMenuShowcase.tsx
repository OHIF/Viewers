// import React from 'react';
// import * as AllInOneMenu from '../../../../../platform/ui-next/src/components/AllInOneMenu';
// import { Switch } from '../../../../../platform/ui-next/src/components/Switch';
// import ShowcaseRow from './ShowcaseRow';

/**
 * Pure‑UI mock of the in‑app Window/Level menu.
 * Clickable, but all actions are inert.
 */
export default function AllinOneMenuShowcase() {
  return null;
}

//   /* Helpers to build common static items so the JSX stays concise */
//   const renderColorLUTItems = () =>
//     [
//       'Grayscale',
//       'X Ray',
//       'HSV',
//       'Hot Iron',
//       'Red Hot',
//       'S PET',
//       'Perfusion',
//       'Rainbow',
//       'SUV',
//       'GE 256',
//       'GE',
//       'Siemens',
//     ].map(name => (
//       <AllInOneMenu.Item
//         key={name}
//         label={name}
//       />
//     ));

//   const renderWindowPresetItems = () =>
//     [
//       { desc: 'Soft tissue', wl: '400 / 40' },
//       { desc: 'Lung', wl: '1500 / -600' },
//       { desc: 'Liver', wl: '150 / 90' },
//       { desc: 'Bone', wl: '2500 / 480' },
//       { desc: 'Brain', wl: '80 / 40' },
//     ].map(p => (
//       <AllInOneMenu.Item
//         key={p.desc}
//         label={p.desc}
//         secondaryLabel={p.wl}
//       />
//     ));

//   return (
//     <ShowcaseRow
//       title="All In One Menu"
//       description="A structured, consolidated menu designed to reduce visual clutter, helping users keep their focus on the image. It supports various UI components—including Switches, Numeric Inputs, Tabs, and Sliders—for detailed settings, as well as text-based lists for actionable items."
//       code={`<AllInOneMenu.IconMenu icon="viewport-window-level" menuStyle={{ width: 212, maxHeight: 500 }}>
//   <AllInOneMenu.ItemPanel label="Display">
//     <AllInOneMenu.Item label="Display Color bar" rightIcon={<Switch disabled />} />
//     <AllInOneMenu.DividerItem />
//     <AllInOneMenu.SubMenu itemLabel="Color LUT" itemIcon="icon-color-lut">
//       <AllInOneMenu.ItemPanel label="Color LUTs">
//         <AllInOneMenu.Item label="Preview in viewport" rightIcon={<Switch disabled />} />
//         <AllInOneMenu.DividerItem />
//         <AllInOneMenu.Item label="Grayscale" />
//         <AllInOneMenu.Item label="X Ray" />
//         <AllInOneMenu.Item label="HSV" />
//         <AllInOneMenu.Item label="Hot Iron" />
//         <AllInOneMenu.Item label="Red Hot" />
//         <AllInOneMenu.Item label="S PET" />
//         <AllInOneMenu.Item label="Perfusion" />
//         <AllInOneMenu.Item label="Rainbow" />
//         <AllInOneMenu.Item label="SUV" />
//         <AllInOneMenu.Item label="GE 256" />
//         <AllInOneMenu.Item label="GE" />
//         <AllInOneMenu.Item label="Siemens" />
//       </AllInOneMenu.ItemPanel>
//     </AllInOneMenu.SubMenu>
//     <AllInOneMenu.SubMenu itemLabel="Window Presets" itemIcon="viewport-window-level">
//       <AllInOneMenu.ItemPanel label="CT Presets">
//         <AllInOneMenu.Item label="Soft tissue" secondaryLabel="400 / 40" />
//         <AllInOneMenu.Item label="Lung" secondaryLabel="1500 / ‑600" />
//         <AllInOneMenu.Item label="Liver" secondaryLabel="150 / 90" />
//         <AllInOneMenu.Item label="Bone" secondaryLabel="2500 / 480" />
//         <AllInOneMenu.Item label="Brain" secondaryLabel="80 / 40" />
//       </AllInOneMenu.ItemPanel>
//     </AllInOneMenu.SubMenu>
//   </AllInOneMenu.ItemPanel>
// </AllInOneMenu.IconMenu>`}
//     >
//       <div className="border-input/70 relative flex h-12 items-center rounded border bg-black px-4">
//         <AllInOneMenu.IconMenu
//           icon="viewport-window-level"
//           iconClassName="text-xl text-highlight hover:bg-primary/30 cursor-pointer rounded"
//           horizontalDirection={AllInOneMenu.HorizontalDirection.LeftToRight}
//           verticalDirection={AllInOneMenu.VerticalDirection.TopToBottom}
//           menuStyle={{ width: 212, maxHeight: 500 }}
//         >
//           <AllInOneMenu.ItemPanel label="Display">
//             <AllInOneMenu.Item
//               label="Display Color bar"
//               rightIcon={
//                 <Switch
//                   checked={false}
//                   disabled
//                   className="pointer-events-none"
//                 />
//               }
//               useIconSpace={false}
//             />
//             <AllInOneMenu.DividerItem />
//             <AllInOneMenu.SubMenu
//               itemLabel="Color LUT"
//               itemIcon="icon-color-lut"
//             >
//               <AllInOneMenu.ItemPanel
//                 label="Color LUTs"
//                 maxHeight="calc(100vh - 250px)"
//                 className="flex flex-col"
//               >
//                 <AllInOneMenu.Item
//                   label="Preview in viewport"
//                   rightIcon={
//                     <Switch
//                       checked={false}
//                       disabled
//                       className="pointer-events-none"
//                     />
//                   }
//                 />
//                 <AllInOneMenu.DividerItem />
//                 {renderColorLUTItems()}
//               </AllInOneMenu.ItemPanel>
//             </AllInOneMenu.SubMenu>
//             <AllInOneMenu.SubMenu
//               itemLabel="Window Presets"
//               itemIcon="viewport-window-level"
//             >
//               <AllInOneMenu.ItemPanel label="CT Presets">
//                 {renderWindowPresetItems()}
//               </AllInOneMenu.ItemPanel>
//             </AllInOneMenu.SubMenu>
//           </AllInOneMenu.ItemPanel>
//         </AllInOneMenu.IconMenu>

//         <span className="text-muted-foreground ml-3 text-sm">
//           Click the icon to explore an example
//         </span>
//       </div>
//     </ShowcaseRow>
//   );
// }
