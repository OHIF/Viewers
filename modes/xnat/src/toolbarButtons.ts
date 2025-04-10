// TODO: torn, can either bake this here; or have to create a whole new button type
// Only ways that you can pass in a custom React component for render :l
import { ToolbarService, ViewportGridService } from '@ohif/core';
// Use a simple type declaration to avoid the import error
// We only need to know it's an array of objects
const { createButton } = ToolbarService;

// Constants to avoid undefined reference errors
const VIEWPORT_GRID_EVENTS = {
  ACTIVE_VIEWPORT_ID_CHANGED: 'event::activeviewportidchanged',
  VIEWPORTS_READY: 'event::viewportsReady',
};

const ReferenceLinesListeners = [
  {
    commandName: 'setSourceViewportForReferenceLinesTool',
    context: 'CORNERSTONE',
  },
];

export const setToolActiveToolbar = {
  commandName: 'setToolActiveToolbar',
  commandOptions: {
    toolGroupIds: ['default', 'mpr', 'SRToolGroup', 'volume3d'],
  },
};

const toolbarButtons = [
  {
    id: 'MeasurementTools',
    uiType: 'ohif.toolButtonList',
    props: {
      groupId: 'MeasurementTools',
      // group evaluate to determine which item should move to the top
      evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
      primary: createButton({
        id: 'Length',
        icon: 'tool-length',
        label: 'Length',
        tooltip: 'Length Tool',
        commands: setToolActiveToolbar,
        evaluate: 'evaluate.cornerstoneTool',
      }),
      secondary: {
        icon: 'chevron-down',
        tooltip: 'More Measure Tools',
      },
      items: [
        createButton({
          id: 'Length',
          icon: 'tool-length',
          label: 'Length',
          tooltip: 'Length Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'Bidirectional',
          icon: 'tool-bidirectional',
          label: 'Bidirectional',
          tooltip: 'Bidirectional Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'ArrowAnnotate',
          icon: 'tool-annotate',
          label: 'Annotation',
          tooltip: 'Arrow Annotate',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'EllipticalROI',
          icon: 'tool-ellipse',
          label: 'Ellipse',
          tooltip: 'Ellipse ROI',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'RectangleROI',
          icon: 'tool-rectangle',
          label: 'Rectangle',
          tooltip: 'Rectangle ROI',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'CircleROI',
          icon: 'tool-circle',
          label: 'Circle',
          tooltip: 'Circle Tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'PlanarFreehandROI',
          icon: 'icon-tool-freehand-roi',
          label: 'Freehand ROI',
          tooltip: 'Freehand ROI',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'SplineROI',
          icon: 'icon-tool-spline-roi',
          label: 'Spline ROI',
          tooltip: 'Spline ROI',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'LivewireContour',
          icon: 'icon-tool-livewire',
          label: 'Livewire tool',
          tooltip: 'Livewire tool',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
      ],
    },
  },
  {
    id: 'Zoom',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-zoom',
      label: 'Zoom',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  // Window Level
  {
    id: 'WindowLevel',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-window-level',
      label: 'Window Level',
      commands: setToolActiveToolbar,
      evaluate: [
        'evaluate.cornerstoneTool',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['wholeSlide'],
        },
      ],
    },
  },
  // Pan...
  {
    id: 'Pan',
    uiType: 'ohif.toolButton',
    props: {
      type: 'tool',
      icon: 'tool-move',
      label: 'Pan',
      commands: setToolActiveToolbar,
      evaluate: 'evaluate.cornerstoneTool',
    },
  },
  {
    id: 'TrackballRotate',
    uiType: 'ohif.toolButton',
    props: {
      type: 'tool',
      icon: 'tool-3d-rotate',
      label: '3D Rotate',
      commands: setToolActiveToolbar,
      evaluate: {
        name: 'evaluate.cornerstoneTool',
        disabledText: 'Select a 3D viewport to enable this tool',
      },
    },
  },
  {
    id: 'Capture',
    uiType: 'ohif.toolButton',
    props: {
      icon: 'tool-capture',
      label: 'Capture',
      commands: 'showDownloadViewportModal',
      evaluate: [
        'evaluate.action',
        {
          name: 'evaluate.viewport.supported',
          unsupportedViewportTypes: ['video', 'wholeSlide'],
        },
      ],
    },
  },
  {
    id: 'Layout',
    uiType: 'ohif.layoutSelector',
    props: {
      rows: 3,
      columns: 4,
      evaluate: 'evaluate.action',
    },
  },
  {
    id: 'Crosshairs',
    uiType: 'ohif.toolButton',
    props: {
      type: 'tool',
      icon: 'tool-crosshair',
      label: 'Crosshairs',
      commands: {
        commandName: 'setToolActiveToolbar',
        commandOptions: {
          toolGroupIds: ['mpr'],
        },
      },
      evaluate: {
        name: 'evaluate.cornerstoneTool',
        disabledText: 'Select an MPR viewport to enable this tool',
      },
    },
  },
  {
    id: 'MoreTools',
    uiType: 'ohif.toolButtonList',
    props: {
      groupId: 'MoreTools',
      evaluate: 'evaluate.group.promoteToPrimaryIfCornerstoneToolNotActiveInTheList',
      primary: createButton({
        id: 'Reset',
        icon: 'tool-reset',
        tooltip: 'Reset View',
        label: 'Reset',
        commands: 'resetViewport',
        evaluate: 'evaluate.action',
      }),
      secondary: {
        icon: 'chevron-down',
        label: '',
        tooltip: 'More Tools',
      },
      items: [
        createButton({
          id: 'Reset',
          icon: 'tool-reset',
          label: 'Reset View',
          tooltip: 'Reset View',
          commands: 'resetViewport',
          evaluate: 'evaluate.action',
        }),
        createButton({
          id: 'rotate-right',
          icon: 'tool-rotate-right',
          label: 'Rotate Right',
          tooltip: 'Rotate +90',
          commands: 'rotateViewportCW',
          evaluate: 'evaluate.action',
        }),
        createButton({
          id: 'flipHorizontal',
          icon: 'tool-flip-horizontal',
          label: 'Flip Horizontal',
          tooltip: 'Flip Horizontally',
          commands: 'flipViewportHorizontal',
          evaluate: [
            'evaluate.viewportProperties.toggle',
            {
              name: 'evaluate.viewport.supported',
              unsupportedViewportTypes: ['volume3d'],
            },
          ],
        }),
        createButton({
          id: 'ReferenceLines',
          icon: 'tool-referenceLines',
          label: 'Reference Lines',
          tooltip: 'Show Reference Lines',
          commands: 'toggleEnabledDisabledToolbar',
          listeners: {
            [VIEWPORT_GRID_EVENTS.ACTIVE_VIEWPORT_ID_CHANGED]: ReferenceLinesListeners,
            [VIEWPORT_GRID_EVENTS.VIEWPORTS_READY]: ReferenceLinesListeners,
          },
          evaluate: 'evaluate.cornerstoneTool.toggle',
        }),
        createButton({
          id: 'ImageOverlayViewer',
          icon: 'toggle-dicom-overlay',
          label: 'Image Overlay',
          tooltip: 'Toggle Image Overlay',
          commands: 'toggleEnabledDisabledToolbar',
          evaluate: 'evaluate.cornerstoneTool.toggle',
        }),
        createButton({
          id: 'StackScroll',
          icon: 'tool-stack-scroll',
          label: 'Stack Scroll',
          tooltip: 'Stack Scroll',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'invert',
          icon: 'tool-invert',
          label: 'Invert',
          tooltip: 'Invert Colors',
          commands: 'invertViewport',
          evaluate: 'evaluate.viewportProperties.toggle',
        }),
        createButton({
          id: 'Cine',
          icon: 'tool-cine',
          label: 'Cine',
          tooltip: 'Cine',
          commands: 'toggleCine',
          evaluate: [
            'evaluate.cine',
            {
              name: 'evaluate.viewport.supported',
              unsupportedViewportTypes: ['volume3d'],
            },
          ],
        }),
        createButton({
          id: 'Magnify',
          icon: 'tool-magnify',
          label: 'Zoom-in',
          tooltip: 'Zoom-in',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
        createButton({
          id: 'TagBrowser',
          icon: 'dicom-tag-browser',
          label: 'Dicom Tag Browser',
          tooltip: 'Dicom Tag Browser',
          commands: 'openDICOMTagViewer',
        }),
        createButton({
          id: 'AdvancedMagnify',
          icon: 'icon-tool-loupe',
          label: 'Magnify Probe',
          tooltip: 'Magnify Probe',
          commands: 'toggleActiveDisabledToolbar',
          evaluate: 'evaluate.cornerstoneTool.toggle.ifStrictlyDisabled',
        }),
        createButton({
          id: 'UltrasoundDirectionalTool',
          icon: 'icon-tool-ultrasound-bidirectional',
          label: 'Ultrasound Directional',
          tooltip: 'Ultrasound Directional',
          commands: setToolActiveToolbar,
          evaluate: [
            'evaluate.cornerstoneTool',
            {
              name: 'evaluate.modality.supported',
              supportedModalities: ['US'],
            },
          ],
        }),
        createButton({
          id: 'WindowLevelRegion',
          icon: 'icon-tool-window-region',
          label: 'Window Level Region',
          tooltip: 'Window Level Region',
          commands: setToolActiveToolbar,
          evaluate: 'evaluate.cornerstoneTool',
        }),
      ],
    },
  },
];

export default toolbarButtons;
