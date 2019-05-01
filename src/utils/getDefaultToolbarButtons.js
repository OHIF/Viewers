/**
 *
 * @param {String} [baseDirectory='/']
 */
export default function(baseDirectory = '/') {
  const iconsFileName = 'icons.svg'
  const relativePathToIcons = `${baseDirectory}${iconsFileName}`

  return [
    {
      command: 'StackScroll',
      type: 'tool',
      text: 'Stack Scroll',
      svgUrl: `${relativePathToIcons}#icon-tools-stack-scroll`,
      active: false,
    },
    {
      command: 'Zoom',
      type: 'tool',
      text: 'Zoom',
      svgUrl: `${relativePathToIcons}#icon-tools-zoom`,
      active: false,
    },
    {
      command: 'Wwwc',
      type: 'tool',
      text: 'Levels',
      svgUrl: `${relativePathToIcons}#icon-tools-levels`,
      active: true,
    },
    {
      command: 'Pan',
      type: 'tool',
      text: 'Pan',
      svgUrl: `${relativePathToIcons}#icon-tools-pan`,
      active: false,
    },
    {
      command: 'Length',
      type: 'tool',
      text: 'Length',
      svgUrl: `${relativePathToIcons}#icon-tools-measure-temp`,
      active: false,
    },
    /*{
        command: 'Annotate',
        type: 'tool',
        text: 'Annotate',
        svgUrl: `${Icons}#icon-tools-measure-non-target`,
        active: false
    },*/
    {
      command: 'Angle',
      type: 'tool',
      text: 'Angle',
      iconClasses: 'fa fa-angle-left',
      active: false,
    },
    {
      command: 'Bidirectional',
      type: 'tool',
      text: 'Bidirectional',
      svgUrl: `${relativePathToIcons}#icon-tools-measure-target`,
      active: false,
    },
    {
      command: 'Brush',
      type: 'tool',
      text: 'Brush',
      iconClasses: 'fa fa-circle',
      active: false,
    },
    {
      command: 'FreehandMouse',
      type: 'tool',
      text: 'Freehand',
      iconClasses: 'fa fa-star',
      active: false,
    },
    {
      command: 'reset',
      type: 'command',
      text: 'Reset',
      svgUrl: `${relativePathToIcons}#icon-tools-reset`,
      active: false,
    },
  ]
}
