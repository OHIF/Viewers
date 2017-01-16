import { Viewerbase } from '../namespace';

/**
 * Exported Functions
 */

// getElementIfNotEmpty
import { getElementIfNotEmpty } from './lib/getElementIfNotEmpty';
Viewerbase.getElementIfNotEmpty = getElementIfNotEmpty;

// getStackDataIfNotEmpty
import { getStackDataIfNotEmpty } from './lib/getStackDataIfNotEmpty';
Viewerbase.getStackDataIfNotEmpty = getStackDataIfNotEmpty;

// switchToImageRelative
import { switchToImageRelative } from './lib/switchToImageRelative';
Viewerbase.switchToImageRelative = switchToImageRelative;

// switchToImageByIndex
import { switchToImageByIndex } from './lib/switchToImageByIndex';
Viewerbase.switchToImageByIndex = switchToImageByIndex;

// getFrameOfReferenceUID
import { getFrameOfReferenceUID } from './lib/getFrameOfReferenceUID';
Viewerbase.getFrameOfReferenceUID = getFrameOfReferenceUID;

// updateCrosshairsSynchronizer
import { updateCrosshairsSynchronizer } from './lib/updateCrosshairsSynchronizer';
Viewerbase.updateCrosshairsSynchronizer = updateCrosshairsSynchronizer;

// getImageId
import { getImageId } from './lib/getImageId';
Viewerbase.getImageId = getImageId;

// setActiveViewport
import { setActiveViewport } from './lib/setActiveViewport';
Viewerbase.setActiveViewport = setActiveViewport;

// classifyImageOrientation
import { classifyImageOrientation } from './lib/classifyImageOrientation';
Viewerbase.classifyImageOrientation = classifyImageOrientation;

// setFocusToActiveViewport
import { setFocusToActiveViewport } from './lib/setFocusToActiveViewport';
Viewerbase.setFocusToActiveViewport = setFocusToActiveViewport;

// getWADORSImageId
import { getWADORSImageId } from './lib/getWADORSImageId';
Viewerbase.getWADORSImageId = getWADORSImageId;

// updateAllViewports
import { updateAllViewports } from './lib/updateAllViewports';
Viewerbase.updateAllViewports = updateAllViewports;

// sortStudy
import { sortStudy } from './lib/sortStudy';
Viewerbase.sortStudy = sortStudy;

// updateOrientationMarkers
import { updateOrientationMarkers } from './lib/updateOrientationMarkers';
Viewerbase.updateOrientationMarkers = updateOrientationMarkers;

// isImage
import { isImage } from './lib/isImage';
Viewerbase.isImage = isImage;

// getInstanceClassDefaultViewport, setInstanceClassDefaultViewportFunction
import { getInstanceClassDefaultViewport, setInstanceClassDefaultViewportFunction } from './lib/instanceClassSpecificViewport';
Viewerbase.getInstanceClassDefaultViewport = getInstanceClassDefaultViewport;
Viewerbase.setInstanceClassDefaultViewportFunction = setInstanceClassDefaultViewportFunction;

// setMammogramViewportAlignment
import { setMammogramViewportAlignment } from './lib/setMammogramViewportAlignment';
Viewerbase.setMammogramViewportAlignment = setMammogramViewportAlignment;

// addMetaData, addSpecificMetadata, updateMetaData
import { addMetaData, addSpecificMetadata, updateMetaData } from './lib/metaDataProvider';
Viewerbase.addMetaData = addMetaData;
Viewerbase.addSpecificMetadata = addSpecificMetadata;
Viewerbase.updateMetaData = updateMetaData;

/**
 * Exported Namespaces (sub-namespaces)
 */

// imageViewerViewportData.*
import { imageViewerViewportData } from './lib/imageViewerViewportData';
Viewerbase.imageViewerViewportData = imageViewerViewportData;

// panelNavigation.*
import { panelNavigation } from './lib/panelNavigation';
Viewerbase.panelNavigation = panelNavigation;

// seriesNavigation.*
import { seriesNavigation } from './lib/seriesNavigation';
Viewerbase.seriesNavigation = seriesNavigation;

// WLPresets.*
import { WLPresets } from './lib/WLPresets';
Viewerbase.wlPresets = WLPresets;

// hotkeyUtils.*
import { hotkeyUtils } from './lib/hotkeyUtils';
Viewerbase.hotkeyUtils = hotkeyUtils;

// viewportOverlayUtils.*
import { viewportOverlayUtils } from './lib/viewportOverlayUtils';
Viewerbase.viewportOverlayUtils = viewportOverlayUtils;

// viewportUtils.*
import { viewportUtils } from './lib/viewportUtils';
Viewerbase.viewportUtils = viewportUtils;

// thumbnailDragHandlers.*
import { thumbnailDragHandlers } from './lib/thumbnailDragHandlers';
Viewerbase.thumbnailDragHandlers = thumbnailDragHandlers;

// dialogUtils.*
import { dialogUtils } from './lib/dialogUtils';
Viewerbase.dialogUtils = dialogUtils;

// unloadHandlers.*
import { unloadHandlers } from './lib/unloadHandlers';
Viewerbase.unloadHandlers = unloadHandlers;

// sortingManager.*
import { sortingManager } from './lib/sortingManager';
Viewerbase.sortingManager = sortingManager;

// crosshairsSynchronizers.*
import { crosshairsSynchronizers } from './lib/crosshairsSynchronizers';
Viewerbase.crosshairsSynchronizers = crosshairsSynchronizers;

// createStacks.*
import { createStacks } from './lib/createStacks';
Viewerbase.createStacks = createStacks;


/**
 * Exported Singletons
 */

// StackManager as "stackManager" (since it's a plain object instance, the exported name starts with a lowercase letter)
import { StackManager } from './lib/StackManager';
Viewerbase.stackManager = StackManager;

// toolManager
import { toolManager } from './lib/toolManager';
Viewerbase.toolManager = toolManager;

/**
 * Exported Helpers
 */

import { helpers } from './lib/helpers/';
Viewerbase.helpers = helpers;

/**
 * Exported Collections
 */

// sopClassDictionary
import { sopClassDictionary } from './lib/sopClassDictionary';
Viewerbase.sopClassDictionary = sopClassDictionary;

/**
 * Exported Classes
 */

// ImageSet
import { ImageSet } from './lib/classes/ImageSet';
Viewerbase.ImageSet = ImageSet;

// ResizeViewportManager
import { ResizeViewportManager } from './lib/classes/ResizeViewportManager';
Viewerbase.ResizeViewportManager = ResizeViewportManager;

// StudyMetadata, SeriesMetadata, InstanceMetadata
import { StudyMetadata } from './lib/classes/metadata/StudyMetadata';
import { SeriesMetadata } from './lib/classes/metadata/SeriesMetadata';
import { InstanceMetadata } from './lib/classes/metadata/InstanceMetadata';
Viewerbase.metadata = { StudyMetadata, SeriesMetadata, InstanceMetadata };

// TypeSafeCollection
import { TypeSafeCollection } from './lib/classes/TypeSafeCollection';
Viewerbase.TypeSafeCollection = TypeSafeCollection;

// OHIFError
import { OHIFError } from './lib/classes/OHIFError';
Viewerbase.OHIFError = OHIFError;

/**
 * Imports for Side Effects Only (Files that do not export anything...)
 */

import './lib/stackImagePositionOffsetSynchronizer.js';
import './lib/debugReactivity';
