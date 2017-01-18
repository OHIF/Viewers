import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { jQuery, $ } from 'meteor/jquery';
import { Template } from 'meteor/templating';

import { OHIF } from 'meteor/ohif:core';

/**
 *  Switches to a new tab in the tabbed studylist container
 *  This function renders either the StudyList or the Viewer template with new data.
 *
 * @param contentId The unique ID of the tab to be switched to
 */
switchToTab = function(contentId) {
    if (!contentId) {
        return;
    }

    OHIF.log.info('Switching to tab: ' + contentId);

    // Clear the cornerstone tool data to sync the measurements with the measurements API
    cornerstoneTools.globalImageIdSpecificToolStateManager = cornerstoneTools.newImageIdSpecificToolStateManager();

    $('.tab-content .tab-pane').removeClass('active');
    if (contentId !== 'studylistTab') {
        $('.tab-content .tab-pane#viewerTab').addClass('active');
    } else {
        $('.tab-content .tab-pane#' + contentId).addClass('active');
    }

    // Remove any previous Viewers from the DOM
    $('.viewerContainer').remove();
    $('.studylistContainer').remove();

    // Update the 'activeContentId' variable in Session
    Session.set('activeContentId', contentId);

    // If we are switching to the StudyList tab, reset any CSS styles
    // that have been applied to prevent scrolling in the Viewer.
    // Then stop here, since nothing needs to be re-rendered.
    let container;
    if (contentId === 'studylistTab') {
        container = $('.tab-content').find('#studylistTab').get(0);

        if (!container) {
            return;
        }

        const studylistContainer = document.createElement('div');
        studylistContainer.classList.add('studylistContainer');
        container.appendChild(studylistContainer);

        // Use Blaze to render the StudyListResult Template into the container
        Blaze.render(Template.studylistResult, studylistContainer);

        document.body.style.overflow = null;
        document.body.style.height = null;
        document.body.style.minWidth = null;
        document.body.style.position = null;
        return;
    }

    // Tab was closed at some point, stop here
    ViewerData = window.ViewerData || ViewerData;
    if (!ViewerData[contentId]) {
        return;
    }

    container = $('.tab-content').find('#viewerTab').get(0);
    container.innerHTML = '';

    // Use Blaze to render the Loading Template into the container
    // viewStudiesInTab will clear this container
    Blaze.renderWithData(Template.loadingText, {}, container);

    const studies = ViewerData[contentId].studies;

    if (studies) {
        // ViewerData already has the meta data (in cases when studylist is launched externally)
        viewStudiesInTab(contentId, studies);
    } else {
        // Use the stored ViewerData global object to retrieve the studyInstanceUid
        // related to this tab
        const studyInstanceUids = ViewerData[contentId].studyInstanceUids;

        // Attempt to retrieve the meta data (it might be cached)
        OHIF.studylist.getStudiesMetadata(studyInstanceUids, function(studies) {
            viewStudiesInTab(contentId, studies);
        });
    }
};

const viewStudiesInTab = (contentId, studies) => {
    // Tab closed while study data was being retrieved, stop here
    if (!ViewerData[contentId]) {
        OHIF.log.warn('Tab closed while study data was being retrieved');
        return;
    }

    // Once we have the study data, store it in a structure with
    // any other saved data about this tab (e.g. layout structure)
    const data = jQuery.extend({}, ViewerData[contentId]);
    data.studies = studies;

    // TODO: check if this is necessary. Since the typo bug
    // was fixed (it was contentid instead of contentId)
    data.contentId = contentId;

    if (ViewerData[contentId].studies && ViewerData[contentId].studies.length) {
        data.studies = ViewerData[contentId].studies;
    }

    // Add additional metadata to our study from the studylist
    data.studies.forEach(study => {
        const studylistStudy = StudyListStudies.findOne({
            studyInstanceUid: study.studyInstanceUid
        });

        if (!studylistStudy) {
            return;
        }

        $.extend(study, studylistStudy);
    });

    // Get tab content container given the contentId string
    // If no such container exists, stop here because something is wrong
    const container = $('.tab-content').find('#viewerTab').get(0);

    // Remove the loading text template that is inside the tab container by default
    const viewerContainer = document.createElement('div');
    viewerContainer.classList.add('viewerContainer');
    container.innerHTML = '';
    container.appendChild(viewerContainer);

    // Use Blaze to render the Viewer Template into the container
    Blaze.renderWithData(Template.viewer, data, viewerContainer);

    // Retrieve the DOM element of the viewer
    const imageViewer = $('#viewer');

    // If it is present in the DOM (it should be), then apply
    // styles to prevent page scrolling and overscrolling on mobile devices
    if (imageViewer) {
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
        document.body.style.width = '100%';
        document.body.style.minWidth = 0;

        // Prevent overscroll on mobile devices
        document.body.style.position = 'fixed';
    }
};
