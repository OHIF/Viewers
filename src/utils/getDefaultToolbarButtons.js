export default function() {
  return [
    {
      command: 'StackScroll',
      type: 'tool',
      text: 'Stack Scroll',
      icon: 'bars',
      active: false,
    },
    {
      command: 'Zoom',
      type: 'tool',
      text: 'Zoom',
      icon: 'search-plus',
      active: false,
    },
    {
      command: 'Wwwc',
      type: 'tool',
      text: 'Levels',
      icon: 'level',
      active: true,
    },
    {
      command: 'Pan',
      type: 'tool',
      text: 'Pan',
      icon: 'arrows',
      active: false,
    },
    {
      command: 'Length',
      type: 'tool',
      text: 'Length',
      icon: 'measure-temp',
      active: false,
    },
    /*{
        command: 'Annotate',
        type: 'tool',
        text: 'Annotate',
        icon: `icon-tools-measure-non-target`,
        active: false
    },*/
    {
      command: 'Angle',
      type: 'tool',
      text: 'Angle',
      icon: 'angle-left',
      active: false,
    },
    {
      command: 'reset',
      type: 'command',
      text: 'Reset',
      icon: 'reset',
      active: false,
    },
  ];
}
