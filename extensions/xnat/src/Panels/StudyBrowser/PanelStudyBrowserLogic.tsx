/**
 * Main PanelStudyBrowser component logic
 * Extracted from PanelStudyBrowser.tsx
 */

import React, { useState, useEffect } from 'react';
import { useImageViewer } from '@ohif/ui-next';
import { useViewportGrid } from '@ohif/ui-next';
import { StudyBrowser } from '@ohif/ui-next';
import { utils } from '@ohif/core';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@ohif/ui-next';
import { PanelStudyBrowserHeader } from './PanelStudyBrowserHeader';
import { defaultActionIcons } from './constants';
import MoreDropdownMenu from '../../Components/MoreDropdownMenu';
import { DicomMetadataStore } from '@ohif/core';

// Import the extracted modules
import { fetchStudiesForPatient } from './StudyDataManager';
import { loadInitialThumbnails } from './ThumbnailManager';
import { updateDisplaySets, setupDisplaySetSubscriptions } from './DisplaySetManager';
import { setupXNATMessageListener, fetchXNATSeriesMetadata, extractSeriesMetadataFromDataSource } from './XNATIntegration';
import { _mapDisplaySets } from './DataMappers';

const { formatDate } = utils;

// Define interface for component props
interface withAppTypes {
    servicesManager: any;
    getImageSrc: (imageId: string, options?: any) => Promise<string>;
    getStudiesForPatientByMRN: (studies: any) => Promise<any>;
    requestDisplaySetCreationForStudy: (displaySetService: any, StudyInstanceUID: string, madeInClient: boolean) => void;
    dataSource: any;
    commandsManager: any;
}

/**
 * PanelStudyBrowser component - displays study browser with thumbnails and controls
 */
