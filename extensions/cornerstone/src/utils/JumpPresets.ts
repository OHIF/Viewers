/**
 * Jump Presets - This enum defines the 3 jump states which are available
 * to be used with the jumpToSlice utility function.
 */
enum JumpPresets {
  /** Jumps to first slice */
  First = 'first',
  /** Jumps to last slice */
  Last = 'last',
  /** Jumps to the middle slice */
  Middle = 'middle',
}

export default JumpPresets;
