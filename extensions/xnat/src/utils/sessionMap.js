import colorTools from './colorTools';

const _map = {
  scans: [],
  sessions: [],
  subject: '',
  project: '',
  parentProject: '',
  experiment: '',
  view: '',
  permissions: {
    read: false,
    edit: false,
    create: false,
  },
  aiaaSettings: {
    serverUrl: {
      site: '',
      project: '',
    },
  },
  roiColorList: [],
  roiPresets: {
    AIM: [],
    SEG: [],
    MEAS: [],
  },
};

const sessionMap = {
  xnatRootUrl: undefined,
  /**
   * Returns the metadata for a scan, or just one property, if specified.
   *
   * @param {string} seriesInstanceUid  The seriesInstanceUid of the scan.
   * @param {string} [property] A particular property to return.
   *
   * @returns {Object[]|Object|string} An array of scans if no seriesInstanceUid
   *                                   is specified. If seriesInstanceUid is
   *                                   specified but property isn't: the scan
   *                                   metadata object. If both are specified,
   *                                   returns the specified property.
   */
  getScan: (seriesInstanceUid, property) => {
    if (!seriesInstanceUid) {
      return _map.scans;
    }

    const scan = _map.scans.find(
      scanI => scanI.seriesInstanceUid === seriesInstanceUid
    );

    if (!property) {
      return scan;
    }

    return scan[property];
  },

  /**
   * Extracts all of the scans contained in the JSON manifest in the sessionMap,
   * and stores them as scan entries with seriesInstanceUid, seriesDescription,
   * seriesNumber, and additional supplied metadata. Also stores a Session
   * metadata object.
   *
   * @param {Object} json A JSON manifest to parse.
   * @param {Object} metadata Metadata to add to the scans entries.
   *
   * @returns {null}
   */
  setSession: (json, metadata) => {
    // Set the session metadata
    _map.sessions.push({
      projectId: metadata.projectId,
      subjectId: metadata.subjectId,
      experimentId: metadata.experimentId,
      experimentLabel: metadata.experimentLabel,
    });

    const studies = json.studies;

    for (let i = 0; i < studies.length; i++) {
      const seriesList = studies[i].series;

      for (let j = 0; j < seriesList.length; j++) {
        _map.scans.push({
          seriesInstanceUid: seriesList[j].SeriesInstanceUID,
          seriesDescription: seriesList[j].SeriesDescription,
          seriesNumber: seriesList[j].SeriesNumber,
          displaySets: [],
          ...metadata,
        });
      }
    }
  },

  /**
   * Returns the metadata for a session, or just one property, if specified.
   *
   * @param {string} experimentId The experimentId of the session.
   * @param {string} [property] A particular property to return.
   *
   * @returns {Object||string} An object if no property is specified, or the
   *                           value of the specified property.
   */
  getSession: (experimentId, property) => {
    if (!experimentId) {
      return _map.sessions;
    }

    const session = _map.sessions.find(
      sessionI => sessionI.experimentId === experimentId
    );

    if (!property) {
      return session;
    }

    return session[property];
  },

  /**
   * Sets the subjectId of the view.
   *
   * @param {string} subjectId The subjectId of the view.
   *
   * @returns {null}
   */
  setSubject: subjectId => {
    _map.subject = subjectId;
  },

  /**
   * Returns the subjectId of the view.
   *
   * @returns {string}
   */
  getSubject: () => {
    return _map.subject;
  },

  /**
   * Sets the projectId of the view.
   *
   * @param {string} projectId The projectId of the view.
   *
   * @returns {null}
   */
  setProject: projectId => {
    _map.project = projectId;
  },

  /**
   * Returns the projectId of the view.
   *
   * @returns {string}
   */
  getProject: () => {
    return _map.project;
  },

  /**
   * Sets the parentProjectId of the view.
   *
   * @param {string} parentProjectId The parentProjectId of the view.
   *
   * @returns {null}
   */
  setParentProject: parentProjectId => {
    _map.parentProject = parentProjectId;
  },

  /**
   * Returns the parentProjectId of the view.
   *
   * @returns {string}
   */
  getParentProject: () => {
    return _map.parentProject;
  },

  /**
   * Returns the experimentId.
   *
   * @returns {string}
   */
  getExperimentID: (SeriesInstanceUID = undefined) => {
    if (SeriesInstanceUID === undefined) {
      // Return the experimentId if in a single session view.
      if (_map.sessions.length === 1) {
        return _map.sessions[0].experimentId;
      }
    } else {
      // Look for the scan with the matching instance UID
      const scan = _map.scans.find(
        s => s.seriesInstanceUid === SeriesInstanceUID
      );
      if (scan !== undefined) {
        return scan.experimentId;
      }
    }
  },

  /**
   * Sets the view mode, session or subject.
   *
   * @param {string} view The view mode.
   *
   * @returns {null}
   */
  setView: view => {
    _map.view = view;
  },

  /**
   * Gets the view mode, session or subject.
   *
   * @returns {string} The view mode.
   */
  getView: view => {
    return _map.view;
  },

  getAiaaSettings: () => {
    return _map.aiaaSettings;
  },
  setAiaaSiteUrl: url => {
    _map.aiaaSettings.serverUrl.site = url;
  },
  setAiaaProjectUrl: url => {
    _map.aiaaSettings.serverUrl.project = url;
  },

  setProjectRoiColorList: roiColors => {
    for (let i = 0; i < roiColors.length; i++) {
      const { label, color } = roiColors[i];
      const colorHex = colorTools.rgbToHex(color, ',');
      _map.roiColorList.push({ label: label.toLowerCase(), color: colorHex });
    }
  },
  getProjectRoiColorList: () => {
    return _map.roiColorList;
  },
  getProjectRoiColor: roiName => {
    const item = _map.roiColorList.find(
      c => c.label === roiName.trim().toLowerCase()
    );
    return item ? item.color : '#000000';
  },

  setProjectRoiPresets: roiPresets => {
    if (!roiPresets || typeof roiPresets !== 'object') {
      return;
    }
    Object.keys(_map.roiPresets).forEach(roiType => {
      const inPreset = roiPresets[roiType];
      if (!inPreset) return;

      const preset = _map.roiPresets[roiType];
      inPreset.forEach(roi => {
        preset.push({
          value: roi.label.trim().toLowerCase(),
          label: roi.label,
          color: roi.color,
          colorHex: colorTools.rgbArrayToHex(roi.color),
        });
      });
    });
  },
  getProjectRoiPreset: roiType => {
    const preset = _map.roiPresets[roiType];
    if (!preset || preset.length === 0) {
      return [];
    }
    // Include an empty entry at the top
    const empty = {
      value: '',
      label: '',
      color: [0, 0, 0],
      colorHex: '#000000',
    };
    return [empty, ...preset];
  },

  setPermissions: permissions => {
    _map.permissions = { ...permissions };
  },
  hasCreatePermission: () => {
    return _map.permissions.create;
  },
};

// For debugging purposes
if (process.env.NODE_ENV === 'development') {
  window.xnatSessionMap = {
    sessionMap,
    _internal: _map,
  };
}

export default sessionMap;
