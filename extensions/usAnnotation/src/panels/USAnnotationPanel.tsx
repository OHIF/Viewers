import React, { useEffect, useState } from 'react';
import { Enums as csToolsEnums, UltrasoundPleuraBLineTool } from '@cornerstonejs/tools';
import { eventTarget, utilities } from '@cornerstonejs/core';
import { useSystem } from '@ohif/core';

import {
  /* Layout */
  PanelSection,
  ScrollArea,
  /* Controls */
  Label,
  Button,
  Icons,
  Switch,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Tabs,
  TabsList,
  TabsTrigger,
  Separator,
} from '@ohif/ui-next';

/**
 * A side panel that drives the ultrasound annotation workflow.
 * It provides controls for managing annotations, toggling display options,
 * and downloading annotations as JSON.
 * @returns The USAnnotationPanel component
 */
export default function USAnnotationPanel() {
  const { servicesManager, commandsManager } = useSystem();

  /** ──────────────────────────────────────────────────────
   * Local state – purely UI related (no business logic).   */

  const { viewportGridService, cornerstoneViewportService, measurementService } =
    servicesManager.services as AppTypes.Services;

  // UI state variables
  const [depthGuide, setDepthGuide] = useState(true);
  const [autoAdd, setAutoAdd] = useState(true);
  const [showPleuraPct, setShowPleuraPct] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);

  // Data state variables
  const [annotatedFrames, setAnnotatedFrames] = useState<any[]>([]);
  const [imageIdsToObserve, setImageIdsToObserve] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  /** ──────────────────────────────────────────────────────
   * Helper – commands bridging back to OHIF services.       */

  /**
   * Switches the active annotation type (pleura or B-line)
   * @param type - The annotation type to switch to
   */
  const switchAnnotation = (type: string) => {
    commandsManager.runCommand('setToolActive', { toolName: UltrasoundPleuraBLineTool.toolName });
    commandsManager.runCommand('switchUSAnnotation', { annotationType: type });
  };

  /**
   * Deletes the last annotation of the specified type
   * @param type - The annotation type to delete
   */
  const deleteLast = (type: string) => {
    commandsManager.runCommand('deleteLastAnnotation', { annotationType: type });
    updateAnnotatedFrames();
  };

  /**
   * Sets the depth guide display state
   * @param value - Boolean indicating whether to show the depth guide
   */
  const setDepthGuideCommand = (value: boolean) => {
    commandsManager.runCommand('setDepthGuide', { value });
    setDepthGuide(value);
  };
  /**
   * Sets the auto-add annotations state
   * When enabled, all frames are monitored for annotations
   * When disabled, only manually added frames are monitored
   * @param value - Boolean indicating whether to auto-add annotations
   */
  const setAutoAddCommand = (value: boolean) => {
    if (value) {
      setImageIdsToObserve([]);
    } else {
      const imageIds = annotatedFrames.map(item => item.imageId);
      if (imageIds.length > 0) {
        setImageIdsToObserve(imageIds);
      } else {
        setImageIdsToObserve(['Manual']);
      }
    }
    setAutoAdd(value);
  };
  /**
   * Sets whether to show the pleura percentage in the viewport overlay
   * @param value - Boolean indicating whether to show the percentage
   */
  const setShowPleuraPercentageCommand = (value: boolean) => {
    commandsManager.runCommand('setShowPleuraPercentage', { value });
    setShowPleuraPct(value);
  };
  /**
   * Sets whether to show the fan overlay in the viewport
   * @param value - Boolean indicating whether to show the overlay
   */
  const setShowOverlayCommand = (value: boolean) => {
    commandsManager.runCommand('setDisplayFanAnnotation', { value });
    commandsManager.runCommand('setShowPleuraPercentage', { value });
    setShowOverlay(value);
  };
  /**
   * Downloads the annotations as a JSON file
   * Uses the labels and imageIdsToObserve state variables
   */
  const downloadJSON = () => {
    commandsManager.runCommand('downloadJSON', { labels, imageIds: imageIdsToObserve });
  };

  /**
   * Adds the current image ID to the list of monitored image IDs
   * Only works when auto-add is disabled
   */
  const addCurrentImageId = () => {
    if (!autoAdd) {
      const activeViewportId = viewportGridService.getActiveViewportId();
      const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
      const currentImageId = viewport.getCurrentImageId();
      const imageIds = [...imageIdsToObserve];
      if (!imageIds.includes(currentImageId)) {
        imageIds.push(currentImageId);
      }
      setImageIdsToObserve(imageIds);
    }
  };

  /**
   * Handles clicking on a row in the annotated frames table
   * Scrolls the viewport to the selected frame
   * @param item - The annotated frame item that was clicked
   */
  const handleRowClick = item => {
    const activeViewportId = viewportGridService.getActiveViewportId();
    const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
    utilities.scroll(viewport, { delta: item.frame - viewport.getCurrentImageIdIndex() });
  };

  /**
   * Render helpers so the JSX doesn’t become spaghetti.     */
  const renderWorkflowToggles = () => (
    <PanelSection.Content>
      <div className="space-y-3 p-2 text-sm text-white">
        <div className="flex items-center">
          <Switch
            id="depth-guide-switch"
            className="mr-3"
            checked={depthGuide}
            onCheckedChange={() => setDepthGuideCommand(!depthGuide)}
          />
          <label
            htmlFor="depth-guide-switch"
            className="cursor-pointer"
            onClick={() => setDepthGuideCommand(!depthGuide)}
          >
            Depth guide toggle
          </label>
        </div>

        {/* <div className="flex items-center">
          <Switch
            id="auto-add-switch"
            className="mr-3"
            checked={autoAdd}
            onCheckedChange={() => setAutoAddCommand(!autoAdd)}
          />
          <label
            htmlFor="auto-add-switch"
            className="cursor-pointer"
            onClick={() => setAutoAddCommand(!autoAdd)}
          >
            Auto-add annotations
          </label>
        </div> */}

        <div className="flex items-center">
          <Switch
            id="pleura-percentage-switch"
            className="mr-3"
            checked={showPleuraPct}
            onCheckedChange={() => setShowPleuraPercentageCommand(!showPleuraPct)}
          />
          <label
            htmlFor="pleura-percentage-switch"
            className="cursor-pointer"
            onClick={() => setShowPleuraPercentageCommand(!showPleuraPct)}
          >
            Show pleura percentage
          </label>
        </div>
      </div>
    </PanelSection.Content>
  );

  const renderSectorAnnotations = () => (
    <PanelSection.Content>
      <div className="flex flex-col gap-4 p-2">
        <Label>Sector Annotations</Label>
        <div className="flex items-center gap-2">
          <Tabs
            defaultValue={UltrasoundPleuraBLineTool.USPleuraBLineAnnotationType.BLINE}
            onValueChange={newValue => switchAnnotation(newValue)}
          >
            <TabsList>
              <TabsTrigger value={UltrasoundPleuraBLineTool.USPleuraBLineAnnotationType.PLEURA}>
                <Icons.Plus /> Pleura line
              </TabsTrigger>
              <TabsTrigger value={UltrasoundPleuraBLineTool.USPleuraBLineAnnotationType.BLINE}>
                <Icons.Plus /> B-line
              </TabsTrigger>
              <Separator orientation="vertical" />
              <Separator orientation="vertical" />
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-auto">
                <Icons.More />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() =>
                  deleteLast(UltrasoundPleuraBLineTool.USPleuraBLineAnnotationType.BLINE)
                }
              >
                <Icons.Delete className="text-foreground" />
                <span className="pl-2">B-line annotation</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  deleteLast(UltrasoundPleuraBLineTool.USPleuraBLineAnnotationType.PLEURA)
                }
              >
                <Icons.Delete className="text-foreground" />
                <span className="pl-2">Pleura annotation</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Switch
            id="show-overlay-switch"
            checked={showOverlay}
            onCheckedChange={() => setShowOverlayCommand(!showOverlay)}
            className="data-[state=checked]:bg-blue-500"
          />
          <label htmlFor="show-overlay-switch" className="cursor-pointer text-blue-300">
            Show Overlay
          </label>
        </div>

        {/* Divider */}
        <hr className="border-t border-gray-800" />
      </div>
    </PanelSection.Content>
  );

  const renderAnnotatedFrames = () => (
    <ScrollArea className="h-full">
      <PanelSection.Content>
        <div className="mb-4 flex items-center justify-between">
          {/* <Button
            variant="ghost"
            size="sm"
            className="text-blue-300"
            disabled={autoAdd}
            onClick={addCurrentImageId}
          >
            <Icons.Plus className="mr-2" /> Add current frame
          </Button> */}
          <Button variant="ghost" onClick={() => downloadJSON()}>
            <Icons.Download className="h-5 w-5" />
            <span>JSON</span>
          </Button>
          <Button variant="ghost" onClick={() => setShowOverlayCommand(!showOverlay)}>
            {showOverlay ? <Icons.Hide className="h-5 w-5" /> : <Icons.Show className="h-5 w-5" />}
          </Button>
        </div>
        <div className="w-full overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-blue-900 text-blue-300">
                <th></th>
                <th className="py-2 px-3 text-left">Frame</th>
                <th className="py-2 px-3 text-center">Pleura lines</th>
                <th className="py-2 px-3 text-center">B-lines</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {annotatedFrames.map(item => (
                <tr
                  key={item.frame}
                  className={`border-b border-blue-900 ${
                    item.frame === 5 ? 'bg-cyan-800 bg-opacity-30' : ''
                  }`}
                  onClick={() => handleRowClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="py-3 px-3">{item.index}</td>
                  <td className="py-3 px-3">{item.frame + 1}</td>
                  <td className="py-3 px-3 text-center">{item.pleura}</td>
                  <td className="py-3 px-3 text-center">{item.bLine}</td>
                  <td className="py-3 px-3 text-right">
                    {item.frame === 5 && (
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" className="p-0 text-blue-300">
                          <Icons.EyeVisible />
                        </Button>
                        <Button variant="ghost" className="ml-2 p-0 text-blue-300">
                          <Icons.More />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelSection.Content>
    </ScrollArea>
  );

  const updateAnnotatedFrames = () => {
    const activeViewportId = viewportGridService.getActiveViewportId();
    const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
    // copying to avoid mutating the original array
    const imageIdsMonitored = [...imageIdsToObserve];
    const imageIdFilter = (imageId: string) => {
      if (imageIdsMonitored.length === 0) {
        return true;
      }
      return imageIdsMonitored.includes(imageId);
    };
    const mapping = UltrasoundPleuraBLineTool.countAnnotations(viewport.element, imageIdFilter);
    if (!mapping) {
      setAnnotatedFrames([]);
      return;
    }
    const keys = Array.from(mapping.keys());
    const updatedFrames = keys.map((key, index) => {
      const { pleura, bLine, frame } = mapping.get(key) || { pleura: 0, bLine: 0, frame: 0 };
      return { imageId: key, index: index + 1, frame, pleura, bLine };
    });
    setAnnotatedFrames(updatedFrames);
  };
  /**
   * Callback function that is called when an annotation is modified
   * Updates the annotatedFrames state with the latest annotation data
   */
  const annotationModified = React.useCallback(
    event => {
      if (event.detail.annotation.metadata.toolName === UltrasoundPleuraBLineTool.toolName) {
        updateAnnotatedFrames();
      }
    },
    [viewportGridService, cornerstoneViewportService, imageIdsToObserve]
  );

  useEffect(() => {
    eventTarget.addEventListener(csToolsEnums.Events.ANNOTATION_MODIFIED, annotationModified);
    const { unsubscribe } = measurementService.subscribe(
      measurementService.EVENTS.MEASUREMENT_REMOVED,
      () => {
        updateAnnotatedFrames();
      }
    );

    return () => {
      eventTarget.removeEventListener(csToolsEnums.Events.ANNOTATION_MODIFIED, annotationModified);
      unsubscribe();
    };
  }, [annotationModified, measurementService]);

  /**
   * ──────────────────────────────────────────────────────
   *  🖼  Final Render                                      */
  return (
    <div
      className="h-full bg-black text-white"
      style={{ minWidth: 240, maxWidth: 480, width: '100%' }}
    >
      {/* Workflow */}
      <PanelSection>
        <PanelSection.Header>Workflow</PanelSection.Header>
        {renderWorkflowToggles()}
      </PanelSection>

      {/* Progress
      <PanelSection>
        <SectionHeader title="Workflow Progress" actionLabel="Source Folder" />
        {renderWorkflowProgress()}
      </PanelSection> */}

      {/* Annotations */}
      <PanelSection>
        <PanelSection.Header> Annotations </PanelSection.Header>
        {renderSectorAnnotations()}
      </PanelSection>

      {/* Annotated frames */}
      <PanelSection className="flex-1">
        <PanelSection.Header> Annotated Frames </PanelSection.Header>
        {renderAnnotatedFrames()}
      </PanelSection>
    </div>
  );
}
