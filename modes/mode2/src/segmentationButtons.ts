import { ToolbarService } from '@ohif/core';

export default [
  ToolbarService.createButton({
    id: 'SegmentBrush',
    icon: 'brush',
    label: 'Brush',
    commands: [{
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Brush' },
      context: 'CORNERSTONE',
    }],
  }),
  ToolbarService.createButton({
    id: 'SegmentCircularBrush',
    icon: 'circle',
    label: 'Circular Brush',
    commands: [{
      commandName: 'setToolActive',
      commandOptions: { toolName: 'CircularBrush' },
      context: 'CORNERSTONE',
    }],
  }),
  ToolbarService.createButton({
    id: 'SegmentThreshold',
    icon: 'threshold',
    label: 'Threshold',
    commands: [{
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Threshold' },
      context: 'CORNERSTONE',
    }],
  }),
  ToolbarService.createButton({
    id: 'SegmentRectangleScissors',
    icon: 'rect',
    label: 'Rectangle Scissors',
    commands: [{
      commandName: 'setToolActive',
      commandOptions: { toolName: 'RectangleScissors' },
      context: 'CORNERSTONE',
    }],
  }),
  ToolbarService.createButton({
    id: 'SegmentCircleScissors',
    icon: 'circle-slice',
    label: 'Circle Scissors',
    commands: [{
      commandName: 'setToolActive',
      commandOptions: { toolName: 'CircleScissors' },
      context: 'CORNERSTONE',
    }],
  }),
  ToolbarService.createButton({
    id: 'SegmentSphereScissors',
    icon: 'sphere',
    label: 'Sphere Scissors',
    commands: [{
      commandName: 'setToolActive',
      commandOptions: { toolName: 'SphereScissors' },
      context: 'CORNERSTONE',
    }],
  }),
  ToolbarService.createButton({
    id: 'SegmentCorrectionScissors',
    icon: 'scissors',
    label: 'Correction Scissors',
    commands: [{
      commandName: 'setToolActive',
      commandOptions: { toolName: 'CorrectionScissors' },
      context: 'CORNERSTONE',
    }],
  }),
  ToolbarService.createButton({
    id: 'SegmentEraser',
    icon: 'eraser',
    label: 'Eraser',
    commands: [{
      commandName: 'setToolActive',
      commandOptions: { toolName: 'Eraser' },
      context: 'CORNERSTONE',
    }],
  }),
];
