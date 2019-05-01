import OHIF from 'ohif-core'

const Icons = 'icons.svg'

export default function setupButtons(store) {
  const defaultButtons = [
    {
      command: 'StackScroll',
      type: 'tool',
      text: 'Stack Scroll',
      svgUrl: `${Icons}#icon-tools-stack-scroll`,
      active: false,
    },
    {
      command: 'Zoom',
      type: 'tool',
      text: 'Zoom',
      svgUrl: `${Icons}#icon-tools-zoom`,
      active: false,
    },
    {
      command: 'Wwwc',
      type: 'tool',
      text: 'Levels',
      svgUrl: `${Icons}#icon-tools-levels`,
      active: true,
    },
    {
      command: 'Pan',
      type: 'tool',
      text: 'Pan',
      svgUrl: `${Icons}#icon-tools-pan`,
      active: false,
    },
    {
      command: 'Length',
      type: 'tool',
      text: 'Length',
      svgUrl: `${Icons}#icon-tools-measure-temp`,
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
      svgUrl: `${Icons}#icon-tools-measure-target`,
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
      svgUrl: `${Icons}#icon-tools-reset`,
      active: false,
    },
  ]

  const buttonsAction = OHIF.redux.actions.setAvailableButtons(defaultButtons)

  store.dispatch(buttonsAction)
}
