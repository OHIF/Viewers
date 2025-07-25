import React from 'react';
import XNATSessionLabel from './XNATSessionLabel';
import fetchJSON from '../../utils/IO/fetchJSON';
import SessionRouter from './helpers/SessionRouter';
// import navigateConfirmationContent from './helpers/navigateConfirmationContent.js';
//import { getUnsavedRegions } from 'meteor/icr:peppermint-tools';
import sessionMap from '../../utils/sessionMap';
import {
  queryXnatSessionRoiCollections,
  queryXnatRoiCollection,
} from '../../utils/IO/queryXnatRois';
//import awaitConfirmationDialog from '../../../lib/dialogUtils/awaitConfirmationDialog.js';

import { Icons } from '@ohif/ui-next';

import '../XNATNavigationPanel.css';

interface XNATSessionProps {
  ID: string;
  label: string;
  projectId: string;
  parentProjectId: string;
  subjectId: string;
}

interface XNATSessionState {
  active: boolean;
  shared: boolean;
  hasRois: boolean;
  maskCount: number;
  contourCount: number;
}

export default class XNATSession extends React.Component<XNATSessionProps, XNATSessionState> {
  private _cancelablePromises: any[] = [];

  constructor(props: XNATSessionProps) {
    super(props);

    const active =
      this.props.projectId === sessionMap.getProject() &&
      this.props.subjectId === sessionMap.getSubject() &&
      sessionMap.getView() === 'session';

    const shared = this.props.parentProjectId !== this.props.projectId;

    this.state = {
      active,
      shared,
      hasRois: false,
      maskCount: 0,
      contourCount: 0,
    };

    this.onViewSessionClick = this.onViewSessionClick.bind(this);
    this.onLaunchViewerClick = this.onLaunchViewerClick.bind(this);

    this._cancelablePromises = [];

    this._fetchROICollectionInfo();
  }

  /**
   * componentWillUnmount - If any promises are active, cancel them to avoid
   * memory leakage by referencing `this`.
   *
   * @returns {null}
   */
  componentWillUnmount(): void {
    const cancelablePromises = this._cancelablePromises;

    for (let i = 0; i < cancelablePromises.length; i++) {
      if (typeof cancelablePromises[i].cancel === 'function') {
        cancelablePromises[i].cancel();
      }
    }
  }

  async onViewSessionClick(): Promise<void> {
    if (this.state.active) {
      return;
    }

    // TODO -> Once we have tools we can check the regions
    //const unsavedRegions = getUnsavedRegions();

    // if (unsavedRegions.hasUnsavedRegions) {
    //   const content = navigateConfirmationContent(unsavedRegions);

    //   awaitConfirmationDialog(content).then(result => {
    //     if (result === true) {
    //       this._routeToSessionView();
    //     }
    //   });
    //   return;
    // } else {
    this._routeToSessionView();
    // }
  }

  /**
   * _routeToSessionView - Initialise Router and route to new session view.
   *
   * @returns {null}
   */
  _routeToSessionView(): void {
    const { projectId, parentProjectId, subjectId, ID, label } = this.props;

    const sessionRouter = new SessionRouter(
      projectId,
      parentProjectId,
      subjectId,
      ID,
      label
    );
    sessionRouter.go();
  }

  /**
   * _getSessionButtonClassNames - Returns the class names for the subject
   * button based on state.
   *
   * @returns {string}  A string of the classnames.
   */
  _getSessionButtonClassNames(): string {
    let sessionButtonClassNames =
      'btn btn-sm btn-primary xnat-nav-button xnat-nav-session';

    if (this.state.active) {
      sessionButtonClassNames += ' xnat-nav-button-disabled';
    }

    return sessionButtonClassNames;
  }

  /**
   * _fetchROICollectionInfo - Fetches the list of ROICollections, and counts up
   * the number of contour and mask based segmentations.
   *
   * @returns {null}
   */
  _fetchROICollectionInfo(): void {
    const cancelablePromise = queryXnatSessionRoiCollections({
      projectId: this.props.projectId,
      subjectId: this.props.subjectId,
      experimentId: this.props.ID,
    });

    this._cancelablePromises.push(cancelablePromise);

    cancelablePromise.promise
      .then(result => {
        if (!result) {
          return;
        }

        const assessors = result.ResultSet.Result;

        if (
          assessors.some(
            assessor => assessor.xsiType === 'icr:roiCollectionData'
          )
        ) {
          this.setState({ hasRois: true });
        }

        this._getRoiCollectionCounts(result.ResultSet.Result);
      })
      .catch(err => console.log(err));
  }

  /**
   * _getRoiCollectionCounts - Given a list of assessors, count the number
   * of ROI Contour collections and Segmentation collections.
   *
   * @param  {Object} assessors The JSON object containing assessor info fetched
   * from XNAT.
   * @returns {null}
   */
  _getRoiCollectionCounts(assessors: any[]): void {
    const promises = [];

    for (let i = 0; i < assessors.length; i++) {
      if (assessors[i].xsiType === 'icr:roiCollectionData') {
        const cancelablePromise = queryXnatRoiCollection(
          {
            projectId: this.props.projectId,
            subjectId: this.props.subjectId,
            experimentId: this.props.ID,
          },
          assessors[i].ID
        );

        this._cancelablePromises.push(cancelablePromise);

        promises.push(cancelablePromise.promise);
      }
    }

    let maskCount = 0;
    let contourCount = 0;

    Promise.all(promises).then(promisesJSON => {
      promisesJSON.forEach(roiCollectionInfo => {
        const type = roiCollectionInfo.items[0].data_fields.collectionType;

        switch (type) {
          case 'RTSTRUCT':
          case 'AIM':
            contourCount++;
            break;
          case 'SEG':
          case 'NIFTI':
            maskCount++;
            break;
        }
      });

      this.setState({
        maskCount,
        contourCount,
      });
    });
  }

  /**
   * onLaunchViewerClick - Constructs the viewer URL and opens it in a new tab.
   *
   * @returns {null}
   */
  onLaunchViewerClick(): void {
    const { subjectId, projectId, ID, label } = this.props;
    const viewerUrl = `/VIEWER/?subjectId=${subjectId}&projectId=${projectId}&experimentId=${ID}&experimentLabel=${label}`;
    window.open(viewerUrl, '_blank');
  }

  render(): React.ReactNode {
    const { ID, label, parentProjectId } = this.props;
    const { active, shared, hasRois, maskCount, contourCount } = this.state;
    const sessionButtonClassNames = this._getSessionButtonClassNames();

    return (
      <React.Fragment>
        <div className="xnat-nav-horizontal-box">
          <a
            className={sessionButtonClassNames}
            onClick={this.onLaunchViewerClick}
            title="Launch Session in Viewer"
          >
            <Icons.LaunchInfo />
          </a>
          <XNATSessionLabel
            ID={ID}
            label={label}
            active={active}
            shared={shared}
            parentProjectId={parentProjectId}
            hasRois={hasRois}
            maskCount={maskCount}
            contourCount={contourCount}
          />
        </div>
      </React.Fragment>
    );
  }
}
