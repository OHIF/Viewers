// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :l
import React from 'react';
import classnames from 'classnames';
import { ExpandableToolbarButton, ListMenu } from '@ohif/ui';
import { defaults } from '@ohif/core';

const { windowLevelPresets } = defaults;

export default [
  // Divider
  {
    id: 'Divider',
    type: 'ohif.divider',
  },
  // ~~ Primary
  {
    id: 'Zoom',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-zoom',
      label: 'Zoom',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Zoom' },
      type: 'primary',
    },
  },
  {
    id: 'Wwwc',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    component: ExpandableToolbarButton,
    props: {
      isActive: true,
      icon: 'tool-window-level',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Wwwc' },
      commands: {
        1: {
          commandName: 'setWindowLevel',
          commandOptions: windowLevelPresets[1],
        },
        2: {
          commandName: 'setWindowLevel',
          commandOptions: windowLevelPresets[2],
        },
        3: {
          commandName: 'setWindowLevel',
          commandOptions: windowLevelPresets[3],
        },
        4: {
          commandName: 'setWindowLevel',
          commandOptions: windowLevelPresets[4],
        },
        5: {
          commandName: 'setWindowLevel',
          commandOptions: windowLevelPresets[5],
        }
      },
      type: 'primary',
      content: ListMenu,
      contentProps: {
        options: [
          { value: 1, title: 'Soft tissue', subtitle: '400 / 40' },
          { value: 2, title: 'Lung', subtitle: '1500 / -600' },
          { value: 3, title: 'Liver', subtitle: '150 / 90' },
          { value: 4, title: 'Bone', subtitle: '80 / 40' },
          { value: 5, title: 'Brain', subtitle: '2500 / 480' },
        ],
        renderer: ({ title, subtitle, isActive, index }) => (
          <>
            <div>
              <span className={classnames(isActive ? "text-black" : "text-white", "mr-2 text-base")}>
                {title}
              </span>
              <span className={classnames(isActive ? "text-black" : "text-aqua-pale", "font-thin text-sm")}>
                {subtitle}
              </span>
            </div>
            <span className={classnames(isActive ? "text-black" : "text-primary-active", "text-sm")}>{index + 1}</span>
          </>
        )
      }
    },
  },
  {
    id: 'Pan',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-move',
      label: 'Pan',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Pan' },
      type: 'primary',
    },
  },
  {
    id: 'Capture',
    type: 'ohif.action',
    props: {
      icon: 'tool-capture',
      label: 'Capture',
      commandName: 'showDownloadViewportModal',
      type: 'primary',
    },
  },
  {
    id: 'Layout',
    type: 'ohif.layoutSelector',
  },
  // ~~ Primary: NESTED
  {
    id: 'ResetView',
    type: 'ohif.action',
    props: {
      icon: 'old-reset',
      label: 'Reset View',
      commandName: 'resetViewport',
      type: 'primary',
    },
  },
  {
    id: 'RotateClockwise',
    type: 'ohif.action',
    props: {
      icon: 'old-rotate-right',
      label: 'Rotate Right',
      commandName: 'rotateViewportCW',
      type: 'primary',
    },
  },
  {
    id: 'FlipHorizontally',
    type: 'ohif.action',
    props: {
      icon: 'old-ellipse-h',
      label: 'Flip Horizontally',
      commandName: 'flipViewportHorizontal',
      type: 'primary',
    },
  },
  {
    id: 'StackScroll',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'old-bars',
      label: 'Stack Scroll',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'StackScroll' },
      type: 'primary',
    },
  },
  {
    id: 'Magnify',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'old-circle',
      label: 'Magnify',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Magnify' },
      type: 'primary',
    },
  },
  {
    id: 'Invert',
    type: 'ohif.action',
    props: {
      icon: 'old-invert',
      label: 'Invert',
      commandName: 'invertViewport',
      type: 'primary',
    },
  },
  {
    id: 'Cine',
    type: 'ohif.toggle',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'old-youtube',
      label: 'Cine',
      commandName: 'toggleCine',
      type: 'primary',
    },
  },
  // TODO: 2D MPR: We had said this was off the table?
  {
    id: 'Angle',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'old-angle-left',
      label: 'Angle',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Angle' },
      type: 'primary',
    },
  },
  {
    id: 'Probe',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'old-dot-circle',
      label: 'Probe',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'DragProbe' },
      type: 'primary',
    },
  },
  {
    id: 'RectangleRoi',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'old-circle-o',
      label: 'Rectangle',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'RectangleRoi' },
      type: 'primary',
    },
  },
  // ~~ Secondary
  {
    id: 'Annotate',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-annotate',
      label: 'Annotate',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'ArrowAnnotate' },
      type: 'secondary',
    },
  },
  {
    id: 'Bidirectional',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-bidirectional',
      label: 'Bidirectional',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Bidirectional' },
      type: 'secondary',
    },
  },
  {
    id: 'Ellipse',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-elipse',
      label: 'Ellipse',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'EllipticalRoi' },
      type: 'secondary',
    },
  },
  {
    id: 'Length',
    type: 'ohif.radioGroup',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'tool-length',
      label: 'Length',
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Length' },
      type: 'secondary',
    },
  },
  {
    id: 'Clear',
    type: 'ohif.action',
    config: {
      groupName: 'primaryTool',
    },
    props: {
      isActive: false,
      icon: 'old-trash',
      label: 'Clear',
      commandName: 'clearMeasurements',
      commandOptions: {},
      type: 'secondary',
    },
  },
];
