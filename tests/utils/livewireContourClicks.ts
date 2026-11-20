// Viewport pixels for a livewire contour on the first slice of the segmentation study
// 1.3.12.2.1107.5.2.32.35162.30000015050317233592200000046, tuned to edges the tool snaps to.
// Wide enough to leave room for a hole inside it; a new contour's first click must stay ~6px
// clear of existing outlines.
export const livewireContourClicks = [
  { x: 350, y: 330 },
  { x: 430, y: 210 },
  { x: 570, y: 240 },
  { x: 520, y: 340 },
];
