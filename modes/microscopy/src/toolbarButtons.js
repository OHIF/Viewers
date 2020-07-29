import React from 'react';
import classnames from 'classnames';
import { ExpandableToolbarButton, ListMenu } from '@ohif/ui';

export default [
  // Divider
  {
    id: 'Divider',
    type: 'ohif.divider',
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
    id: 'Layout',
    type: 'ohif.layoutSelector',
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
      commandOptions: { toolName: 'Probe' },
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