function PanelStudyBrowser({
    servicesManager,
    getImageSrc,
    getStudiesForPatientByMRN,
    requestDisplaySetCreationForStudy,
    dataSource,
    commandsManager,
}: withAppTypes) {
    const { hangingProtocolService, displaySetService, uiNotificationService } = servicesManager.services;
    const navigate = useNavigate();

    // Core state
    const { StudyInstanceUIDs } = useImageViewer();
    const [{ activeViewportId, viewports }, viewportGridService] = useViewportGrid();
    const [activeTabName, setActiveTabName] = useState('all');
    const [expandedStudyInstanceUIDs, setExpandedStudyInstanceUIDs] = useState([
        ...StudyInstanceUIDs,
    ]);

    // Data state
    const [hasLoadedViewports, setHasLoadedViewports] = useState(false);
    const [studyDisplayList, setStudyDisplayList] = useState([]);
    const [displaySets, setDisplaySets] = useState([]);
    const [thumbnailImageSrcMap, setThumbnailImageSrcMap] = useState({});

    // UI state
    const [viewPresets, setViewPresets] = useState(
        servicesManager.services.customizationService.getCustomization('studyBrowser.viewPresets') || []
    );
    const [actionIcons, setActionIcons] = useState(defaultActionIcons);

    // XNAT-specific state
    const [xnatSeriesMetadata, setXnatSeriesMetadata] = useState({});

    // Action icon management
    const updateActionIconValue = actionIcon => {
        actionIcon.value = !actionIcon.value;
        const newActionIcons = [...actionIcons];
        setActionIcons(newActionIcons);
    };

    // View preset management
    const updateViewPresetValue = viewPreset => {
        if (!viewPreset) {
            return;
        }

        if (Array.isArray(viewPresets)) {
            const newViewPresets = viewPresets.map(preset => {
                preset.selected = preset.id === viewPreset.id;
                return preset;
            });
            setViewPresets(newViewPresets);
        } else {
            console.warn('XNAT: viewPresets is not an array. Cannot update preset values.');
        }
    };

    // Thumbnail double-click handler
    const onDoubleClickThumbnailHandler = displaySetInstanceUID => {
        let updatedViewports = [];
        const viewportId = activeViewportId;
        try {
            updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
                viewportId,
                displaySetInstanceUID,
                false // isHangingProtocolLayout - we can determine this from context
            );
        } catch (error) {
            console.warn(error);
            uiNotificationService.show({
                title: 'Thumbnail Double Click',
                message: 'The selected display sets could not be added to the viewport.',
                type: 'error',
                duration: 3000,
            });
        }

        viewportGridService.setDisplaySetsForViewports(updatedViewports);
    };

    // Study display list management
    useEffect(() => {
        StudyInstanceUIDs.forEach(sid => fetchStudiesForPatient(
            sid,
            dataSource,
            getStudiesForPatientByMRN,
            setStudyDisplayList,
            setExpandedStudyInstanceUIDs,
            navigate
        ));
    }, [StudyInstanceUIDs, dataSource, getStudiesForPatientByMRN, navigate]);

    // Initial thumbnail loading
    useEffect(() => {
        loadInitialThumbnails(
            hasLoadedViewports,
            activeViewportId,
            StudyInstanceUIDs,
            displaySetService,
            dataSource,
            getImageSrc,
            setThumbnailImageSrcMap,
            setHasLoadedViewports
        );
    }, [
        StudyInstanceUIDs,
        dataSource,
        displaySetService,
        getImageSrc,
        hasLoadedViewports,
        activeViewportId,
        setHasLoadedViewports,
    ]);

    // Display sets management
    useEffect(() => {
        updateDisplaySets(
            StudyInstanceUIDs,
            thumbnailImageSrcMap,
            displaySetService,
            xnatSeriesMetadata,
            setDisplaySets
        );
    }, [StudyInstanceUIDs, thumbnailImageSrcMap, displaySetService, xnatSeriesMetadata]);

    // Display set subscriptions
    useEffect(() => {
        const cleanupFunctions = setupDisplaySetSubscriptions(
            displaySetService,
            getImageSrc,
            dataSource,
            setThumbnailImageSrcMap,
            setDisplaySets,
            thumbnailImageSrcMap,
            xnatSeriesMetadata,
            _mapDisplaySets,
            StudyInstanceUIDs
        );

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [getImageSrc, dataSource, displaySetService]);

    // XNAT message listener
    useEffect(() => {
        return setupXNATMessageListener(setXnatSeriesMetadata);
    }, []);

    // XNAT series metadata fetching
    useEffect(() => {
        fetchXNATSeriesMetadata(
            StudyInstanceUIDs,
            dataSource,
            setXnatSeriesMetadata,
            extractSeriesMetadataFromDataSource
        );
    }, [StudyInstanceUIDs, dataSource]);

    // Tab creation
    const tabs = utils.createStudyBrowserTabs(StudyInstanceUIDs, studyDisplayList, displaySets);

    // Study click handler
    function _handleStudyClick(StudyInstanceUID) {
        if (!StudyInstanceUID) {
            console.warn('XNAT: Attempted to click on study with undefined StudyInstanceUID');
            return;
        }

        const shouldCollapseStudy = expandedStudyInstanceUIDs.includes(StudyInstanceUID);
        const updatedExpandedStudyInstanceUIDs = shouldCollapseStudy
            ? [...expandedStudyInstanceUIDs.filter(stdyUid => stdyUid !== StudyInstanceUID)]
            : [...expandedStudyInstanceUIDs, StudyInstanceUID];

        setExpandedStudyInstanceUIDs(updatedExpandedStudyInstanceUIDs);

        // Store the StudyInstanceUID in sessionStorage for later use
        try {
            sessionStorage.setItem('xnat_studyInstanceUID', StudyInstanceUID);
        } catch (e) {
            console.warn('XNAT: Failed to store StudyInstanceUID in sessionStorage:', e);
        }

        const madeInClient = true;

        // Check if requestDisplaySetCreationForStudy is actually a function
        if (typeof requestDisplaySetCreationForStudy === 'function') {
            requestDisplaySetCreationForStudy(displaySetService, StudyInstanceUID, madeInClient);
        } else {
            console.error('XNAT: requestDisplaySetCreationForStudy is not a function:', requestDisplaySetCreationForStudy);
        }
    }

    const activeDisplaySetInstanceUIDs = viewports.get(activeViewportId)?.displaySetInstanceUIDs;

    // Study display date getter
    const getStudyDisplayDate = (studyData) => {
        // First try getting it from study metadata directly
        if (studyData && (studyData.StudyDate || studyData.date)) {
            const dateStr = studyData.StudyDate || studyData.date;
            return formatDate(dateStr);
        }

        // Check instances if they have the date
        if (studyData.instances && studyData.instances.length > 0) {
            const instance = studyData.instances[0];
            if (instance.metadata && instance.metadata.StudyDate) {
                return formatDate(instance.metadata.StudyDate);
            }
        }

        // Try to extract from DicomMetadataStore if available
        const studyMetadata = DicomMetadataStore.getStudy(studyData.StudyInstanceUID || studyData.studyInstanceUid);
        if (studyMetadata && studyMetadata.StudyDate) {
            return formatDate(studyMetadata.StudyDate);
        }

        // Try from sessionStorage as last resort
        const storedDate = sessionStorage.getItem('xnat_studyDate');
        if (storedDate) {
            return formatDate(storedDate);
        }

        // If we reach here, we couldn't find a date
        console.warn('XNAT: No study date found for study', studyData.StudyInstanceUID || studyData.studyInstanceUid);
        return 'No Study Date';
    };

    return (
        <>
            <PanelStudyBrowserHeader
                viewPresets={viewPresets}
                updateViewPresetValue={updateViewPresetValue}
                actionIcons={actionIcons}
                updateActionIconValue={updateActionIconValue}
            />
            <Separator
                orientation="horizontal"
                className="bg-black"
                thickness="2px"
            />

            <StudyBrowser
                tabs={tabs}
                servicesManager={servicesManager}
                activeTabName={activeTabName}
                expandedStudyInstanceUIDs={expandedStudyInstanceUIDs}
                onClickStudy={_handleStudyClick}
                onClickTab={clickedTabName => {
                    setActiveTabName(clickedTabName);
                }}
                onClickThumbnail={() => { }}
                onDoubleClickThumbnail={onDoubleClickThumbnailHandler}
                activeDisplaySetInstanceUIDs={activeDisplaySetInstanceUIDs}
                showSettings={actionIcons.find(icon => icon.id === 'settings').value}
                viewPresets={viewPresets}
                ThumbnailMenuItems={MoreDropdownMenu({
                    commandsManager,
                    servicesManager,
                    menuItemsKey: 'studyBrowser.thumbnailMenuItems',
                })}
                StudyMenuItems={MoreDropdownMenu({
                    commandsManager,
                    servicesManager,
                    menuItemsKey: 'studyBrowser.studyMenuItems',
                })}
                getStudyDisplayDate={getStudyDisplayDate}
                getStudyDisplayName={study => study.displayPatientName || study.PatientName}
                getStudyDisplayDescription={study => study.displayStudyDescription || study.StudyDescription}
            />
        </>
    );
}

export default PanelStudyBrowser;
