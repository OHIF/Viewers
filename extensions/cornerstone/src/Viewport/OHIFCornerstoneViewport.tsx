import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as cs3DTools from '@cornerstonejs/tools';
import { Enums, eventTarget, getEnabledElement } from '@cornerstonejs/core';
import { MeasurementService, useViewportRef } from '@ohif/core';
import { useViewportDialog } from '@ohif/ui-next';
import type { Types as csTypes } from '@cornerstonejs/core';

import { setEnabledElement } from '../state';

import './OHIFCornerstoneViewport.css';
import CornerstoneOverlays from './Overlays/CornerstoneOverlays';
import CinePlayer from '../components/CinePlayer';
import type { Types } from '@ohif/core';

import OHIFViewportActionCorners from '../components/OHIFViewportActionCorners';
import { getViewportPresentations } from '../utils/presentations/getViewportPresentations';
import { useSynchronizersStore } from '../stores/useSynchronizersStore';
import ActiveViewportBehavior from '../utils/ActiveViewportBehavior';
import { WITH_NAVIGATION } from '../services/ViewportService/CornerstoneViewportService';

// Simple inline SEG overlay component
const SimpleSEGOverlay: React.FC<{ viewportId: string; elementRef: React.MutableRefObject<HTMLDivElement> }> = ({ viewportId, elementRef }) => {
  const [segPixelDataMap, setSegPixelDataMap] = useState<Map<string, any>>(new Map()); // 支持多个SEG
  const [currentSliceIndex, setCurrentSliceIndex] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleSEGLoaded = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { caseId, fileName } = customEvent.detail;

      if (caseId && fileName) {
        loadSEGFileDirectly(caseId, fileName);
      }
    };

    const handleSEGUnloaded = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { caseId, fileName } = customEvent.detail;

      if (caseId && fileName) {
        // Remove the SEG from the map
        setSegPixelDataMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileName);
          return newMap;
        });
      }
    };

    window.addEventListener('SEG_LOADED', handleSEGLoaded as EventListener);
    window.addEventListener('SEG_UNLOADED', handleSEGUnloaded as EventListener);
    return () => {
      window.removeEventListener('SEG_LOADED', handleSEGLoaded as EventListener);
      window.removeEventListener('SEG_UNLOADED', handleSEGUnloaded as EventListener);
    };
  }, []);

  // 监听图像层数变化事件
  useEffect(() => {
    let lastImageIndex = -1;
    
    const checkImageChange = () => {
      try {
        if (elementRef.current) {
          const enabledElement = getEnabledElement(elementRef.current);
          if (enabledElement) {
            const { viewport } = enabledElement;
            
            if (viewport.getCurrentImageIdIndex) {
              const currentIndex = viewport.getCurrentImageIdIndex();
              if (typeof currentIndex === 'number' && !isNaN(currentIndex) && currentIndex !== lastImageIndex) {
                lastImageIndex = currentIndex;
                setCurrentSliceIndex(currentIndex);
              }
            } else {
              const currentImageId = viewport.getCurrentImageId();
              if (currentImageId) {
                const match = currentImageId.match(/frame=(\d+)/);
                if (match) {
                  const frameIndex = parseInt(match[1], 10);
                  if (!isNaN(frameIndex) && frameIndex !== lastImageIndex) {
                    lastImageIndex = frameIndex;
                    setCurrentSliceIndex(frameIndex);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('SimpleSEGOverlay: Error checking image change:', error);
      }
    };

    const intervalId = setInterval(checkImageChange, 50);
    
    const handleStackScroll = (evt: any) => {
      checkImageChange();
    };

    eventTarget.addEventListener(Enums.Events.STACK_NEW_IMAGE, handleStackScroll);
    
    return () => {
      clearInterval(intervalId);
      eventTarget.removeEventListener(Enums.Events.STACK_NEW_IMAGE, handleStackScroll);
    };
  }, [elementRef]);

  // 渲染SEG掩膜的函数
  const renderSEGMask = useCallback((sliceIndex: number) => {
    if (!canvasRef.current || segPixelDataMap.size === 0 || !elementRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const enabledElement = getEnabledElement(elementRef.current);
      if (!enabledElement) {
        console.error('SimpleSEGOverlay: No enabled element found');
        return;
      }

      const { viewport } = enabledElement;
      
      const canvasWidth = elementRef.current.clientWidth;
      const canvasHeight = elementRef.current.clientHeight;

      let imageX = 0, imageY = 0, imageWidth = canvasWidth, imageHeight = canvasHeight;
      
      if ((viewport as any).getCanvasRectangle) {
        const rect = (viewport as any).getCanvasRectangle();
        if (rect) {
          imageX = rect.x || 0;
          imageY = rect.y || 0;
          imageWidth = rect.width || canvasWidth;
          imageHeight = rect.height || canvasHeight;
        }
      } else if ((viewport as any).canvas) {
        const vpCanvas = (viewport as any).canvas;
        if (vpCanvas) {
          const imageSize = Math.min(canvasWidth, canvasHeight);
          imageWidth = imageSize;
          imageHeight = imageSize;
          imageX = (canvasWidth - imageSize) / 2;
          imageY = (canvasHeight - imageSize) / 2;
        }
      } else {
        const imageSize = Math.min(canvasWidth, canvasHeight);
        imageWidth = imageSize;
        imageHeight = imageSize;
        imageX = (canvasWidth - imageSize) / 2;
        imageY = (canvasHeight - imageSize) / 2;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 512;
      tempCanvas.height = 512;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // 为每个激活的SEG渲染掩膜
      segPixelDataMap.forEach((segPixelData, fileName) => {
        const imageData = tempCtx.createImageData(512, 512);
        const data = imageData.data;
        const frameSize = segPixelData.columns * segPixelData.rows;
        const pixelData = segPixelData.data;
        const safeSliceIndex = Math.min(sliceIndex, segPixelData.numFrames - 1);
        const frameOffset = safeSliceIndex * frameSize;

        for (let i = 0; i < frameSize; i++) {
          const pixelIndex = i * 4;
          const segValue = pixelData[frameOffset + i];

          if (segValue > 0) {
            // 使用不同的颜色区分不同的SEG
            const colorIndex = Array.from(segPixelDataMap.keys()).indexOf(fileName);
            const colors = [
              [255, 0, 0, 128],    // Red
              [0, 255, 0, 128],    // Green
              [0, 0, 255, 128],    // Blue
              [255, 255, 0, 128],  // Yellow
              [255, 0, 255, 128],  // Magenta
              [0, 255, 255, 128],  // Cyan
            ];
            const color = colors[colorIndex % colors.length];
            data[pixelIndex] = color[0];
            data[pixelIndex + 1] = color[1];
            data[pixelIndex + 2] = color[2];
            data[pixelIndex + 3] = color[3];
          } else {
            data[pixelIndex] = 0;
            data[pixelIndex + 1] = 0;
            data[pixelIndex + 2] = 0;
            data[pixelIndex + 3] = 0;
          }
        }

        tempCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(tempCanvas, imageX, imageY, imageWidth, imageHeight);
      });
    } catch (error) {
      console.error('SimpleSEGOverlay: Error rendering SEG mask:', error);
    }
  }, [segPixelDataMap, elementRef]);

  // 当层数变化或像素数据变化时重新渲染
  useEffect(() => {
    if (segPixelDataMap.size > 0 && canvasRef.current) {
      renderSEGMask(currentSliceIndex);
    }
  }, [currentSliceIndex, segPixelDataMap, renderSEGMask]);

  // 直接读取SEG文件的简化函数
  const loadSEGFileDirectly = async (caseId: string, fileName: string) => {
    try {
      // 通过后端API读取完整文件
      const segUrl = `http://localhost:8082/api/dicom-folders/seg-file?caseId=${caseId}&fileName=${fileName}`;
      
      const response = await fetch(segUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // 解析DICOM文件
      const { parseDicom } = await import('dicom-parser');
      const dataSet = parseDicom(new Uint8Array(arrayBuffer));
      
      const rows = dataSet.uint16('x00280010');
      const columns = dataSet.uint16('x00280011');
      const dicomNumFrames = dataSet.string('x00280008');
      const actualNumFrames = dicomNumFrames ? parseInt(dicomNumFrames, 10) : 0;
      
      const pixelDataElement = dataSet.elements.x7fe00010;
      if (pixelDataElement) {
        const pixelDataOffset = pixelDataElement.dataOffset;
        const pixelDataLength = pixelDataElement.length;
        const pixelData = new Uint8Array(arrayBuffer, pixelDataOffset, pixelDataLength);
        
        // 计算层数范围
        const frameSize = (rows || 512) * (columns || 512);
        let firstFrameIndex = -1;
        let lastFrameIndex = -1;
        
        for (let i = 0; i < actualNumFrames; i++) {
          const frameStart = i * frameSize;
          const frameEnd = frameStart + frameSize;
          const frameData = pixelData.slice(frameStart, frameEnd);
          
          let hasSegmentation = false;
          for (let j = 0; j < frameData.length; j++) {
            if (frameData[j] !== 0) {
              hasSegmentation = true;
              break;
            }
          }
          
          if (hasSegmentation) {
            if (firstFrameIndex === -1) {
              firstFrameIndex = i;
            }
            lastFrameIndex = i;
          }
        }
        
        setSegPixelDataMap(prev => {
          const newMap = new Map(prev);
          newMap.set(fileName, {
            data: pixelData,
            rows,
            columns,
            numFrames: actualNumFrames,
            bitsAllocated: 8,
            bitsStored: 8
          });
          return newMap;
        });
        
        // 发送层数范围信息给父窗口
        if (firstFrameIndex !== -1 && lastFrameIndex !== -1) {
          window.parent.postMessage({
            type: 'SEG_SLICE_RANGE',
            fileName: fileName,
            firstSlice: firstFrameIndex,
            lastSlice: lastFrameIndex
          }, '*');
        }
      } else {
        console.error('SimpleSEGOverlay: No pixel data found in DICOM');
      }
    } catch (error) {
      console.error('SimpleSEGOverlay: Failed to load SEG file:', error);
    }
  };

  // Render actual segmentation mask when pixel data is available
  if (segPixelDataMap.size === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
};

const STACK = 'stack';

// Cache for viewport dimensions, persists across component remounts
const viewportDimensions = new Map<string, { width: number; height: number }>();

// Todo: This should be done with expose of internal API similar to react-vtkjs-viewport
// Then we don't need to worry about the re-renders if the props change.
const OHIFCornerstoneViewport = React.memo(
  (
    props: withAppTypes<{
      viewportId: string;
      displaySets: AppTypes.DisplaySet[];
      viewportOptions: AppTypes.ViewportGrid.GridViewportOptions;
      initialImageIndex: number;
    }>
  ) => {
    const {
      displaySets,
      dataSource,
      viewportOptions,
      displaySetOptions,
      servicesManager,
      onElementEnabled,
      // eslint-disable-next-line react/prop-types
      onElementDisabled,
      isJumpToMeasurementDisabled = false,
      // Note: you SHOULD NOT use the initialImageIdOrIndex for manipulation
      // of the imageData in the OHIFCornerstoneViewport. This prop is used
      // to set the initial state of the viewport's first image to render
      // eslint-disable-next-line react/prop-types
      initialImageIndex,
      // if the viewport is part of a hanging protocol layout
      // we should not really rely on the old synchronizers and
      // you see below we only rehydrate the synchronizers if the viewport
      // is not part of the hanging protocol layout. HPs should
      // define their own synchronizers. Since the synchronizers are
      // viewportId dependent and
      // eslint-disable-next-line react/prop-types
      isHangingProtocolLayout,
    } = props;
    const viewportId = viewportOptions.viewportId;

    if (!viewportId) {
      throw new Error('Viewport ID is required');
    }

    // Make sure displaySetOptions has one object per displaySet
    while (displaySetOptions.length < displaySets.length) {
      displaySetOptions.push({});
    }

    // Since we only have support for dynamic data in volume viewports, we should
    // handle this case here and set the viewportType to volume if any of the
    // displaySets are dynamic volumes
    viewportOptions.viewportType = displaySets.some(
      ds => ds.isDynamicVolume && ds.isReconstructable
    )
      ? 'volume'
      : viewportOptions.viewportType;

    const [scrollbarHeight, setScrollbarHeight] = useState('100px');
    const [enabledVPElement, setEnabledVPElement] = useState(null);
    const elementRef = useRef() as React.MutableRefObject<HTMLDivElement>;
    const viewportRef = useViewportRef(viewportId);

    const {
      displaySetService,
      toolbarService,
      toolGroupService,
      syncGroupService,
      cornerstoneViewportService,
      segmentationService,
      cornerstoneCacheService,
      customizationService,
      measurementService,
    } = servicesManager.services;

    const [viewportDialogState] = useViewportDialog();
    // useCallback for scroll bar height calculation
    const setImageScrollBarHeight = useCallback(() => {
      const scrollbarHeight = `${elementRef.current.clientHeight - 10}px`;
      setScrollbarHeight(scrollbarHeight);
    }, [elementRef]);

    // useCallback for onResize
    const onResize = useCallback(
      (entries: ResizeObserverEntry[]) => {
        if (elementRef.current && entries?.length) {
          const entry = entries[0];
          const { width, height } = entry.contentRect;

          const prevDimensions = viewportDimensions.get(viewportId) || { width: 0, height: 0 };

          // Check if dimensions actually changed and then only resize if they have changed
          const hasDimensionsChanged =
            prevDimensions.width !== width || prevDimensions.height !== height;

          if (width > 0 && height > 0 && hasDimensionsChanged) {
            viewportDimensions.set(viewportId, { width, height });
            // Perform resize operations
            cornerstoneViewportService.resize();
            setImageScrollBarHeight();
          }
        }
      },
      [viewportId, elementRef, cornerstoneViewportService, setImageScrollBarHeight]
    );

    useEffect(() => {
      const element = elementRef.current;
      if (!element) {
        return;
      }

      const resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(element);

      // Cleanup function
      return () => {
        resizeObserver.unobserve(element);
        resizeObserver.disconnect();
      };
    }, [onResize]);

    const cleanUpServices = useCallback(
      viewportInfo => {
        const renderingEngineId = viewportInfo.getRenderingEngineId();
        const syncGroups = viewportInfo.getSyncGroups();

        toolGroupService.removeViewportFromToolGroup(viewportId, renderingEngineId);
        syncGroupService.removeViewportFromSyncGroup(viewportId, renderingEngineId, syncGroups);

        segmentationService.clearSegmentationRepresentations(viewportId);
      },
      [viewportId, segmentationService, syncGroupService, toolGroupService]
    );

    const elementEnabledHandler = useCallback(
      evt => {
        // check this is this element reference and return early if doesn't match
        if (evt.detail.element !== elementRef.current) {
          return;
        }

        const { viewportId, element } = evt.detail;
        const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);

        if (!viewportInfo) {
          return;
        }

        setEnabledElement(viewportId, element);
        setEnabledVPElement(element);

        const renderingEngineId = viewportInfo.getRenderingEngineId();
        const toolGroupId = viewportInfo.getToolGroupId();
        const syncGroups = viewportInfo.getSyncGroups();

        toolGroupService.addViewportToToolGroup(viewportId, renderingEngineId, toolGroupId);

        syncGroupService.addViewportToSyncGroup(viewportId, renderingEngineId, syncGroups);

        // we don't need reactivity here so just use state
        const { synchronizersStore } = useSynchronizersStore.getState();
        if (synchronizersStore?.[viewportId]?.length && !isHangingProtocolLayout) {
          // If the viewport used to have a synchronizer, re apply it again
          _rehydrateSynchronizers(viewportId, syncGroupService);
        }

        if (onElementEnabled && typeof onElementEnabled === 'function') {
          onElementEnabled(evt);
        }
      },
      [viewportId, onElementEnabled, toolGroupService]
    );

    // disable the element upon unmounting
    useEffect(() => {
      cornerstoneViewportService.enableViewport(viewportId, elementRef.current);

      eventTarget.addEventListener(Enums.Events.ELEMENT_ENABLED, elementEnabledHandler);

      setImageScrollBarHeight();

      return () => {
        const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);

        if (!viewportInfo) {
          return;
        }

        cornerstoneViewportService.storePresentation({ viewportId });

        // This should be done after the store presentation since synchronizers
        // will get cleaned up and they need the viewportInfo to be present
        cleanUpServices(viewportInfo);

        if (onElementDisabled && typeof onElementDisabled === 'function') {
          onElementDisabled(viewportInfo);
        }

        cornerstoneViewportService.disableElement(viewportId);
        viewportRef.unregister();

        eventTarget.removeEventListener(Enums.Events.ELEMENT_ENABLED, elementEnabledHandler);
      };
    }, []);

    // subscribe to displaySet metadata invalidation (updates)
    // Currently, if the metadata changes we need to re-render the display set
    // for it to take effect in the viewport. As we deal with scaling in the loading,
    // we need to remove the old volume from the cache, and let the
    // viewport to re-add it which will use the new metadata. Otherwise, the
    // viewport will use the cached volume and the new metadata will not be used.
    // Note: this approach does not actually end of sending network requests
    // and it uses the network cache
    useEffect(() => {
      const { unsubscribe } = displaySetService.subscribe(
        displaySetService.EVENTS.DISPLAY_SET_SERIES_METADATA_INVALIDATED,
        async ({
          displaySetInstanceUID: invalidatedDisplaySetInstanceUID,
          invalidateData,
        }: Types.DisplaySetSeriesMetadataInvalidatedEvent) => {
          if (!invalidateData) {
            return;
          }

          const viewportInfo = cornerstoneViewportService.getViewportInfo(viewportId);

          if (viewportInfo.hasDisplaySet(invalidatedDisplaySetInstanceUID)) {
            const viewportData = viewportInfo.getViewportData();
            const newViewportData = await cornerstoneCacheService.invalidateViewportData(
              viewportData,
              invalidatedDisplaySetInstanceUID,
              dataSource,
              displaySetService
            );

            const keepCamera = true;
            cornerstoneViewportService.updateViewport(viewportId, newViewportData, keepCamera);
          }
        }
      );
      return () => {
        unsubscribe();
      };
    }, [viewportId]);

    useEffect(() => {
      // handle the default viewportType to be stack
      if (!viewportOptions.viewportType) {
        viewportOptions.viewportType = STACK;
      }

      const loadViewportData = async () => {
        const viewportData = await cornerstoneCacheService.createViewportData(
          displaySets,
          viewportOptions,
          dataSource,
          initialImageIndex
        );

        const presentations = getViewportPresentations(viewportId, viewportOptions);

        // Note: This is a hack to get the grid to re-render the OHIFCornerstoneViewport component
        // Used for segmentation hydration right now, since the logic to decide whether
        // a viewport needs to render a segmentation lives inside the CornerstoneViewportService
        // so we need to re-render (force update via change of the needsRerendering) so that React
        // does the diffing and decides we should render this again (although the id and element has not changed)
        // so that the CornerstoneViewportService can decide whether to render the segmentation or not. Not that we reached here we can turn it off.
        if (viewportOptions.needsRerendering) {
          viewportOptions.needsRerendering = false;
        }

        cornerstoneViewportService.setViewportData(
          viewportId,
          viewportData,
          viewportOptions,
          displaySetOptions,
          presentations
        );
      };

      loadViewportData();
    }, [viewportOptions, displaySets, dataSource]);

    const Notification = customizationService.getCustomization('ui.notificationComponent');

    return (
      <React.Fragment>
        <div className="viewport-wrapper">
          <div
            className="cornerstone-viewport-element"
            style={{ height: '100%', width: '100%' }}
            onContextMenu={e => e.preventDefault()}
            onMouseDown={e => e.preventDefault()}
            data-viewportid={viewportId}
            ref={el => {
              elementRef.current = el;
              if (el) {
                viewportRef.register(el);
              }
            }}
          >
            {/* Custom SEG Overlay - inside cornerstone element to only cover DICOM rendering area */}
            <SimpleSEGOverlay 
              viewportId={viewportId} 
              elementRef={elementRef}
            />
          </div>
          <CornerstoneOverlays
            viewportId={viewportId}
            toolBarService={toolbarService}
            element={elementRef.current}
            scrollbarHeight={scrollbarHeight}
            servicesManager={servicesManager}
          />
          <CinePlayer
            enabledVPElement={enabledVPElement}
            viewportId={viewportId}
            servicesManager={servicesManager}
          />
          <ActiveViewportBehavior
            viewportId={viewportId}
            servicesManager={servicesManager}
          />
        </div>
        {/* top offset of 24px to account for ViewportActionCorners. */}
        <div className="absolute top-[24px] w-full">
          {viewportDialogState.viewportId === viewportId && (
            <Notification
              id="viewport-notification"
              message={viewportDialogState.message}
              type={viewportDialogState.type}
              actions={viewportDialogState.actions}
              onSubmit={viewportDialogState.onSubmit}
              onOutsideClick={viewportDialogState.onOutsideClick}
              onKeyPress={viewportDialogState.onKeyPress}
            />
          )}
        </div>
        {/* The OHIFViewportActionCorners follows the viewport in the DOM so that it is naturally at a higher z-index.*/}
        <OHIFViewportActionCorners viewportId={viewportId} />
      </React.Fragment>
    );
  },
  areEqual
);

function _rehydrateSynchronizers(viewportId: string, syncGroupService: any) {
  const { synchronizersStore } = useSynchronizersStore.getState();
  const synchronizers = synchronizersStore[viewportId];

  if (!synchronizers) {
    return;
  }

  synchronizers.forEach(synchronizerObj => {
    if (!synchronizerObj.id) {
      return;
    }

    const { id, sourceViewports, targetViewports } = synchronizerObj;

    const synchronizer = syncGroupService.getSynchronizer(id);

    if (!synchronizer) {
      return;
    }

    const sourceViewportInfo = sourceViewports.find(
      sourceViewport => sourceViewport.viewportId === viewportId
    );

    const targetViewportInfo = targetViewports.find(
      targetViewport => targetViewport.viewportId === viewportId
    );

    const isSourceViewportInSynchronizer = synchronizer
      .getSourceViewports()
      .find(sourceViewport => sourceViewport.viewportId === viewportId);

    const isTargetViewportInSynchronizer = synchronizer
      .getTargetViewports()
      .find(targetViewport => targetViewport.viewportId === viewportId);

    // if the viewport was previously a source viewport, add it again
    if (sourceViewportInfo && !isSourceViewportInSynchronizer) {
      synchronizer.addSource({
        viewportId: sourceViewportInfo.viewportId,
        renderingEngineId: sourceViewportInfo.renderingEngineId,
      });
    }

    // if the viewport was previously a target viewport, add it again
    if (targetViewportInfo && !isTargetViewportInSynchronizer) {
      synchronizer.addTarget({
        viewportId: targetViewportInfo.viewportId,
        renderingEngineId: targetViewportInfo.renderingEngineId,
      });
    }
  });
}

// Component displayName
OHIFCornerstoneViewport.displayName = 'OHIFCornerstoneViewport';

function areEqual(prevProps, nextProps) {
  if (nextProps.needsRerendering) {
    return false;
  }

  if (prevProps.displaySets.length !== nextProps.displaySets.length) {
    return false;
  }

  if (prevProps.viewportOptions.orientation !== nextProps.viewportOptions.orientation) {
    return false;
  }

  if (prevProps.viewportOptions.toolGroupId !== nextProps.viewportOptions.toolGroupId) {
    return false;
  }

  if (
    nextProps.viewportOptions.viewportType &&
    prevProps.viewportOptions.viewportType !== nextProps.viewportOptions.viewportType
  ) {
    return false;
  }

  if (nextProps.viewportOptions.needsRerendering) {
    return false;
  }

  const prevDisplaySets = prevProps.displaySets;
  const nextDisplaySets = nextProps.displaySets;

  if (prevDisplaySets.length !== nextDisplaySets.length) {
    return false;
  }

  for (let i = 0; i < prevDisplaySets.length; i++) {
    const prevDisplaySet = prevDisplaySets[i];

    const foundDisplaySet = nextDisplaySets.find(
      nextDisplaySet =>
        nextDisplaySet.displaySetInstanceUID === prevDisplaySet.displaySetInstanceUID
    );

    if (!foundDisplaySet) {
      return false;
    }

    // check they contain the same image
    if (foundDisplaySet.images?.length !== prevDisplaySet.images?.length) {
      return false;
    }

    // check if their imageIds are the same
    if (foundDisplaySet.images?.length) {
      for (let j = 0; j < foundDisplaySet.images.length; j++) {
        if (foundDisplaySet.images[j].imageId !== prevDisplaySet.images[j].imageId) {
          return false;
        }
      }
    }
  }

  return true;
}

export default OHIFCornerstoneViewport;
