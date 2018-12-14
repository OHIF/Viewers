import { Viewerbase } from '../namespace';

/**
 * Imports file with side effects only (files that do not export anything...)
 */

import './collections';
import './lib/debugReactivity';
import components from './components/index.js';

Viewerbase.components = components;

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

// getImageIdForImagePath
import { getImageIdForImagePath } from './lib/getImageIdForImagePath';
Viewerbase.getImageIdForImagePath = getImageIdForImagePath;

// updateCrosshairsSynchronizer
import { updateCrosshairsSynchronizer } from './lib/updateCrosshairsSynchronizer';
Viewerbase.updateCrosshairsSynchronizer = updateCrosshairsSynchronizer;

// getImageId
import { getImageId } from './lib/getImageId';
Viewerbase.getImageId = getImageId;

// setActiveViewport
import { setActiveViewport } from './lib/setActiveViewport';
Viewerbase.setActiveViewport = setActiveViewport;

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

// updateMetaDataManager
import { updateMetaDataManager } from './lib/updateMetaDataManager';
Viewerbase.updateMetaDataManager = updateMetaDataManager;

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

// displayReferenceLines
import { displayReferenceLines } from './lib/displayReferenceLines';
Viewerbase.displayReferenceLines = displayReferenceLines;

// getStudyMetadata
import { getStudyMetadata } from './lib/getStudyMetadata';
Viewerbase.getStudyMetadata = getStudyMetadata;

/**
 * Exported Namespaces (sub-namespaces)
 */

// panelNavigation.*
import { panelNavigation } from './lib/panelNavigation';
Viewerbase.panelNavigation = panelNavigation;

// prepareViewerData
import { prepareViewerData } from './lib/prepareViewerData';
Viewerbase.prepareViewerData = prepareViewerData;

// renderViewer
import { renderViewer } from './lib/renderViewer';
Viewerbase.renderViewer = renderViewer;

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

// annotateTextUtils.*
import { annotateTextUtils } from './lib/annotateTextUtils';
Viewerbase.annotateTextUtils = annotateTextUtils;

// textMarkerUtils.*
import { textMarkerUtils } from './lib/textMarkerUtils';
Viewerbase.textMarkerUtils = textMarkerUtils;

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