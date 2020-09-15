// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :l
import {
  // ExpandableToolbarButton,
  // ListMenu,
  WindowLevelMenuItem,
} from '@ohif/ui';
import { defaults } from '@ohif/core';

const { windowLevelPresets } = defaults;
/**
 *
 * @param {*} type - 'tool' | 'action' | 'toggle'
 * @param {*} id
 * @param {*} icon
 * @param {*} label
 */
function _createButton(type, id, icon, label, commandName, commandOptions) {
  return {
    id,
    icon,
    label,
    type,
    commandName,
    commandOptions,
  };
}

const _createActionButton = _createButton.bind(null, 'action');
const _createToggleButton = _createButton.bind(null, 'toggle');
const _createToolButton = _createButton.bind(null, 'tool');

/**
 *
 * @param {*} preset - preset number (from above import)
 * @param {*} title
 * @param {*} subtitle
 */
function _createWwwcPreset(preset, title, subtitle) {
  return {
    id: preset,
    title,
    subtitle,
    type: 'action',
    commandName: 'setWindowLevel',
    commandOptions: windowLevelPresets[preset],
  };
}

export default [
  // Measurement
  {
    id: 'MeasurementTools',
    type: 'ohif.splitButton',
    props: {
      groupId: 'MeasurementTools',
      isRadio: true, // ?
      // Switch?
      primary: _createToolButton('Length', 'tool-length', 'Length', undefined, {
        toolName: 'Length',
      }),
      secondary: {
        icon: 'chevron-down',
        label: '',
        isActive: true,
        tooltip: 'More Measure Tools',
      },
      items: [
        _createToolButton('Length', 'tool-length', 'Length', undefined, {
          toolName: 'Length',
        }),
        _createToolButton(
          'Bidirectional',
          'tool-bidirectional',
          'Bidirectional',
          undefined,
          { toolName: 'Bidirectional' }
        ),
        _createToolButton(
          'ArrowAnnotate',
          'tool-annotate',
          'Annotation',
          undefined,
          { toolName: 'ArrowAnnotate' }
        ),
        _createToolButton(
          'EllipticalRoi',
          'tool-elipse',
          'Ellipse',
          undefined,
          {
            toolName: 'EllipticalRoi',
          }
        ),
      ],
    },
  },
  // Zoom..
  {
    id: 'Zoom',
    type: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-zoom',
      label: 'Zoom',
      commandOptions: { toolName: 'Zoom' },
    },
  },
  // Window Level + Presets...
  {
    id: 'WindowLevel',
    type: 'ohif.splitButton',
    props: {
      primary: _createToolButton(
        'Wwwc',
        'tool-window-level',
        'Window Level',
        undefined,
        { toolName: 'Wwwc' }
      ),
      secondary: {
        icon: 'chevron-down',
        label: '',
        isActive: true,
        tooltip: 'More Measure Tools',
      },
      isAction: true, // ?
      renderer: WindowLevelMenuItem,
      items: [
        _createWwwcPreset(1, 'Soft tissue', '400 / 40'),
        _createWwwcPreset(2, 'Lung', '1500 / -600'),
        _createWwwcPreset(3, 'Liver', '150 / 90'),
        _createWwwcPreset(4, 'Bone', '80 / 40'),
        _createWwwcPreset(5, 'Brain', '2500 / 480'),
      ],
    },
  },
  // Pan...
  {
    id: 'Pan',
    type: 'ohif.radioGroup',
    props: {
      type: 'tool',
      icon: 'tool-move',
      label: 'Pan',
      commandOptions: { toolName: 'Pan' },
    },
  },
  {
    id: 'Capture',
    type: 'ohif.action',
    props: {
      icon: 'tool-capture',
      label: 'Capture',
      type: 'action',
      commandName: 'showDownloadViewportModal',
    },
  },
  {
    id: 'Layout',
    type: 'ohif.layoutSelector',
  },
  // More...
  {
    id: 'MoreTools',
    type: 'ohif.splitButton',
    props: {
      isRadio: true, // ?
      groupId: 'MoreTools',
      primary: _createActionButton(
        'reset',
        'tool-reset',
        'Reset View',
        'resetViewport'
      ),
      secondary: {
        icon: 'chevron-down',
        label: '',
        isActive: true,
        tooltip: 'More Measure Tools',
      },
      items: [
        _createActionButton(
          'reset',
          'tool-reset',
          'Reset View',
          'resetViewport'
        ),
        _createActionButton(
          'rotate-right',
          'tool-rotate-right',
          'Rotate Right',
          'rotateViewportCW'
        ),
        _createActionButton(
          'flip-horizontal',
          'tool-flip-horizontal',
          'Flip Horizontally',
          'flipViewportHorizontal'
        ),
        _createToolButton(
          'StackScroll',
          'tool-stack-scroll',
          'Stack Scroll',
          undefined,
          { toolName: 'StackScroll' }
        ),
        _createToolButton('Magnify', 'tool-magnify', 'Magnify', undefined, {
          toolName: 'Magnify',
        }),
        _createActionButton(
          'invert',
          'tool-invert',
          'Invert',
          'invertViewport'
        ),
        _createToggleButton('cine', 'tool-cine', 'Cine', 'toggleCine'),
        _createToolButton('Angle', 'tool-angle', 'Angle', undefined, {
          toolName: 'Angle',
        }),
        _createToolButton('DragProbe', 'tool-probe', 'Probe', undefined, {
          toolName: 'DragProbe',
        }),
        _createToolButton(
          'Rectangle',
          'tool-rectangle',
          'Rectangle',
          undefined,
          { toolName: 'RectangleRoi' }
        ),
      ],
    },
  },
];
